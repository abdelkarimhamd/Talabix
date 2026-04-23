<?php

use App\Models\BranchCatalogOverride;
use Laravel\Sanctum\Sanctum;
use Tests\Support\CreatesDomainData;

uses(CreatesDomainData::class);

it('lists merchant catalog items with branch overrides and modifier groups', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();

    BranchCatalogOverride::query()->create([
        'branch_id' => $merchantContext['branch']->id,
        'catalog_item_id' => $merchantContext['catalogItem']->id,
        'price_minor' => 3200,
        'stock_quantity' => 14,
        'is_available' => true,
    ]);

    Sanctum::actingAs($merchantContext['merchantUser'], ['merchant:catalog.read']);

    $this->getJson("/api/v1/merchant/catalog/items?merchant_uuid={$merchantContext['merchant']->uuid}")
        ->assertOk()
        ->assertJsonPath('data.0.uuid', $merchantContext['catalogItem']->uuid)
        ->assertJsonPath('data.0.category_name', 'Mains')
        ->assertJsonPath('data.0.image_url', 'https://images.talabix.test/catalog/burger.jpg')
        ->assertJsonPath('data.0.modifier_groups.0.name', 'Cheese')
        ->assertJsonPath('data.0.modifier_groups.0.options.1.name', 'American cheese')
        ->assertJsonPath('data.0.branch_overrides.0.branch_uuid', $merchantContext['branch']->uuid)
        ->assertJsonPath('data.0.branch_overrides.0.price_minor', 3200)
        ->assertJsonPath('data.0.branch_overrides.0.stock_quantity', 14);
});

it('creates and updates merchant catalog items and modifier groups with audit logging', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();

    Sanctum::actingAs($merchantContext['merchantUser'], ['merchant:catalog.write']);

    $createResponse = $this->postJson('/api/v1/merchant/catalog/items', [
        'merchant_uuid' => $merchantContext['merchant']->uuid,
        'name' => 'Loaded Fries',
        'category_name' => 'Sides',
        'sku' => 'loaded-fries',
        'description' => 'Fries with sauce and cheese.',
        'image_url' => 'https://images.talabix.test/catalog/loaded-fries.jpg',
        'base_price_minor' => 1800,
        'base_stock' => 25,
        'is_active' => true,
    ])->assertCreated()
        ->assertJsonPath('data.category_name', 'Sides')
        ->assertJsonPath('data.image_url', 'https://images.talabix.test/catalog/loaded-fries.jpg');

    $catalogItemUuid = $createResponse->json('data.uuid');

    $modifierGroupResponse = $this->postJson(
        "/api/v1/merchant/catalog/items/{$catalogItemUuid}/modifier-groups",
        [
            'name' => 'Sauce',
            'description' => 'Choose one sauce.',
            'selection_type' => 'single',
            'min_selected' => 1,
            'max_selected' => 1,
            'is_active' => true,
            'sort_order' => 1,
            'options' => [
                [
                    'name' => 'Garlic',
                    'price_delta_minor' => 0,
                    'is_default' => true,
                    'is_active' => true,
                    'sort_order' => 1,
                ],
                [
                    'name' => 'Spicy mayo',
                    'price_delta_minor' => 150,
                    'is_default' => false,
                    'is_active' => true,
                    'sort_order' => 2,
                ],
            ],
        ]
    )->assertCreated()
        ->assertJsonPath('data.name', 'Sauce')
        ->assertJsonPath('data.options.1.price_delta_minor', 150);

    $modifierGroupUuid = $modifierGroupResponse->json('data.uuid');

    $this->patchJson("/api/v1/merchant/catalog/items/{$catalogItemUuid}", [
        'merchant_uuid' => $merchantContext['merchant']->uuid,
        'name' => 'Loaded Fries Supreme',
        'category_name' => 'Loaded sides',
        'sku' => 'loaded-fries',
        'description' => 'Fries with sauce, cheese, and jalapenos.',
        'image_url' => 'https://images.talabix.test/catalog/loaded-fries-supreme.jpg',
        'base_price_minor' => 2100,
        'base_stock' => 18,
        'is_active' => true,
    ])->assertOk()
        ->assertJsonPath('data.name', 'Loaded Fries Supreme')
        ->assertJsonPath('data.category_name', 'Loaded sides')
        ->assertJsonPath('data.image_url', 'https://images.talabix.test/catalog/loaded-fries-supreme.jpg')
        ->assertJsonPath('data.base_price_minor', 2100);

    $this->patchJson(
        "/api/v1/merchant/catalog/items/{$catalogItemUuid}/modifier-groups/{$modifierGroupUuid}",
        [
            'name' => 'Sauce',
            'description' => 'Choose one sauce.',
            'selection_type' => 'single',
            'min_selected' => 1,
            'max_selected' => 1,
            'is_active' => true,
            'sort_order' => 1,
            'options' => [
                [
                    'uuid' => $modifierGroupResponse->json('data.options.0.uuid'),
                    'name' => 'Garlic',
                    'price_delta_minor' => 0,
                    'is_default' => true,
                    'is_active' => true,
                    'sort_order' => 1,
                ],
                [
                    'uuid' => $modifierGroupResponse->json('data.options.1.uuid'),
                    'name' => 'Chipotle mayo',
                    'price_delta_minor' => 200,
                    'is_default' => false,
                    'is_active' => true,
                    'sort_order' => 2,
                ],
            ],
        ]
    )->assertOk()
        ->assertJsonPath('data.options.1.name', 'Chipotle mayo')
        ->assertJsonPath('data.options.1.price_delta_minor', 200);

    $this->assertDatabaseHas('audit_logs', [
        'event' => 'catalog_updated',
    ]);

    $this->assertDatabaseHas('catalog_item_modifier_groups', [
        'uuid' => $modifierGroupUuid,
        'name' => 'Sauce',
    ]);

    $this->assertDatabaseHas('catalog_item_modifier_options', [
        'name' => 'Chipotle mayo',
        'price_delta_minor' => 200,
    ]);

    $this->assertDatabaseHas('catalog_categories', [
        'merchant_id' => $merchantContext['merchant']->id,
        'name' => 'Loaded sides',
    ]);
});

