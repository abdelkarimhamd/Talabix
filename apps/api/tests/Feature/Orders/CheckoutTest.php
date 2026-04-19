<?php

use App\Models\PromotionOffer;
use Laravel\Sanctum\Sanctum;
use Illuminate\Support\Str;
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
        ->assertJsonPath('data.applied_offer_ids', [])
        ->assertJsonPath('data.pricing_snapshot.item_discount_minor', 0)
        ->assertJsonPath('data.pricing_snapshot.delivery_discount_minor', 0)
        ->assertJsonPath('data.pricing_snapshot.discount_minor', 0)
        ->assertJsonPath('data.pricing_snapshot.applied_offer_ids', [])
        ->assertJsonPath('data.pricing_snapshot.applied_offers', [])
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

it('persists applied offer ids and pricing snapshot discounts during checkout', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    $promo = PromotionOffer::query()->create([
        'uuid' => (string) Str::uuid(),
        'branch_id' => $merchantContext['branch']->id,
        'catalog_item_id' => $merchantContext['catalogItem']->id,
        'code' => 'BURGER10',
        'title' => 'Burger promo',
        'discount_label' => 'SAR 10 off',
        'discount_type' => 'item_fixed',
        'amount_minor' => 1000,
        'min_spend_minor' => 2500,
        'requires_promo_code' => true,
        'is_active' => true,
    ]);

    Sanctum::actingAs($customerContext['customerUser'], [
        'customer:orders.create',
        'customer:orders.read',
    ]);

    $response = $this->postJson('/api/v1/customer/orders/checkout', [
        'branch_uuid' => $merchantContext['branch']->uuid,
        'address_uuid' => $customerContext['address']->uuid,
        'promo_code' => 'burger10',
        'items' => [
            [
                'catalog_item_uuid' => $merchantContext['catalogItem']->uuid,
                'quantity' => 1,
            ],
        ],
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.total_minor', 3300)
        ->assertJsonPath('data.applied_offer_ids.0', $promo->uuid)
        ->assertJsonPath('data.pricing_snapshot.item_discount_minor', 1000)
        ->assertJsonPath('data.pricing_snapshot.discount_minor', 1000)
        ->assertJsonPath('data.pricing_snapshot.applied_offer_ids.0', $promo->uuid)
        ->assertJsonPath('data.pricing_snapshot.applied_offers.0.id', $promo->uuid)
        ->assertJsonPath('data.pricing_snapshot.applied_offers.0.promo_code', 'BURGER10');

    $this->assertDatabaseHas('orders', [
        'customer_profile_id' => $customerContext['profile']->id,
        'total_minor' => 3300,
    ]);
});

it('rejects invalid promo codes instead of silently ignoring them', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();

    Sanctum::actingAs($customerContext['customerUser'], [
        'customer:orders.create',
    ]);

    $this->postJson('/api/v1/customer/orders/checkout', [
        'branch_uuid' => $merchantContext['branch']->uuid,
        'address_uuid' => $customerContext['address']->uuid,
        'promo_code' => 'NOTREAL',
        'items' => [
            [
                'catalog_item_uuid' => $merchantContext['catalogItem']->uuid,
                'quantity' => 1,
            ],
        ],
    ])->assertStatus(422)
        ->assertJsonValidationErrors('promo_code');
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
