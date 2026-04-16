<?php

namespace App\Modules\Identity\Enums;

enum UserAccountStatus: string
{
    case ACTIVE = 'active';
    case SUSPENDED = 'suspended';
    case PENDING = 'pending';
}
