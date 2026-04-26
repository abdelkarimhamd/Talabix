<?php

namespace App\Modules\Notifications\Services\Transports;

use App\Models\NotificationDelivery;
use App\Modules\Notifications\Contracts\NotificationChannelTransport;
use Illuminate\Support\Facades\Log;

class LogPushNotificationTransport implements NotificationChannelTransport
{
    public function driverName(): string
    {
        return 'log';
    }

    public function send(NotificationDelivery $delivery): ?string
    {
        Log::info('Push notification queued through log transport.', [
            'notification_delivery_id' => $delivery->id,
            'recipient_actor' => $delivery->recipient_actor,
            'recipient_user_id' => $delivery->recipient_user_id,
            'notification_type' => $delivery->notification_type->value,
            'payload' => $delivery->payload,
        ]);

        return sprintf('log:%s', $delivery->id);
    }
}
