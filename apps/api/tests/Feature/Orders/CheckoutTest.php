<?php

use Laravel\Sanctum\Sanctum;
use Tests\Support\CreatesDomainData;

uses(CreatesDomainData::class);

it('creates an order and timeline entry during checkout', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    $modifierOptionUuid = $merchantContext['catalogItem']
        ->modifierGroups()
        ->firstOrFail()
        ->options()
        ->where('name', 'American cheese')
        ->value('uuid');

    Sanctum::actingAs($customerContext['customerUser'], [
        'customer:orders.create',
        'customer:orders.read',
        'customer:addresses.write',
    ]);

    $response = $this->postJson('/api/v1/customer/orders/checkout', [
        'branch_uuid' => $merchantContext['branch']->uuid,
        'address_uuid' => $customerContext['address']->uuid,
        'items' => [
            [
                'catalog_item_uuid' => $merchantContext['catalogItem']->uuid,
                'quantity' => 2,
                'modifier_option_uuids' => [$modifierOptionUuid],
            ],
        ],
        'notes' => 'Ring the bell',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.status', 'placed')
        ->assertJsonPath('data.total_minor', 7500)
        ->assertJsonPath('data.items.0.unit_price_minor', 3000)
        ->assertJsonPath('data.items.0.item_snapshot.selected_modifier_groups.0.options.0.name', 'American cheese');

    $this->assertDatabaseHas('orders', [
        'customer_profile_id' => $customerContext['profile']->id,
        'status' => 'placed',
    ]);

    $this->assertDatabaseHas('order_timelines', [
        'event_type' => 'order_placed',
    ]);
});

it('rejects checkout when a required modifier group is missing selections', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();

    $merchantContext['catalogItem']->modifierGroups()->firstOrFail()->update([
        'min_selected' => 1,
        'max_selected' => 1,
    ]);

    Sanctum::actingAs($customerContext['customerUser'], [
        'customer:orders.create',
        'customer:addresses.write',
    ]);

    $this->postJson('/api/v1/customer/orders/checkout', [
        'branch_uuid' => $merchantContext['branch']->uuid,
        'address_uuid' => $customerContext['address']->uuid,
        'items' => [
            [
                'catalog_item_uuid' => $merchantContext['catalogItem']->uuid,
                'quantity' => 1,
            ],
        ],
    ])->assertStatus(422);
});

it('rejects checkout when the address is outside the branch zone', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext(null, [
        'latitude' => 25.5000,
        'longitude' => 45.2000,
    ]);

    Sanctum::actingAs($customerContext['customerUser'], [
        'customer:orders.create',
        'customer:addresses.write',
    ]);

    $this->postJson('/api/v1/customer/orders/checkout', [
        'branch_uuid' => $merchantContext['branch']->uuid,
        'address_uuid' => $customerContext['address']->uuid,
        'items' => [
            [
                'catalog_item_uuid' => $merchantContext['catalogItem']->uuid,
                'quantity' => 1,
            ],
        ],
    ])->assertStatus(422);
});
