<?php

namespace App\Modules\Dispatch\Services;

use App\Models\DeliveryAssignment;
use App\Models\Order;
use App\Modules\Orders\Enums\OrderStatus;
use App\Modules\Orders\Enums\OrderTimelineEventType;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class DispatchSlaBreachMonitor
{
    /**
     * @return array<string, mixed>
     */
    public function snapshot(): array
    {
        $pickupTargetMinutes = max(1, (int) config('services.dispatch.pickup_sla_minutes', 30));
        $exceptionTargetMinutes = max(1, (int) config('services.dispatch.delivery_exception_response_sla_minutes', 10));
        $threshold = max(1, (int) config('services.dispatch.sla_alert_threshold', 1));
        $pickupAssignments = $this->breachedPickupAssignments($pickupTargetMinutes);
        $deliveryExceptions = $this->breachedDeliveryExceptions($exceptionTargetMinutes);
        $breachedTotal = $pickupAssignments->count() + $deliveryExceptions->count();

        return [
            'event' => 'dispatch_sla_breach_window_exceeded',
            'checked_at' => now()->toISOString(),
            'threshold' => $threshold,
            'breached_total' => $breachedTotal,
            'breached_pickup_assignments' => $pickupAssignments->count(),
            'breached_delivery_exceptions' => $deliveryExceptions->count(),
            'pickup_sla_minutes' => $pickupTargetMinutes,
            'delivery_exception_response_sla_minutes' => $exceptionTargetMinutes,
            'oldest_pickup_assignment_minutes' => $this->oldestMinutes($pickupAssignments->pluck('assigned_at')),
            'oldest_delivery_exception_minutes' => $this->oldestMinutes($deliveryExceptions->pluck('latest_exception_reported_at')),
            'sample_order_uuids' => $pickupAssignments
                ->pluck('order.uuid')
                ->merge($deliveryExceptions->pluck('uuid'))
                ->filter()
                ->unique()
                ->take(10)
                ->values()
                ->all(),
        ];
    }

    /**
     * @param  array<string, mixed>  $snapshot
     */
    public function shouldAlert(array $snapshot): bool
    {
        return (int) ($snapshot['breached_total'] ?? 0) >= (int) ($snapshot['threshold'] ?? 1);
    }

    /**
     * @return Collection<int, DeliveryAssignment>
     */
    private function breachedPickupAssignments(int $targetMinutes): Collection
    {
        return DeliveryAssignment::query()
            ->with(['order:id,uuid,status'])
            ->where('status', 'active')
            ->where('assigned_at', '<=', now()->subMinutes($targetMinutes))
            ->whereHas('order', function ($query) {
                $query->whereNotIn('status', [
                    OrderStatus::DELIVERED->value,
                    OrderStatus::CANCELLED->value,
                    OrderStatus::PICKED_UP->value,
                ]);
            })
            ->get();
    }

    /**
     * @return Collection<int, mixed>
     */
    private function breachedDeliveryExceptions(int $targetMinutes): Collection
    {
        return Order::query()
            ->with([
                'timeline' => function ($query) {
                    $query
                        ->where('event_type', OrderTimelineEventType::DELIVERY_EXCEPTION_REPORTED->value)
                        ->latest('id');
                },
            ])
            ->whereNotIn('status', [
                OrderStatus::DELIVERED->value,
                OrderStatus::CANCELLED->value,
            ])
            ->whereHas('assignments', fn ($query) => $query->where('status', 'exception_reported'))
            ->whereHas('timeline', fn ($query) => $query->where(
                'event_type',
                OrderTimelineEventType::DELIVERY_EXCEPTION_REPORTED->value
            ))
            ->get()
            ->map(function (Order $order) {
                $event = $order->timeline->first();

                return [
                    'uuid' => $order->uuid,
                    'latest_exception_reported_at' => $event?->created_at,
                ];
            })
            ->filter(function (array $order) use ($targetMinutes) {
                $reportedAt = $order['latest_exception_reported_at'];

                return $reportedAt && $reportedAt->lessThanOrEqualTo(now()->subMinutes($targetMinutes));
            })
            ->values();
    }

    /**
     * @param  Collection<int, Carbon|null>  $timestamps
     */
    private function oldestMinutes(Collection $timestamps): ?int
    {
        return $timestamps
            ->filter()
            ->map(fn ($timestamp): int => max(0, (int) floor($timestamp->diffInMinutes(now(), true))))
            ->max();
    }
}
