<?php

namespace App\Modules\Notifications\Jobs;

use App\Models\Order;
use App\Modules\Notifications\Services\NotificationDeliveryService;
use App\Modules\Orders\Enums\OrderStatus;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendOrderStatusNotificationJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Order $order,
        public readonly OrderStatus $status,
        public readonly ?int $actorUserId = null,
        public readonly array $metadata = [],
    ) {
    }

    public function handle(NotificationDeliveryService $notificationDeliveryService): void
    {
        $notificationDeliveryService->queueOrderStatusNotifications(
            $this->order,
            $this->status,
            $this->actorUserId,
            $this->metadata
        );
    }
}
