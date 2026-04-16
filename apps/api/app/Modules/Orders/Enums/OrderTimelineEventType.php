<?php

namespace App\Modules\Orders\Enums;

enum OrderTimelineEventType: string
{
    case ORDER_PLACED = 'order_placed';
    case MERCHANT_ACCEPTED = 'merchant_accepted';
    case MERCHANT_REJECTED = 'merchant_rejected';
    case DISPATCH_STARTED = 'dispatch_started';
    case RIDER_ASSIGNED = 'rider_assigned';
    case RIDER_REASSIGNED = 'rider_reassigned';
    case PICKED_UP = 'picked_up';
    case DELIVERED = 'delivered';
    case CANCELLED = 'cancelled';
    case SUPPORT_NOTE_ADDED = 'support_note_added';
}
