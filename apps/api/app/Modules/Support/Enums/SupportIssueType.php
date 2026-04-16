<?php

namespace App\Modules\Support\Enums;

enum SupportIssueType: string
{
    case CUSTOMER_REQUEST = 'customer_request';
    case DELIVERY_DELAY = 'delivery_delay';
    case ADDRESS_ISSUE = 'address_issue';
    case MERCHANT_ISSUE = 'merchant_issue';
    case RIDER_ISSUE = 'rider_issue';
    case ORDER_ACCURACY = 'order_accuracy';
    case PAYMENT_ISSUE = 'payment_issue';
    case OTHER = 'other';
}
