<?php

namespace App\Modules\Notifications\Services\Transports;

use App\Models\NotificationDelivery;
use App\Modules\Notifications\Contracts\NotificationChannelTransport;
use RuntimeException;

class FailingNotificationTransport implements NotificationChannelTransport
{
    public function driverName(): string
    {
        return 'failing';
    }

    public function send(NotificationDelivery $delivery): ?string
    {
        throw new RuntimeException(sprintf(
            'The %s notification transport is configured to fail.',
            $delivery->channel->value
        ));
    }
}
