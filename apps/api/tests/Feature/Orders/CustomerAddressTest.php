<?php

use Laravel\Sanctum\Sanctum;
use Tests\Support\CreatesDomainData;

uses(CreatesDomainData::class);

it('stores and updates richer customer address details while keeping a default address', function () {
    $this->seedRoles();
    $customerContext = $this->createCustomerContext();

    Sanctum::actingAs($customerContext['customerUser'], [
        'customer:profile.read',
        'customer:addresses.write',
    ]);

    $storeResponse = $this->postJson('/api/v1/customer/addresses', [
        'label' => 'Office',
        'line_1' => 'King Abdullah Road',
        'line_2' => 'Suite 20',
        'building' => 'Business Gate',
        'floor' => '20',
        'apartment' => '2008',
        'landmark' => 'East lobby',
        'delivery_notes' => 'Leave at reception',
        'city' => 'Riyadh',
        'latitude' => 24.7123,
        'longitude' => 46.6701,
        'is_default' => true,
    ]);

    $storeResponse
        ->assertCreated()
        ->assertJsonPath('data.building', 'Business Gate')
        ->assertJsonPath('data.delivery_notes', 'Leave at reception')
        ->assertJsonPath('data.is_default', true);

    $newAddressUuid = $storeResponse->json('data.uuid');

    $this->assertDatabaseHas('customer_addresses', [
        'uuid' => $newAddressUuid,
        'building' => 'Business Gate',
        'floor' => '20',
        'apartment' => '2008',
        'landmark' => 'East lobby',
        'delivery_notes' => 'Leave at reception',
        'is_default' => true,
    ]);

    $this->assertDatabaseHas('customer_addresses', [
        'uuid' => $customerContext['address']->uuid,
        'is_default' => false,
    ]);

    $this->patchJson("/api/v1/customer/addresses/{$newAddressUuid}", [
        'label' => 'Office',
        'line_1' => 'King Abdullah Road',
        'line_2' => 'Suite 20',
        'building' => 'Business Gate',
        'floor' => '20',
        'apartment' => '2010',
        'landmark' => 'South lobby',
        'delivery_notes' => 'Call before arrival',
        'city' => 'Riyadh',
        'latitude' => 24.7123,
        'longitude' => 46.6701,
        'is_default' => false,
    ])
        ->assertOk()
        ->assertJsonPath('data.apartment', '2010')
        ->assertJsonPath('data.landmark', 'South lobby')
        ->assertJsonPath('data.delivery_notes', 'Call before arrival');

    expect(
        \App\Models\CustomerAddress::query()
            ->where('customer_profile_id', $customerContext['profile']->id)
            ->where('is_default', true)
            ->count()
    )->toBe(1);
});
