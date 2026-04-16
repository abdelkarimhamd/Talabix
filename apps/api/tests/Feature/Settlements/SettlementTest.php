<?php

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

    \App\Models\DeliveryAssignment::query()->create([
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
