<?php

namespace App\Modules\Settlements\Enums;

enum LedgerEntryType: string
{
    case MERCHANT_RECEIVABLE = 'merchant_receivable';
    case PLATFORM_COMMISSION = 'platform_commission';
    case RIDER_EARNING = 'rider_earning';
    case ADJUSTMENT = 'adjustment';
}
