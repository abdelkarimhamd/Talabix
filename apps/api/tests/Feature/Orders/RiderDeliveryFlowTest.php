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

it('lets a rider report a delivery exception while keeping the order active', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    ['riderUser' => $riderUser, 'profile' => $riderProfile] = $this->createRiderContext();
    $order = $this->createPlacedOrder($customerContext, $merchantContext);
    $order->update([
        'status' => 'picked_up',
        'rider_profile_id' => $riderProfile->id,
    ]);

    DeliveryAssignment::query()->create([
        'order_id' => $order->id,
        'rider_profile_id' => $riderProfile->id,
        'assignment_type' => 'auto',
        'status' => 'picked_up',
        'assigned_at' => now()->subMinutes(18),
        'accepted_at' => now()->subMinutes(15),
        'picked_up_at' => now()->subMinutes(3),
    ]);

    Sanctum::actingAs($riderUser, ['rider:assignments.read', 'rider:delivery.update']);

    $note = 'Tower guard says the customer moved to the side entrance.';

    $this->postJson("/api/v1/rider/orders/{$order->uuid}/delivery-exception", [
        'reason_code' => 'address_issue',
        'note' => $note,
    ])
        ->assertOk()
        ->assertJsonPath('data.status', 'picked_up')
        ->assertJsonPath('data.delivery_assignment.status', 'exception_reported')
        ->assertJsonPath('data.active_delivery_exception.reason_code', 'address_issue')
        ->assertJsonPath('data.active_delivery_exception.note', $note)
        ->assertJsonPath('data.rider_actions.0', 'complete_delivery');

    $this->getJson('/api/v1/rider/assignments/current')
        ->assertOk()
        ->assertJsonPath('data.0.active_delivery_exception.reason_code', 'address_issue');

    $this->assertDatabaseHas('delivery_assignments', [
        'order_id' => $order->id,
        'status' => 'exception_reported',
    ]);
    $this->assertDatabaseHas('order_timelines', [
        'order_id' => $order->id,
        'event_type' => 'delivery_exception_reported',
    ]);

    $timeline = $order->timeline()->where('event_type', 'delivery_exception_reported')->latest('id')->first();

    expect($timeline?->metadata)->toMatchArray([
        'reason_code' => 'address_issue',
        'reason_label' => 'Address issue',
        'note' => $note,
        'reported_by' => 'rider',
    ]);

    $timeline->forceFill(['created_at' => now()->subMinutes(16)])->save();

    $this->getJson('/api/v1/rider/assignments/current')
        ->assertOk()
        ->assertJsonPath('data.0.active_delivery_exception.response_sla.level', 'breached')
        ->assertJsonPath('data.0.active_delivery_exception.response_sla.target_minutes', 10)
        ->assertJsonPath('data.0.active_delivery_exception.response_sla.escalation_action', 'support_reassignment_required');
});