it('lets merchant users manage catalog categories before adding items', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();

    Sanctum::actingAs($merchantContext['merchantUser'], [
        'merchant:catalog.read',
        'merchant:catalog.write',
    ]);

    $categoryResponse = $this->getJson("/api/v1/merchant/catalog/categories?merchant_uuid={$merchantContext['merchant']->uuid}")
        ->assertOk()
        ->assertJsonPath('data.0.name', 'Mains')
        ->assertJsonPath('data.0.item_count', 1);

    $categoryUuid = $categoryResponse->json('data.0.uuid');

    $this->postJson('/api/v1/merchant/catalog/categories', [
        'merchant_uuid' => $merchantContext['merchant']->uuid,
        'name' => 'Desserts',
        'description' => 'Sweet items prepared after the main menu.',
        'is_active' => true,
        'sort_order' => 2,
    ])->assertCreated()
        ->assertJsonPath('data.name', 'Desserts')
        ->assertJsonPath('data.item_count', 0);

    $this->patchJson("/api/v1/merchant/catalog/categories/{$categoryUuid}", [
        'merchant_uuid' => $merchantContext['merchant']->uuid,
        'name' => 'Signature mains',
        'description' => 'Best sellers and primary meals.',
        'is_active' => false,
        'sort_order' => 1,
    ])->assertOk()
        ->assertJsonPath('data.name', 'Signature mains')
        ->assertJsonPath('data.is_active', false);

    $this->assertDatabaseHas('catalog_items', [
        'id' => $merchantContext['catalogItem']->id,
        'category_name' => 'Signature mains',
    ]);

    $this->deleteJson("/api/v1/merchant/catalog/categories/{$categoryUuid}")
        ->assertOk()
        ->assertJsonPath('data.uuid', $categoryUuid);

    $this->assertDatabaseMissing('catalog_categories', [
        'uuid' => $categoryUuid,
    ]);
    $this->assertDatabaseHas('catalog_items', [
        'id' => $merchantContext['catalogItem']->id,
        'category_name' => null,
    ]);
});

it('allows ops admins to manage merchant catalog items from the ops surface', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $opsAdmin = $this->createUserWithRole('ops_admin');

    Sanctum::actingAs($opsAdmin, ['ops:merchants.manage']);

    $this->getJson("/api/v1/ops/catalog/items?merchant_uuid={$merchantContext['merchant']->uuid}")
        ->assertOk()
        ->assertJsonPath('data.0.uuid', $merchantContext['catalogItem']->uuid)
        ->assertJsonPath('data.0.category_name', 'Mains');

    $this->postJson('/api/v1/ops/catalog/items', [
        'merchant_uuid' => $merchantContext['merchant']->uuid,
        'name' => 'Cardamom Coffee',
        'category_name' => 'Drinks',
        'sku' => 'cardamom-coffee',
        'description' => 'Arabic coffee with cardamom.',
        'image_url' => 'https://images.talabix.test/catalog/cardamom-coffee.jpg',
        'base_price_minor' => 1200,
        'base_stock' => 40,
        'is_active' => true,
    ])->assertCreated()
        ->assertJsonPath('data.name', 'Cardamom Coffee')
        ->assertJsonPath('data.category_name', 'Drinks');

    $this->assertDatabaseHas('catalog_items', [
        'merchant_id' => $merchantContext['merchant']->id,
        'name' => 'Cardamom Coffee',
        'category_name' => 'Drinks',
    ]);
    $this->assertDatabaseHas('catalog_categories', [
        'merchant_id' => $merchantContext['merchant']->id,
        'name' => 'Drinks',
    ]);
});

it('returns branch catalog items with effective override values and active modifier data for customers', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();

    BranchCatalogOverride::query()->create([
        'branch_id' => $merchantContext['branch']->id,
        'catalog_item_id' => $merchantContext['catalogItem']->id,
        'price_minor' => 3450,
        'stock_quantity' => 9,
        'is_available' => false,
    ]);

    $this->getJson("/api/v1/customer/branches/{$merchantContext['branch']->uuid}/catalog")
        ->assertOk()
        ->assertJsonPath('data.0.uuid', $merchantContext['catalogItem']->uuid)
        ->assertJsonPath('data.0.category_name', 'Mains')
        ->assertJsonPath('data.0.image_url', 'https://images.talabix.test/catalog/burger.jpg')
        ->assertJsonPath('data.0.modifier_groups.0.name', 'Cheese')
        ->assertJsonPath('data.0.effective_branch_uuid', $merchantContext['branch']->uuid)
        ->assertJsonPath('data.0.effective_price_minor', 3450)
        ->assertJsonPath('data.0.effective_stock_quantity', 9)
        ->assertJsonPath('data.0.effective_is_available', false);
});
