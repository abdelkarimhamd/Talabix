<?php

namespace App\Modules\Notifications\Jobs;

use App\Models\NotificationDelivery;
use App\Modules\Notifications\Services\NotificationDeliveryService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ProcessNotificationDeliveryJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly int $notificationDeliveryId)
    {
        $this->onQueue(config('notifications.queue', 'notifications'));
    }

    public function handle(NotificationDeliveryService $notificationDeliveryService): void
    {
        $delivery = NotificationDelivery::query()->find($this->notificationDeliveryId);

        if (! $delivery) {
            return;
        }

        $notificationDeliveryService->processDelivery($delivery);
    }
}
