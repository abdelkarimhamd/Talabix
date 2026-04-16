<?php

namespace App\Modules\Notifications\Enums;

enum NotificationChannel: string
{
    case IN_APP = 'in_app';
    case EMAIL = 'email';
    case PUSH = 'push';
    case SMS = 'sms';
}
