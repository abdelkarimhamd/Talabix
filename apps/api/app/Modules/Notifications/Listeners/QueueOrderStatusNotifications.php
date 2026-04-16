<?php

namespace App\Modules\Notifications\Listeners;

use App\Modules\Notifications\Services\NotificationDeliveryService;
use App\Modules\Orders\Events\OrderStatusChanged;

class QueueOrderStatusNotifications
{
    public function __construct(
        private readonly NotificationDeliveryService $notificationDeliveryService,
    ) {
    }

    public function handle(OrderStatusChanged $event): void
    {
        $this->notificationDeliveryService->queueOrderStatusNotifications(
            $event->order,
            $event->to,
            $event->actor?->id,
            $event->metadata
        );
    }
}
