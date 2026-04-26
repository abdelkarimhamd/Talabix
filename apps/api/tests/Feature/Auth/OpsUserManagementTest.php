<?php

use App\Models\User;
use App\Modules\Identity\Enums\UserAccountStatus;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\Support\CreatesDomainData;

uses(CreatesDomainData::class);

it('lets an ops user change their own password', function () {
    $this->seedRoles();
    $opsAdmin = $this->createUserWithRole('ops_admin', [
        'email' => 'owner@talabix.test',
        'password' => 'old-password',
    ]);

    Sanctum::actingAs($opsAdmin, ['ops:dashboard.read']);

    $this->patchJson('/api/v1/ops/auth/password', [
        'current_password' => 'old-password',
        'password' => 'new-password-123',
        'password_confirmation' => 'new-password-123',
    ])->assertOk();

    expect(Hash::check('new-password-123', $opsAdmin->fresh()->password))->toBeTrue();
});

it('lets ops admins invite and disable ops users', function () {
    $this->seedRoles();
    $opsAdmin = $this->createUserWithRole('ops_admin');

    Sanctum::actingAs($opsAdmin, ['ops:users.manage']);

    $response = $this->postJson('/api/v1/ops/users', [
        'name' => 'Support Lead',
        'email' => 'support-lead@talabix.test',
        'phone' => '+966500000088',
        'role' => 'ops_support',
        'account_status' => 'active',
        'password' => 'temporary-123',
        'password_confirmation' => 'temporary-123',
    ])
        ->assertCreated()
        ->assertJsonPath('data.email', 'support-lead@talabix.test')
        ->assertJsonPath('data.roles.0', 'ops_support');

    $createdUuid = $response->json('data.uuid');

    $this->patchJson("/api/v1/ops/users/{$createdUuid}", [
        'account_status' => 'suspended',
    ])
        ->assertOk()
        ->assertJsonPath('data.account_status', 'suspended');

    $created = User::query()->where('email', 'support-lead@talabix.test')->firstOrFail();

    expect($created->account_status)->toBe(UserAccountStatus::SUSPENDED);
});

it('prevents ops admins from disabling themselves', function () {
    $this->seedRoles();
    $opsAdmin = $this->createUserWithRole('ops_admin');

    Sanctum::actingAs($opsAdmin, ['ops:users.manage']);

    $this->patchJson("/api/v1/ops/users/{$opsAdmin->uuid}", [
        'account_status' => 'suspended',
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['account_status']);
});
