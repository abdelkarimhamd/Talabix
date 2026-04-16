<?php

use App\Models\DeliveryAssignment;
use Laravel\Sanctum\Sanctum;
use Tests\Support\CreatesDomainData;

uses(CreatesDomainData::class);

it('lets a rider accept an assigned order and exposes rider actions', function () {
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

    $this->getJson('/api/v1/rider/assignments/current')
        ->assertOk()
        ->assertJsonPath('data.0.rider_actions.0', 'accept_assignment');

    $this->postJson("/api/v1/rider/orders/{$order->uuid}/accept-assignment")
        ->assertOk()
        ->assertJsonPath('data.rider_actions.0', 'confirm_pickup');

    expect(
        DeliveryAssignment::query()
            ->where('order_id', $order->id)
            ->where('rider_profile_id', $riderProfile->id)
            ->first()
            ?->accepted_at
    )->not->toBeNull();
});

it('requires assignment acceptance before pickup', function () {
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

    Sanctum::actingAs($riderUser, ['rider:delivery.update']);

    $this->postJson("/api/v1/rider/orders/{$order->uuid}/picked-up")
        ->assertUnprocessable()
        ->assertJsonValidationErrors('assignment');
});

it('stores delivery proof metadata when a rider completes the order', function () {
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

    Sanctum::actingAs($riderUser, ['rider:assignments.update', 'rider:delivery.update']);

    $this->postJson("/api/v1/rider/orders/{$order->uuid}/accept-assignment")->assertOk();
    $this->postJson("/api/v1/rider/orders/{$order->uuid}/picked-up")
        ->assertOk()
        ->assertJsonPath('data.status', 'picked_up');

    $this->postJson("/api/v1/rider/orders/{$order->uuid}/delivered", [
        'proof_type' => 'recipient_confirmation',
        'recipient_name' => 'Sara Al-Qahtani',
        'proof_notes' => 'Customer received the bag at the lobby desk.',
        'proof_reference' => 'proof-demo-001',
    ])
        ->assertOk()
        ->assertJsonPath('data.status', 'delivered')
        ->assertJsonPath('data.delivery_assignment.status', 'completed')
        ->assertJsonPath('data.delivery_assignment.proof_metadata.proof_type', 'recipient_confirmation')
        ->assertJsonPath('data.delivery_assignment.proof_metadata.recipient_name', 'Sara Al-Qahtani');

    $this->assertDatabaseHas('delivery_assignments', [
        'order_id' => $order->id,
        'status' => 'completed',
    ]);
});
