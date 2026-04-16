<?php

namespace App\Modules\Dispatch\Enums;

enum RiderAvailability: string
{
    case OFFLINE = 'offline';
    case AVAILABLE = 'available';
    case BUSY = 'busy';
    case PAUSED = 'paused';
}
