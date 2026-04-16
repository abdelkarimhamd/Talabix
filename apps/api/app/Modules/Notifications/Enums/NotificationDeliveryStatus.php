<?php

namespace App\Modules\Notifications\Enums;

enum NotificationDeliveryStatus: string
{
    case QUEUED = 'queued';
    case SENT = 'sent';
    case FAILED = 'failed';
}
