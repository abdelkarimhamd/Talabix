<?php

namespace App\Modules\Support\Enums;

enum OrderCancellationReasonCode: string
{
    case CUSTOMER_REQUEST = 'customer_request';
    case MERCHANT_UNAVAILABLE = 'merchant_unavailable';
    case OUT_OF_STOCK = 'out_of_stock';
    case ADDRESS_UNSERVICEABLE = 'address_unserviceable';
    case RIDER_ISSUE = 'rider_issue';
    case DUPLICATE_ORDER = 'duplicate_order';
    case FRAUD_REVIEW = 'fraud_review';
    case OPS_OVERRIDE = 'ops_override';
    case OTHER = 'other';
}
