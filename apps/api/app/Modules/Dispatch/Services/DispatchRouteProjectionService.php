<?php

namespace App\Modules\Dispatch\Services;

use App\Models\DeliveryAssignment;
use App\Models\Order;
use App\Models\RiderProfile;
use App\Modules\Orders\Enums\OrderStatus;
use App\Modules\Shared\Services\MapsProviderService;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class DispatchRouteProjectionService
{
    private const REASSIGNMENT_REASON_CODES = [
        'sla_risk',
        'rider_unavailable',
        'customer_request',
        'load_balance',
        'ops_override',
        'other',
    ];

    public function __construct(
        private readonly MapsProviderService $mapsProviderService,
        private readonly DispatchScoringService $scoringService,
    ) {}

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function activeAssignments(): Collection
    {
        return DeliveryAssignment::query()
            ->with([
                'order.assignments',
                'order.branch.serviceZones',
                'order.customerProfile.user',
                'order.customerAddress',
                'riderProfile.user',
                'riderProfile.locations',
            ])
            ->whereNotIn('status', ['reassigned', 'cancelled', 'completed'])
            ->latest('assigned_at')
            ->get()
            ->map(fn (DeliveryAssignment $assignment) => $this->projectAssignment($assignment))
            ->values();
    }

    /**
     * @return array<string, mixed>
     */
    public function projectAssignment(DeliveryAssignment $assignment): array
    {
        $order = $assignment->order;
        $rider = $assignment->riderProfile;
        $branch = $order->branch;
        $address = $order->customerAddress;
        $riderLocation = $rider->locations->sortByDesc('recorded_at')->first();
        $riderLatitude = (float) data_get($riderLocation, 'latitude', $branch->latitude);
        $riderLongitude = (float) data_get($riderLocation, 'longitude', $branch->longitude);
        $pickupEstimate = $this->mapsProviderService->distanceEstimate(
            $riderLatitude,
            $riderLongitude,
            (float) $branch->latitude,
            (float) $branch->longitude,
        );
        $dropoffEstimate = $this->mapsProviderService->distanceEstimate(
            (float) $branch->latitude,
            (float) $branch->longitude,
            (float) $address->latitude,
            (float) $address->longitude,
        );
        $orderStatus = $order->status->value;
        $assignmentAgeMinutes = $this->minutesSince($assignment->assigned_at);
        $lastReassignment = $order->timeline()
            ->where('event_type', 'rider_reassigned')
            ->latest('id')
            ->first();

        return [
            'assignmentId' => $assignment->id,
            'orderUuid' => $order->uuid,
            'orderStatus' => $orderStatus,
            'orderPlacedAt' => $order->placed_at,
            'orderAcceptedAt' => $order->accepted_at,
            'zone' => $this->zoneName($order),
            'riderUuid' => $rider->uuid,
            'riderName' => data_get($rider->user, 'name', __('messages.dispatch.fallbacks.unassigned_rider')),
            'riderAvailability' => $rider->availability->value,
            'assignmentStatus' => $assignment->status,
            'assignmentType' => $assignment->assignment_type,
            'assignedAt' => $assignment->assigned_at,
            'acceptedAt' => $assignment->accepted_at,
            'lastRiderSeenAt' => $riderLocation?->recorded_at,
            'riderLocationAgeMinutes' => $this->minutesSince($riderLocation?->recorded_at),
            'orderAgeMinutes' => $this->minutesSince($order->placed_at),
            'assignmentAgeMinutes' => $assignmentAgeMinutes,
            'score' => $assignment->score ?? 0,
            'activeLoad' => $this->activeLoad($rider),
            'distanceBucket' => $this->distanceBucket((int) $pickupEstimate['distance_meters']),
            'pickupEtaMinutes' => (int) $pickupEstimate['duration_minutes'],
            'dropoffEtaMinutes' => (int) $dropoffEstimate['duration_minutes'],
            'riderLocation' => [
                'label' => $riderLocation
                    ? __('messages.dispatch.locations.rider_live_position')
                    : __('messages.dispatch.locations.rider_location_unavailable'),
                'latitude' => $riderLatitude,
                'longitude' => $riderLongitude,
            ],
            'pickupLocation' => [
                'label' => $branch->name,
                'latitude' => (float) $branch->latitude,
                'longitude' => (float) $branch->longitude,
            ],
            'dropoffLocation' => [
                'label' => $address->label,
                'latitude' => (float) $address->latitude,
                'longitude' => (float) $address->longitude,
            ],
            'mapsProvider' => $pickupEstimate['provider'],
            'sla' => $this->slaSnapshot($assignmentAgeMinutes),
            'reassignment' => [
                'canReassign' => $this->canReassign($order, $assignment),
                'reasonRequired' => true,
                'reasonCodes' => self::REASSIGNMENT_REASON_CODES,
                'lastReassignedAt' => $lastReassignment?->created_at,
            ],
            'eligibleRiders' => $this->eligibleRiders($order, $rider),
            'realtime' => [
                'channel' => 'ops.dispatch',
                'event' => 'ops.dispatch.updated',
            ],
        ];
    }

    private function zoneName(Order $order): string
    {
        $address = $order->customerAddress;

        $zone = $order->branch->serviceZones
            ->where('is_active', true)
            ->first(function ($zone) use ($address) {
                return $zone->city === $address->city
                    && $this->mapsProviderService->distanceMeters(
                        (float) $zone->center_latitude,
                        (float) $zone->center_longitude,
                        (float) $address->latitude,
                        (float) $address->longitude,
                    ) <= $zone->radius_meters;
            });

        return (string) data_get($zone, 'name', $order->branch->city);
    }

    private function activeLoad(RiderProfile $rider): int
    {
        return $rider->assignments()
            ->whereNotIn('status', ['reassigned', 'cancelled', 'completed'])
            ->count();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function eligibleRiders(Order $order, RiderProfile $currentRider): array
    {
        $branch = $order->branch;

        return RiderProfile::query()
            ->with(['user', 'locations'])
            ->get()
            ->reject(fn (RiderProfile $rider) => $rider->id === $currentRider->id)
            ->map(function (RiderProfile $rider) use ($order, $branch) {
                $score = $this->scoringService->score($order, $rider);

                if ($score === null) {
                    return null;
                }

                $latestLocation = $rider->locations->sortByDesc('recorded_at')->first();
                $pickupEstimate = $this->mapsProviderService->distanceEstimate(
                    (float) $latestLocation->latitude,
                    (float) $latestLocation->longitude,
                    (float) $branch->latitude,
                    (float) $branch->longitude,
                );

                return [
                    'riderUuid' => $rider->uuid,
                    'riderName' => data_get($rider->user, 'name', __('messages.dispatch.fallbacks.unknown_rider')),
                    'availability' => $rider->availability->value,
                    'score' => $score,
                    'activeLoad' => $this->activeLoad($rider),
                    'pickupEtaMinutes' => (int) $pickupEstimate['duration_minutes'],
                    'distanceBucket' => $this->distanceBucket((int) $pickupEstimate['distance_meters']),
                    'lastSeenAt' => $latestLocation->recorded_at,
                    'isCurrent' => false,
                ];
            })
            ->filter()
            ->sortByDesc('score')
            ->values()
            ->all();
    }

    private function canReassign(Order $order, DeliveryAssignment $assignment): bool
    {
        $orderStatus = $order->status;

        return $assignment->status === 'active'
            && ! in_array($orderStatus, [OrderStatus::DELIVERED, OrderStatus::CANCELLED], true);
    }

    private function minutesSince(?CarbonInterface $timestamp): int
    {
        if (! $timestamp) {
            return 0;
        }

        return max(0, (int) floor($timestamp->diffInMinutes(now(), true)));
    }

    /**
     * @return array<string, mixed>
     */
    private function slaSnapshot(int $elapsedMinutes): array
    {
        $targetMinutes = max(1, (int) config('services.dispatch.pickup_sla_minutes', 30));
        $warningMinutes = max(1, (int) config('services.dispatch.pickup_sla_warning_minutes', 10));
        $minutesRemaining = $targetMinutes - $elapsedMinutes;

        if ($minutesRemaining < 0) {
            $level = 'breached';
            $label = __('messages.dispatch.sla.breached');
        } elseif ($minutesRemaining <= $warningMinutes) {
            $level = 'warning';
            $label = __('messages.dispatch.sla.warning');
        } else {
            $level = 'on_track';
            $label = __('messages.dispatch.sla.on_track');
        }

        return [
            'level' => $level,
            'label' => $label,
            'targetMinutes' => $targetMinutes,
            'elapsedMinutes' => $elapsedMinutes,
            'minutesRemaining' => $minutesRemaining,
        ];
    }

    private function distanceBucket(int $distanceMeters): string
    {
        if ($distanceMeters < 2000) {
            return '<2km';
        }

        if ($distanceMeters <= 5000) {
            return '2-5km';
        }

        return '>5km';
    }
}
