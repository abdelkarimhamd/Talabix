<?php

use App\Modules\Orders\Enums\OrderStatus;
use App\Modules\Settlements\Services\SettlementService;
use Laravel\Sanctum\Sanctum;
use Tests\Support\CreatesDomainData;

uses(CreatesDomainData::class);

it('filters settlement ledger results and returns summary totals', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    ['profile' => $riderProfile] = $this->createRiderContext();
    $opsAdmin = $this->createUserWithRole('ops_admin');
    $order = $this->createPlacedOrder($customerContext, $merchantContext);
    $order->update([
        'status' => OrderStatus::DELIVERED,
        'rider_profile_id' => $riderProfile->id,
        'delivered_at' => now(),
    ]);

    app(SettlementService::class)->createEntriesForOrder($order->refresh());
    app(SettlementService::class)->createAdjustment($order->refresh(), -250, 'Manual commission correction.');

    Sanctum::actingAs($opsAdmin, ['ops:settlements.read', 'ops:settlements.manage']);

    $this->getJson("/api/v1/ops/settlements/ledger?order_uuid={$order->uuid}&entry_type=adjustment&direction=negative")
        ->assertOk()
        ->assertJsonPath('meta.total_entries', 1)
        ->assertJsonPath('meta.total_amount_minor', -250)
        ->assertJsonPath('data.0.entry_type', 'adjustment')
        ->assertJsonPath('data.0.order_uuid', $order->uuid)
        ->assertJsonPath('data.0.notes', 'Manual commission correction.');
});

it('creates an audited settlement adjustment for a delivered order', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    ['profile' => $riderProfile] = $this->createRiderContext();
    $opsAdmin = $this->createUserWithRole('ops_admin');
    $order = $this->createPlacedOrder($customerContext, $merchantContext);
    $order->update([
        'status' => OrderStatus::DELIVERED,
        'rider_profile_id' => $riderProfile->id,
        'delivered_at' => now(),
    ]);

    Sanctum::actingAs($opsAdmin, ['ops:settlements.manage', 'ops:settlements.read']);

    $this->postJson("/api/v1/ops/settlements/orders/{$order->uuid}/adjustments", [
        'amount_minor' => -500,
        'notes' => 'Late handoff goodwill adjustment.',
    ])
        ->assertCreated()
        ->assertJsonPath('data.entry_type', 'adjustment')
        ->assertJsonPath('data.amount_minor', -500)
        ->assertJsonPath('data.order_uuid', $order->uuid);

    $this->assertDatabaseHas('ledger_entries', [
        'order_id' => $order->id,
        'entry_type' => 'adjustment',
        'amount_minor' => -500,
    ]);

    $this->assertDatabaseHas('audit_logs', [
        'event' => 'settlement_adjusted',
    ]);
});

it('rejects settlement adjustments for non-delivered orders with a localized message', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    $opsAdmin = $this->createUserWithRole('ops_admin');
    $order = $this->createPlacedOrder($customerContext, $merchantContext);

    Sanctum::actingAs($opsAdmin, ['ops:settlements.manage']);

    $this->withHeader('X-Talabix-Locale', 'ar')
        ->postJson("/api/v1/ops/settlements/orders/{$order->uuid}/adjustments", [
            'amount_minor' => -500,
            'notes' => 'Should be rejected before delivery.',
        ])
        ->assertUnprocessable()
        ->assertJsonPath('message', 'لا يمكن إنشاء التسويات إلا للطلبات المسلّمة.');

    $this->assertDatabaseCount('ledger_entries', 0);
    $this->assertDatabaseMissing('audit_logs', [
        'event' => 'settlement_adjusted',
    ]);
});

it('exports the filtered ledger as csv', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    ['profile' => $riderProfile] = $this->createRiderContext();
    $opsAdmin = $this->createUserWithRole('ops_admin');
    $order = $this->createPlacedOrder($customerContext, $merchantContext);
    $order->update([
        'status' => OrderStatus::DELIVERED,
        'rider_profile_id' => $riderProfile->id,
        'delivered_at' => now(),
    ]);

    app(SettlementService::class)->createAdjustment($order->refresh(), 300, 'Positive reconciliation test.');

    Sanctum::actingAs($opsAdmin, ['ops:settlements.read']);

    $response = $this->get("/api/v1/ops/settlements/export?entry_type=adjustment&order_uuid={$order->uuid}");

    $response->assertOk();
    expect($response->streamedContent())->toContain('order_uuid,merchant_name,rider_name,entry_type,amount_minor,currency,notes,occurred_at');
    expect($response->streamedContent())->toContain($order->uuid);
    expect($response->streamedContent())->toContain('Positive reconciliation test.');
});

it('exports localized Arabic ledger headers when requested', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    ['profile' => $riderProfile] = $this->createRiderContext();
    $opsAdmin = $this->createUserWithRole('ops_admin');
    $order = $this->createPlacedOrder($customerContext, $merchantContext);
    $order->update([
        'status' => OrderStatus::DELIVERED,
        'rider_profile_id' => $riderProfile->id,
        'delivered_at' => now(),
    ]);

    app(SettlementService::class)->createAdjustment($order->refresh(), 300, 'Arabic header export test.');

    Sanctum::actingAs($opsAdmin, ['ops:settlements.read']);

    $response = $this->withHeader('X-Talabix-Locale', 'ar')
        ->get("/api/v1/ops/settlements/export?entry_type=adjustment&order_uuid={$order->uuid}");

    $response->assertOk();
    expect($response->streamedContent())->toContain('"رقم القيد","رقم الطلب","اسم التاجر","اسم المندوب","نوع القيد"');
    expect($response->streamedContent())->toContain($order->uuid);
});
