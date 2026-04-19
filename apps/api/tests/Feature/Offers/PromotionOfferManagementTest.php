<?php

use Laravel\Sanctum\Sanctum;
use Tests\Support\CreatesDomainData;

uses(CreatesDomainData::class);

it('lets ops users create update and delete promotion offers', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $opsUser = $this->createUserWithRole('ops_admin');

    Sanctum::actingAs($opsUser, ['ops:merchants.manage']);

    $createResponse = $this->postJson('/api/v1/ops/promotion-offers', [
        'branch_uuid' => $merchantContext['branch']->uuid,
        'catalog_item_uuid' => $merchantContext['catalogItem']->uuid,
        'code' => 'BURGER10',
        'title' => 'Burger promo',
        'discount_label' => 'SAR 10 off',
        'discount_type' => 'item_fixed',
        'amount_minor' => 1000,
        'min_spend_minor' => 2500,
        'requires_promo_code' => true,
        'is_active' => true,
    ]);

    $createResponse->assertCreated()
        ->assertJsonPath('data.title', 'Burger promo')
        ->assertJsonPath('data.code', 'BURGER10')
        ->assertJsonPath('data.requires_promo_code', true);

    $offerUuid = $createResponse->json('data.uuid');

    $this->getJson('/api/v1/ops/promotion-offers')
        ->assertOk()
        ->assertJsonPath('data.0.uuid', $offerUuid);

    $this->patchJson("/api/v1/ops/promotion-offers/{$offerUuid}", [
        'branch_uuid' => $merchantContext['branch']->uuid,
        'catalog_item_uuid' => $merchantContext['catalogItem']->uuid,
        'code' => null,
        'title' => 'Free burger delivery',
        'discount_label' => 'Free delivery',
        'discount_type' => 'delivery',
        'min_spend_minor' => 2500,
        'requires_promo_code' => false,
        'is_active' => true,
    ])->assertOk()
        ->assertJsonPath('data.title', 'Free burger delivery')
        ->assertJsonPath('data.discount_type', 'delivery')
        ->assertJsonPath('data.requires_promo_code', false);

    $this->deleteJson("/api/v1/ops/promotion-offers/{$offerUuid}")
        ->assertNoContent();

    $this->assertDatabaseMissing('promotion_offers', [
        'uuid' => $offerUuid,
    ]);
});

it('lets merchant managers manage offers only for their own merchant', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $otherMerchantContext = $this->createMerchantContext();

    Sanctum::actingAs($merchantContext['merchantUser'], [
        'merchant:catalog.read',
        'merchant:catalog.write',
    ]);

    $this->postJson('/api/v1/merchant/promotion-offers', [
        'branch_uuid' => $merchantContext['branch']->uuid,
        'catalog_item_uuid' => $merchantContext['catalogItem']->uuid,
        'code' => 'BURGER10',
        'title' => 'Merchant burger promo',
        'discount_label' => 'SAR 10 off',
        'discount_type' => 'item_fixed',
        'amount_minor' => 1000,
        'min_spend_minor' => 2500,
        'requires_promo_code' => true,
        'is_active' => true,
    ])->assertCreated()
        ->assertJsonPath('data.title', 'Merchant burger promo');

    $this->postJson('/api/v1/merchant/promotion-offers', [
        'branch_uuid' => $otherMerchantContext['branch']->uuid,
        'catalog_item_uuid' => $otherMerchantContext['catalogItem']->uuid,
        'title' => 'Other merchant promo',
        'discount_label' => '20% off',
        'discount_type' => 'item_percent',
        'percent' => 20,
        'min_spend_minor' => 2500,
        'requires_promo_code' => false,
        'is_active' => true,
    ])->assertForbidden();
});
