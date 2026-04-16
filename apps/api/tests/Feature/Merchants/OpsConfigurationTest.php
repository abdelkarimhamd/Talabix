<?php

use Laravel\Sanctum\Sanctum;
use Tests\Support\CreatesDomainData;

uses(CreatesDomainData::class);

it('lists merchant configuration with branch zones and fee bands for ops', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $opsUser = $this->createUserWithRole('ops_admin');

    Sanctum::actingAs($opsUser, ['ops:merchants.manage']);

    $this->getJson('/api/v1/ops/configuration/merchants')
        ->assertOk()
        ->assertJsonPath('data.0.uuid', $merchantContext['merchant']->uuid)
        ->assertJsonPath('data.0.platform_commission_bps', 1200)
        ->assertJsonPath('data.0.branches.0.uuid', $merchantContext['branch']->uuid)
        ->assertJsonPath('data.0.branches.0.service_zones.0.uuid', $merchantContext['zone']->uuid)
        ->assertJsonPath('data.0.branches.0.fee_bands.0.fee_minor', 1500);
});

it('updates merchant and branch configuration while auditing ops changes', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $opsUser = $this->createUserWithRole('ops_admin');

    Sanctum::actingAs($opsUser, ['ops:merchants.manage']);

    $this->patchJson("/api/v1/ops/configuration/merchants/{$merchantContext['merchant']->uuid}", [
        'status' => 'inactive',
        'platform_commission_bps' => 1550,
    ])->assertOk()
        ->assertJsonPath('data.status', 'inactive')
        ->assertJsonPath('data.platform_commission_bps', 1550);

    $this->patchJson("/api/v1/ops/configuration/branches/{$merchantContext['branch']->uuid}", [
        'status' => 'inactive',
        'accepts_orders' => false,
    ])->assertOk()
        ->assertJsonPath('data.status', 'inactive')
        ->assertJsonPath('data.accepts_orders', false);

    $zoneResponse = $this->postJson("/api/v1/ops/configuration/branches/{$merchantContext['branch']->uuid}/service-zones", [
        'name' => 'North Ring',
        'city' => 'Riyadh',
        'postal_code' => '11564',
        'center_latitude' => 24.7444,
        'center_longitude' => 46.6788,
        'radius_meters' => 9000,
        'is_active' => true,
    ])->assertCreated()
        ->assertJsonPath('data.name', 'North Ring');

    $serviceZoneUuid = $zoneResponse->json('data.uuid');

    $this->patchJson("/api/v1/ops/configuration/service-zones/{$serviceZoneUuid}", [
        'name' => 'North Ring Extended',
        'city' => 'Riyadh',
        'postal_code' => '11564',
        'center_latitude' => 24.7444,
        'center_longitude' => 46.6788,
        'radius_meters' => 11000,
        'is_active' => false,
    ])->assertOk()
        ->assertJsonPath('data.name', 'North Ring Extended')
        ->assertJsonPath('data.radius_meters', 11000)
        ->assertJsonPath('data.is_active', false);

    $feeBandResponse = $this->postJson("/api/v1/ops/configuration/branches/{$merchantContext['branch']->uuid}/fee-bands", [
        'min_distance_meters' => 15001,
        'max_distance_meters' => 22000,
        'fee_minor' => 2100,
    ])->assertCreated()
        ->assertJsonPath('data.fee_minor', 2100);

    $feeBandUuid = $feeBandResponse->json('data.uuid');

    $this->patchJson("/api/v1/ops/configuration/fee-bands/{$feeBandUuid}", [
        'min_distance_meters' => 15001,
        'max_distance_meters' => 24000,
        'fee_minor' => 2400,
    ])->assertOk()
        ->assertJsonPath('data.max_distance_meters', 24000)
        ->assertJsonPath('data.fee_minor', 2400);

    $this->assertDatabaseHas('merchants', [
        'id' => $merchantContext['merchant']->id,
        'status' => 'inactive',
        'platform_commission_bps' => 1550,
    ]);

    $this->assertDatabaseHas('branches', [
        'id' => $merchantContext['branch']->id,
        'status' => 'inactive',
        'accepts_orders' => false,
    ]);

    $this->assertDatabaseHas('branch_service_zones', [
        'uuid' => $serviceZoneUuid,
        'name' => 'North Ring Extended',
        'radius_meters' => 11000,
        'is_active' => false,
    ]);

    $this->assertDatabaseHas('branch_fee_bands', [
        'uuid' => $feeBandUuid,
        'max_distance_meters' => 24000,
        'fee_minor' => 2400,
    ]);

    $this->assertDatabaseHas('audit_logs', [
        'event' => 'branch_updated',
    ]);
});

it('applies the configured merchant commission during checkout pricing', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();

    $merchantContext['merchant']->update([
        'platform_commission_bps' => 1550,
    ]);

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
            ],
        ],
    ])->assertCreated();

    expect($response->json('data.platform_commission_minor'))->toBe(868);
});
