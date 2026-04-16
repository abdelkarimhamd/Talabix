<?php

namespace App\Modules\Orders\Services;

use App\Models\Order;
use App\Models\OrderTimeline;
use App\Models\User;
use App\Modules\Orders\Enums\OrderStatus;
use App\Modules\Orders\Enums\OrderTimelineEventType;
use App\Modules\Orders\Events\OrderStatusChanged;
use App\Modules\Orders\Exceptions\InvalidOrderTransitionException;
use Illuminate\Support\Facades\DB;

class OrderLifecycleService
{
    private const TRANSITIONS = [
        OrderStatus::PLACED->value => [
            OrderStatus::ACCEPTED,
            OrderStatus::CANCELLED,
        ],
        OrderStatus::ACCEPTED->value => [
            OrderStatus::PREPARING,
            OrderStatus::ASSIGNED,
            OrderStatus::CANCELLED,
        ],
        OrderStatus::PREPARING->value => [
            OrderStatus::READY_FOR_PICKUP,
            OrderStatus::ASSIGNED,
            OrderStatus::CANCELLED,
        ],
        OrderStatus::READY_FOR_PICKUP->value => [
            OrderStatus::ASSIGNED,
            OrderStatus::CANCELLED,
        ],
        OrderStatus::ASSIGNED->value => [
            OrderStatus::PICKED_UP,
            OrderStatus::CANCELLED,
        ],
        OrderStatus::PICKED_UP->value => [
            OrderStatus::DELIVERED,
        ],
        OrderStatus::DELIVERED->value => [],
        OrderStatus::CANCELLED->value => [],
    ];

    public function transition(
        Order $order,
        OrderStatus $toStatus,
        ?User $actor = null,
        array $metadata = [],
        ?OrderTimelineEventType $eventType = null
    ): Order {
        $fromStatus = $order->status;

        if (! $fromStatus instanceof OrderStatus) {
            $fromStatus = OrderStatus::from((string) $order->status);
        }

        $allowed = self::TRANSITIONS[$fromStatus->value] ?? [];

        if (! in_array($toStatus, $allowed, true)) {
            throw new InvalidOrderTransitionException(sprintf(
                'Cannot transition order from %s to %s.',
                $fromStatus->value,
                $toStatus->value
            ));
        }

        DB::transaction(function () use ($order, $toStatus, $actor, $metadata, $fromStatus, $eventType) {
            $order->status = $toStatus;

            if ($toStatus === OrderStatus::ACCEPTED) {
                $order->accepted_at = now();
            }

            if ($toStatus === OrderStatus::DELIVERED) {
                $order->delivered_at = now();
                $order->payment_status = \App\Modules\Orders\Enums\PaymentStatus::COLLECTED_COD;
            }

            $order->save();

            $this->timelineRecord(
                $order,
                $eventType ?? $this->eventTypeForStatus($toStatus),
                $actor,
                $metadata,
                $fromStatus,
                $toStatus
            );

            event(new OrderStatusChanged($order, $fromStatus, $toStatus, $actor, $metadata));
        });

        return $order->refresh();
    }

    public function recordTimelineEvent(
        Order $order,
        OrderTimelineEventType $eventType,
        ?User $actor = null,
        array $metadata = []
    ): OrderTimeline {
        return $this->timelineRecord($order, $eventType, $actor, $metadata, $order->status, $order->status);
    }

    private function timelineRecord(
        Order $order,
        OrderTimelineEventType $eventType,
        ?User $actor,
        array $metadata,
        OrderStatus $fromStatus,
        OrderStatus $toStatus
    ): OrderTimeline {
        return OrderTimeline::query()->create([
            'order_id' => $order->id,
            'event_type' => $eventType,
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'actor_user_id' => $actor?->id,
            'actor_role' => $actor?->getRoleNames()->implode(','),
            'metadata' => $metadata,
        ]);
    }

    private function eventTypeForStatus(OrderStatus $status): OrderTimelineEventType
    {
        return match ($status) {
            OrderStatus::ACCEPTED => OrderTimelineEventType::MERCHANT_ACCEPTED,
            OrderStatus::ASSIGNED => OrderTimelineEventType::RIDER_ASSIGNED,
            OrderStatus::PICKED_UP => OrderTimelineEventType::PICKED_UP,
            OrderStatus::DELIVERED => OrderTimelineEventType::DELIVERED,
            OrderStatus::CANCELLED => OrderTimelineEventType::CANCELLED,
            default => OrderTimelineEventType::DISPATCH_STARTED,
        };
    }
}
