<?php

namespace App\Modules\Orders\Enums;

enum OrderStatus: string
{
    case PLACED = 'placed';
    case ACCEPTED = 'accepted';
    case PREPARING = 'preparing';
    case READY_FOR_PICKUP = 'ready_for_pickup';
    case ASSIGNED = 'assigned';
    case PICKED_UP = 'picked_up';
    case DELIVERED = 'delivered';
    case CANCELLED = 'cancelled';
}
