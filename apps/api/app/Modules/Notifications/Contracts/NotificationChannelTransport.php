<?php

namespace App\Modules\Notifications\Contracts;

use App\Models\NotificationDelivery;

interface NotificationChannelTransport
{
    public function driverName(): string;

    public function send(NotificationDelivery $delivery): ?string;
}
