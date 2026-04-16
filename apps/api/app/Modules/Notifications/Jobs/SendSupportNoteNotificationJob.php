<?php

namespace App\Modules\Notifications\Jobs;

use App\Models\Order;
use App\Models\SupportNote;
use App\Modules\Notifications\Services\NotificationDeliveryService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendSupportNoteNotificationJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Order $order,
        public readonly SupportNote $note,
        public readonly ?int $actorUserId = null,
    ) {}

    public function handle(NotificationDeliveryService $notificationDeliveryService): void
    {
        $notificationDeliveryService->queueSupportNoteAdded(
            $this->order,
            $this->note,
            $this->actorUserId
        );
    }
}
