<?php

namespace App\Modules\Merchants\Policies;

use App\Models\Merchant;
use App\Models\MerchantStaffMembership;
use App\Models\User;

class MerchantPolicy
{
    public function view(User $user, Merchant $merchant): bool
    {
        return $this->isOps($user)
            || MerchantStaffMembership::query()
                ->where('merchant_id', $merchant->id)
                ->where('user_id', $user->id)
                ->where('status', 'active')
                ->exists();
    }

    public function update(User $user, Merchant $merchant): bool
    {
        return $this->isOps($user)
            || MerchantStaffMembership::query()
                ->where('merchant_id', $merchant->id)
                ->where('user_id', $user->id)
                ->where('membership_role', 'merchant_manager')
                ->where('status', 'active')
                ->exists();
    }

    private function isOps(User $user): bool
    {
        return $user->hasAnyRole(['ops_admin', 'ops_dispatcher', 'ops_support']);
    }
}
