<?php

namespace App\Modules\Dispatch\Services;

use App\Models\DeliveryAssignment;
use App\Models\Order;
use App\Models\RiderProfile;
use App\Modules\Orders\Enums\OrderStatus;
use App\Modules\Orders\Enums\OrderTimelineEventType;
use App\Modules\Orders\Services\OrderLifecycleService;
use Illuminate\Support\Collection;

class AutoAssignOrderAction
{
    public function __construct(
        private readonly DispatchScoringService $scoringService,
        private readonly OrderLifecycleService $lifecycleService,
    ) {
    }

    public function execute(Order $order): ?DeliveryAssignment
    {
        if ($order->status !== OrderStatus::ACCEPTED) {
            return null;
        }

        $candidate = RiderProfile::query()
            ->with('locations')
            ->get()
            ->map(function (RiderProfile $rider) use ($order) {
                return [
                    'rider' => $rider,
                    'score' => $this->scoringService->score($order, $rider),
                ];
            })
            ->filter(fn (array $candidate) => ! is_null($candidate['score']))
            ->sortByDesc('score')
            ->first();

        if (! $candidate) {
            return null;
        }

        /** @var RiderProfile $rider */
        $rider = $candidate['rider'];

        $assignment = DeliveryAssignment::query()->create([
            'order_id' => $order->id,
            'rider_profile_id' => $rider->id,
            'assignment_type' => 'auto',
            'status' => 'active',
            'score' => $candidate['score'],
            'assigned_at' => now(),
        ]);

        $order->forceFill(['rider_profile_id' => $rider->id])->save();
        $order = $this->lifecycleService->transition($order, OrderStatus::ASSIGNED, null, [
            'assignment_id' => $assignment->id,
            'assignment_type' => 'auto',
            'score' => $candidate['score'],
        ]);

        $this->lifecycleService->recordTimelineEvent($order, OrderTimelineEventType::DISPATCH_STARTED, null, [
            'assignment_id' => $assignment->id,
        ]);

        return $assignment;
    }
}
