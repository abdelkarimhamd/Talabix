<?php

namespace App\Modules\Shared\Enums;

enum AuditActionType: string
{
    case ORDER_CANCELLED = 'order_cancelled';
    case RIDER_REASSIGNED = 'rider_reassigned';
    case BRANCH_UPDATED = 'branch_updated';
    case CATALOG_UPDATED = 'catalog_updated';
    case SETTLEMENT_ADJUSTED = 'settlement_adjusted';
    case PERMISSION_CHANGED = 'permission_changed';
    case SUPPORT_CASE_UPDATED = 'support_case_updated';
    case SUPPORT_NOTE_ADDED = 'support_note_added';
}
