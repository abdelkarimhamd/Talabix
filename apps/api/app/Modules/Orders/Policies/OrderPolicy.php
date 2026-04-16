<?php

namespace App\Modules\Orders\Policies;

use App\Models\MerchantStaffMembership;
use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    public function view(User $user, Order $order): bool
    {
        return $this->isOps($user)
            || $order->customerProfile?->user_id === $user->id
            || $order->riderProfile?->user_id === $user->id
            || MerchantStaffMembership::query()
                ->where('merchant_id', $order->merchant_id)
                ->where('user_id', $user->id)
                ->where('status', 'active')
                ->exists();
    }

    public function merchantUpdate(User $user, Order $order): bool
    {
        return MerchantStaffMembership::query()
            ->where('merchant_id', $order->merchant_id)
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->exists();
    }

    public function riderUpdate(User $user, Order $order): bool
    {
        return $order->riderProfile?->user_id === $user->id;
    }

    public function dispatch(User $user, Order $order): bool
    {
        return $this->isOps($user);
    }

    private function isOps(User $user): bool
    {
        return $user->hasAnyRole(['ops_admin', 'ops_dispatcher', 'ops_support']);
    }
}
