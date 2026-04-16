<?php

use App\Models\Branch;
use App\Models\Order;
use App\Models\RiderProfile;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('orders.{orderUuid}', function ($user, string $orderUuid) {
    $order = Order::query()->where('uuid', $orderUuid)->first();

    if (! $order) {
        return false;
    }

    return $order->customerProfile?->user_id === $user->id
        || $order->riderProfile?->user_id === $user->id
        || $user->hasAnyRole(['ops_admin', 'ops_dispatcher', 'ops_support']);
});

Broadcast::channel('branches.{branchUuid}.orders', function ($user, string $branchUuid) {
    $branch = Branch::query()->where('uuid', $branchUuid)->first();

    if (! $branch) {
        return false;
    }

    return $user->merchantMemberships()->where('branch_id', $branch->id)->exists()
        || $user->merchantMemberships()->where('merchant_id', $branch->merchant_id)->exists();
});

Broadcast::channel('riders.{riderUuid}', function ($user, string $riderUuid) {
    $rider = RiderProfile::query()->where('uuid', $riderUuid)->first();

    return $rider?->user_id === $user->id || $user->hasAnyRole(['ops_admin', 'ops_dispatcher']);
});

Broadcast::channel('ops.dispatch', function ($user) {
    return $user->hasAnyRole(['ops_admin', 'ops_dispatcher', 'ops_support']);
});
