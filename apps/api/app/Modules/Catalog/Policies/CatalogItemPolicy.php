<?php

namespace App\Modules\Catalog\Policies;

use App\Models\CatalogItem;
use App\Models\MerchantStaffMembership;
use App\Models\User;

class CatalogItemPolicy
{
    public function view(User $user, CatalogItem $catalogItem): bool
    {
        return $this->isMerchantMember($user, $catalogItem->merchant_id)
            || $user->hasRole('ops_admin');
    }

    public function update(User $user, CatalogItem $catalogItem): bool
    {
        return $user->hasRole('ops_admin')
            || MerchantStaffMembership::query()
                ->where('merchant_id', $catalogItem->merchant_id)
                ->where('user_id', $user->id)
                ->where('membership_role', 'merchant_manager')
                ->where('status', 'active')
                ->exists();
    }

    private function isMerchantMember(User $user, int $merchantId): bool
    {
        return MerchantStaffMembership::query()
            ->where('merchant_id', $merchantId)
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->exists();
    }
}
