<?php

namespace App\Modules\Notifications\Enums;

enum NotificationType: string
{
    case ORDER_STATUS_UPDATED = 'order_status_updated';
    case SUPPORT_NOTE_ADDED = 'support_note_added';
}
