<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = [
            'customer:profile.read',
            'customer:profile.write',
            'customer:addresses.write',
            'customer:notifications.read',
            'customer:notifications.update',
            'customer:orders.read',
            'customer:orders.create',
            'merchant:dashboard.read',
            'merchant:orders.read',
            'merchant:orders.update',
            'merchant:catalog.read',
            'merchant:catalog.write',
            'merchant:notifications.read',
            'merchant:notifications.update',
            'rider:availability.update',
            'rider:location.update',
            'rider:assignments.read',
            'rider:assignments.update',
            'rider:delivery.update',
            'rider:earnings.read',
            'rider:notifications.read',
            'rider:notifications.update',
            'ops:dashboard.read',
            'ops:merchants.manage',
            'ops:dispatch.manage',
            'ops:settlements.read',
            'ops:settlements.manage',
            'ops:support.manage',
            'ops:users.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $roleMap = [
            'customer' => [
                'customer:profile.read',
                'customer:profile.write',
                'customer:addresses.write',
                'customer:notifications.read',
                'customer:notifications.update',
                'customer:orders.read',
                'customer:orders.create',
            ],
            'rider' => [
                'rider:availability.update',
                'rider:location.update',
                'rider:assignments.read',
                'rider:assignments.update',
                'rider:delivery.update',
                'rider:earnings.read',
                'rider:notifications.read',
                'rider:notifications.update',
            ],
            'merchant_staff' => [
                'merchant:dashboard.read',
                'merchant:orders.read',
                'merchant:orders.update',
                'merchant:catalog.read',
                'merchant:notifications.read',
                'merchant:notifications.update',
            ],
            'merchant_manager' => [
                'merchant:dashboard.read',
                'merchant:orders.read',
                'merchant:orders.update',
                'merchant:catalog.read',
                'merchant:catalog.write',
                'merchant:notifications.read',
                'merchant:notifications.update',
            ],
            'ops_dispatcher' => [
                'ops:dashboard.read',
                'ops:dispatch.manage',
                'ops:support.manage',
            ],
            'ops_support' => [
                'ops:dashboard.read',
                'ops:support.manage',
                'ops:settlements.read',
            ],
            'ops_admin' => $permissions,
        ];

        foreach ($roleMap as $role => $rolePermissions) {
            Role::findOrCreate($role, 'web')->syncPermissions($rolePermissions);
        }
    }
}
