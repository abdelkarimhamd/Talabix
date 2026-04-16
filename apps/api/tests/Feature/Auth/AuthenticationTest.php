<?php

use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Tests\Support\CreatesDomainData;

uses(CreatesDomainData::class);

it('issues a sanctum token for a customer login', function () {
    $this->seedRoles();
    $customer = $this->createUserWithRole('customer', ['email' => 'customer@talabix.test']);

    $response = $this->postJson('/api/v1/customer/auth/login', [
        'email' => 'customer@talabix.test',
        'password' => 'password',
        'device_name' => 'iphone-15',
    ]);

    $response
        ->assertOk()
        ->assertJsonPath('data.user.email', $customer->email);

    expect($response->json('data.token'))->toBeString()->not->toBeEmpty();
});

it('registers a customer and creates a profile', function () {
    $this->seedRoles();

    $response = $this->postJson('/api/v1/customer/auth/register', [
        'name' => 'Alya Customer',
        'email' => 'alya@talabix.test',
        'phone' => '+966500000001',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'device_name' => 'iphone-15',
    ]);

    $response
        ->assertCreated()
        ->assertJsonPath('data.user.email', 'alya@talabix.test')
        ->assertJsonPath('data.user.name', 'Alya Customer');

    $user = User::query()->where('email', 'alya@talabix.test')->firstOrFail();

    expect($response->json('data.token'))->toBeString()->not->toBeEmpty();
    expect($user->hasRole('customer'))->toBeTrue();

    $this->assertDatabaseHas('customer_profiles', [
        'user_id' => $user->id,
    ]);
});

it('rejects duplicate customer registration emails', function () {
    $this->seedRoles();
    $this->createUserWithRole('customer', ['email' => 'duplicate@talabix.test']);

    $this->postJson('/api/v1/customer/auth/register', [
        'name' => 'Duplicate Customer',
        'email' => 'duplicate@talabix.test',
        'phone' => '+966500000002',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'device_name' => 'iphone-15',
    ])->assertStatus(422);
});

it('throttles repeated customer login attempts', function () {
    $this->seedRoles();
    $this->createUserWithRole('customer', ['email' => 'ratelimit@talabix.test']);

    foreach (range(1, 5) as $attempt) {
        $this->postJson('/api/v1/customer/auth/login', [
            'email' => 'ratelimit@talabix.test',
            'password' => 'wrong-password',
            'device_name' => 'iphone-15',
        ])->assertStatus(422);
    }

    $this->postJson('/api/v1/customer/auth/login', [
        'email' => 'ratelimit@talabix.test',
        'password' => 'wrong-password',
        'device_name' => 'iphone-15',
    ])->assertStatus(429);
});

it('updates the signed-in customer profile', function () {
    $this->seedRoles();
    ['customerUser' => $customer] = $this->createCustomerContext();

    Sanctum::actingAs($customer, ['customer:profile.write']);

    $this->patchJson('/api/v1/customer/auth/me', [
        'name' => 'Updated Customer',
        'phone' => '+966500009999',
    ])
        ->assertOk()
        ->assertJsonPath('data.name', 'Updated Customer')
        ->assertJsonPath('data.phone', '+966500009999');

    $this->assertDatabaseHas('users', [
        'id' => $customer->id,
        'name' => 'Updated Customer',
        'phone' => '+966500009999',
    ]);
});
