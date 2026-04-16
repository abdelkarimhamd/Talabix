<?php

use App\Modules\Orders\Enums\OrderStatus;
use App\Modules\Settlements\Services\SettlementService;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\Support\CreatesDomainData;

uses(CreatesDomainData::class);

it('returns rider earnings for the authenticated rider only', function () {
    Carbon::setTestNow('2026-04-15 12:00:00');
    $this->seedRoles();

    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    $riderContext = $this->createRiderContext();
    $otherRiderContext = $this->createRiderContext();

    $firstOrder = $this->createPlacedOrder($customerContext, $merchantContext);
    $firstOrder->forceFill([
        'status' => OrderStatus::DELIVERED,
        'subtotal_minor' => 2800,
        'delivery_fee_minor' => 1500,
        'platform_commission_minor' => 336,
        'rider_earning_minor' => 1500,
        'rider_profile_id' => $riderContext['profile']->id,
        'placed_at' => Carbon::now()->subDay(),
        'delivered_at' => Carbon::now()->subDay()->addMinutes(35),
    ])->save();

    $secondOrder = $this->createPlacedOrder($customerContext, $merchantContext);
    $secondOrder->forceFill([
        'status' => OrderStatus::DELIVERED,
        'subtotal_minor' => 4200,
        'delivery_fee_minor' => 1700,
        'platform_commission_minor' => 504,
        'rider_earning_minor' => 1700,
        'rider_profile_id' => $riderContext['profile']->id,
        'placed_at' => Carbon::now()->subDays(2),
        'delivered_at' => Carbon::now()->subDays(2)->addMinutes(42),
    ])->save();

    $otherRiderOrder = $this->createPlacedOrder($customerContext, $merchantContext);
    $otherRiderOrder->forceFill([
        'status' => OrderStatus::DELIVERED,
        'subtotal_minor' => 3600,
        'delivery_fee_minor' => 1500,
        'platform_commission_minor' => 432,
        'rider_earning_minor' => 1500,
        'rider_profile_id' => $otherRiderContext['profile']->id,
        'placed_at' => Carbon::now()->subDay(),
        'delivered_at' => Carbon::now()->subDay()->addMinutes(31),
    ])->save();

    $settlementService = app(SettlementService::class);
    $settlementService->createEntriesForOrder($firstOrder->refresh());
    $settlementService->createEntriesForOrder($secondOrder->refresh());
    $settlementService->createEntriesForOrder($otherRiderOrder->refresh());

    Sanctum::actingAs($riderContext['riderUser'], ['rider:earnings.read']);

    $this->getJson('/api/v1/rider/earnings?range_days=7')
        ->assertOk()
        ->assertJsonPath('data.rider.uuid', $riderContext['profile']->uuid)
        ->assertJsonPath('data.rider.name', $riderContext['riderUser']->name)
        ->assertJsonPath('data.summary.deliveries_count', 2)
        ->assertJsonPath('data.summary.earnings_minor', 3200)
        ->assertJsonPath('data.summary.average_per_delivery_minor', 1600)
        ->assertJsonPath('data.summary.currency', 'SAR')
        ->assertJsonPath('data.orders.0.order_uuid', $secondOrder->uuid)
        ->assertJsonPath('data.orders.1.order_uuid', $firstOrder->uuid)
        ->assertJsonMissingPath('data.orders.2')
        ->assertJsonMissing(['order_uuid' => $otherRiderOrder->uuid]);

    Carbon::setTestNow();
});

it('requires the rider earnings token ability', function () {
    $this->seedRoles();
    $riderContext = $this->createRiderContext();

    Sanctum::actingAs($riderContext['riderUser'], ['rider:assignments.read']);

    $this->getJson('/api/v1/rider/earnings')->assertForbidden();
});
