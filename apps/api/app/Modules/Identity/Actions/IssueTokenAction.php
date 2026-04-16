<?php

namespace App\Modules\Identity\Actions;

use App\Models\User;
use App\Modules\Identity\Enums\UserAccountStatus;
use Illuminate\Auth\AuthenticationException;
use Laravel\Sanctum\NewAccessToken;

class IssueTokenAction
{
    private const ABILITY_MAP = [
        'customer' => [
            'roles' => ['customer'],
            'abilities' => [
                'customer:profile.read',
                'customer:profile.write',
                'customer:addresses.write',
                'customer:notifications.read',
                'customer:notifications.update',
                'customer:orders.read',
                'customer:orders.create',
            ],
        ],
        'merchant' => [
            'roles' => ['merchant_staff', 'merchant_manager'],
            'abilities' => [
                'merchant:dashboard.read',
                'merchant:orders.read',
                'merchant:orders.update',
                'merchant:catalog.read',
                'merchant:catalog.write',
                'merchant:notifications.read',
                'merchant:notifications.update',
            ],
        ],
        'rider' => [
            'roles' => ['rider'],
            'abilities' => [
                'rider:availability.update',
                'rider:location.update',
                'rider:assignments.read',
                'rider:assignments.update',
                'rider:delivery.update',
                'rider:earnings.read',
                'rider:notifications.read',
                'rider:notifications.update',
            ],
        ],
        'ops' => [
            'roles' => ['ops_dispatcher', 'ops_support', 'ops_admin'],
            'abilities' => [
                'ops:dashboard.read',
                'ops:merchants.manage',
                'ops:dispatch.manage',
                'ops:settlements.read',
                'ops:settlements.manage',
                'ops:support.manage',
                'ops:users.manage',
            ],
        ],
    ];

    public function execute(User $user, string $actor, string $deviceName): NewAccessToken
    {
        if ($user->account_status !== UserAccountStatus::ACTIVE) {
            throw new AuthenticationException('Your account is not active.');
        }

        $config = self::ABILITY_MAP[$actor] ?? null;

        if (! $config || ! $user->hasAnyRole($config['roles'])) {
            throw new AuthenticationException('The supplied account cannot access this actor surface.');
        }

        $abilities = array_values(array_filter(
            $config['abilities'],
            fn (string $ability) => $user->can($ability)
        ));

        return $user->createToken(
            sprintf('%s:%s', $actor, $deviceName),
            $abilities,
            now()->addDays(30)
        );
    }
}
