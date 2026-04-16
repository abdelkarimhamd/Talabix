<?php

namespace App\Modules\Support\Enums;

enum SupportResolutionType: string
{
    case CUSTOMER_CONTACTED = 'customer_contacted';
    case MERCHANT_CONTACTED = 'merchant_contacted';
    case RIDER_CONTACTED = 'rider_contacted';
    case CLARIFIED_INSTRUCTIONS = 'clarified_instructions';
    case CANCELLED_ORDER = 'cancelled_order';
    case COMPENSATION_OFFERED = 'compensation_offered';
    case MONITORING_ONLY = 'monitoring_only';
    case OTHER = 'other';
}
