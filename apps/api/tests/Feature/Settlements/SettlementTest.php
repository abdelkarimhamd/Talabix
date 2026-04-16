<?php

use App\Models\DeliveryAssignment;
use App\Modules\Settlements\Services\SettlementService;
use Laravel\Sanctum\Sanctum;
use Tests\Support\CreatesDomainData;

uses(CreatesDomainData::class);

it('creates settlement ledger rows when a rider delivers an order', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    ['riderUser' => $riderUser, 'profile' => $riderProfile] = $this->createRiderContext();
    $order = $this->createPlacedOrder($customerContext, $merchantContext);
    $order->update([
        'status' => 'assigned',
        'rider_profile_id' => $riderProfile->id,
    ]);

    DeliveryAssignment::query()->create([
        'order_id' => $order->id,
        'rider_profile_id' => $riderProfile->id,
        'assignment_type' => 'auto',
        'status' => 'active',
        'assigned_at' => now(),
    ]);

    Sanctum::actingAs($riderUser, ['rider:assignments.read', 'rider:assignments.update', 'rider:delivery.update']);

    $this->postJson("/api/v1/rider/orders/{$order->uuid}/accept-assignment")->assertOk();
    $this->postJson("/api/v1/rider/orders/{$order->uuid}/picked-up")->assertOk();
    $this->postJson("/api/v1/rider/orders/{$order->uuid}/delivered", [
        'proof_type' => 'recipient_confirmation',
        'recipient_name' => 'Settlement Test Customer',
        'proof_notes' => 'Order delivered successfully.',
        'proof_reference' => 'settlement-proof',
    ])->assertOk();

    $this->assertDatabaseCount('ledger_entries', 3);
});

it('does not duplicate generated settlement ledger rows for the same delivered order', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    ['profile' => $riderProfile] = $this->createRiderContext();
    $order = $this->createPlacedOrder($customerContext, $merchantContext);
    $order->update([
        'status' => 'delivered',
        'rider_profile_id' => $riderProfile->id,
        'delivered_at' => now(),
    ]);

    app(SettlementService::class)->createEntriesForOrder($order->refresh());
    app(SettlementService::class)->createEntriesForOrder($order->refresh());

    $this->assertDatabaseCount('ledger_entries', 3);
});
