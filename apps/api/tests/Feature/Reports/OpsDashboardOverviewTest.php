<?php

use App\Models\LedgerEntry;
use App\Modules\Dispatch\Enums\RiderAvailability;
use App\Modules\Orders\Enums\OrderStatus;
use App\Modules\Settlements\Services\SettlementService;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\Support\CreatesDomainData;

uses(CreatesDomainData::class);

it('returns ops dashboard kpis, merchant sales, and rider earnings', function () {
    Carbon::setTestNow('2026-04-15 12:00:00');
    $this->seedRoles();

    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    $availableRider = $this->createRiderContext();
    $busyRider = $this->createRiderContext();
    $busyRider['profile']->update(['availability' => RiderAvailability::BUSY]);
    $offlineRider = $this->createRiderContext(available: false);
    $opsUser = $this->createUserWithRole('ops_admin');

    $deliveredOrder = $this->createPlacedOrder($customerContext, $merchantContext);
    $deliveredOrder->forceFill([
        'status' => OrderStatus::DELIVERED,
        'subtotal_minor' => 2800,
        'delivery_fee_minor' => 1500,
        'platform_commission_minor' => 336,
        'rider_earning_minor' => 1500,
        'placed_at' => Carbon::now()->subDay(),
        'delivered_at' => Carbon::now()->subDay()->addMinutes(35),
        'rider_profile_id' => $availableRider['profile']->id,
    ])->save();

    $cancelledOrder = $this->createPlacedOrder($customerContext, $merchantContext);
    $cancelledOrder->forceFill([
        'status' => OrderStatus::CANCELLED,
        'subtotal_minor' => 3200,
        'delivery_fee_minor' => 1500,
        'platform_commission_minor' => 384,
        'rider_earning_minor' => 0,
        'placed_at' => Carbon::now()->subDays(2),
    ])->save();

    $activeOrder = $this->createPlacedOrder($customerContext, $merchantContext);
    $activeOrder->forceFill([
        'status' => OrderStatus::PREPARING,
        'subtotal_minor' => 4600,
        'delivery_fee_minor' => 1700,
        'platform_commission_minor' => 552,
        'rider_earning_minor' => 0,
        'placed_at' => Carbon::now()->subDays(3),
    ])->save();

    $settlementService = app(SettlementService::class);
    $settlementService->createEntriesForOrder($deliveredOrder->refresh());
    $settlementService->createAdjustment(
        $deliveredOrder->refresh(),
        -250,
        'Late handoff recovery.'
    );

    Sanctum::actingAs($opsUser, ['ops:dashboard.read']);

    $this->getJson('/api/v1/ops/dashboard/overview?range_days=7')
        ->assertOk()
        ->assertJsonPath('data.kpis.total_orders', 3)
        ->assertJsonPath('data.kpis.active_orders', 1)
        ->assertJsonPath('data.kpis.delivered_orders', 1)
        ->assertJsonPath('data.kpis.cancelled_orders', 1)
        ->assertJsonPath('data.kpis.active_merchants', 1)
        ->assertJsonPath('data.kpis.accepting_branches', 1)
        ->assertJsonPath('data.kpis.available_riders', 1)
        ->assertJsonPath('data.kpis.busy_riders', 1)
        ->assertJsonPath('data.kpis.offline_riders', 1)
        ->assertJsonPath('data.financials.platform_commission_minor', 336)
        ->assertJsonPath('data.financials.rider_earning_minor', 1500)
        ->assertJsonPath('data.financials.adjustment_minor', -250)
        ->assertJsonPath('data.rider_earnings.total_earnings_minor', 1500)
        ->assertJsonPath('data.rider_earnings.total_deliveries', 1)
        ->assertJsonPath('data.rider_earnings.riders.0.rider_uuid', $availableRider['profile']->uuid)
        ->assertJsonPath('data.merchant_sales.0.merchant_uuid', $merchantContext['merchant']->uuid)
        ->assertJsonPath('data.order_status_breakdown.2.status', 'preparing');

    expect(LedgerEntry::query()->count())->toBe(4);

    Carbon::setTestNow();
});
