<?php

namespace App\Modules\Notifications\Services\Transports;

use App\Models\NotificationDelivery;
use App\Modules\Notifications\Contracts\NotificationChannelTransport;
use Illuminate\Support\Facades\Log;

class LogSmsNotificationTransport implements NotificationChannelTransport
{
    public function driverName(): string
    {
        return 'sms-log';
    }

    public function send(NotificationDelivery $delivery): ?string
    {
        Log::info('SMS notification queued through log transport.', [
            'notification_delivery_id' => $delivery->id,
            'recipient_actor' => $delivery->recipient_actor,
            'recipient_user_id' => $delivery->recipient_user_id,
            'recipient_phone' => $delivery->recipientUser?->phone,
            'notification_type' => $delivery->notification_type?->value ?? $delivery->notification_type,
            'payload' => $delivery->payload,
        ]);

        return sprintf('sms-log:%s', $delivery->id);
    }
}
