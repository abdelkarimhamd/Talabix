<?php

namespace App\Modules\Orders\Enums;

enum PaymentStatus: string
{
    case PENDING_COD = 'pending_cod';
    case COLLECTED_COD = 'collected_cod';
    case WAIVED = 'waived';
}
