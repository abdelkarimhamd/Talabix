<?php

namespace App\Modules\Support\Enums;

enum SupportCaseStatus: string
{
    case OPEN = 'open';
    case INVESTIGATING = 'investigating';
    case RESOLVED = 'resolved';
}
