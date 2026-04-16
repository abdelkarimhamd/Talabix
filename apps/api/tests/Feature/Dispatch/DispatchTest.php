<?php

use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Tests\Support\CreatesDomainData;

uses(CreatesDomainData::class);

it('auto assigns an available rider when a merchant accepts an order', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    $this->createRiderContext(null, true, ['latitude' => 24.7140, 'longitude' => 46.6760]);
    $order = $this->createPlacedOrder($customerContext, $merchantContext);

    Sanctum::actingAs($merchantContext['merchantUser'], [
        'merchant:orders.update',
        'merchant:orders.read',
    ]);

    $this->postJson("/api/v1/merchant/orders/{$order->uuid}/accept")
        ->assertOk()
        ->assertJsonPath('data.status', 'assigned');

    $this->assertDatabaseHas('delivery_assignments', [
        'order_id' => $order->id,
        'assignment_type' => 'auto',
        'status' => 'active',
    ]);
});

it('records audit and timeline entries for ops reassignment', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    ['profile' => $firstRider] = $this->createRiderContext(null, true, ['latitude' => 24.7140, 'longitude' => 46.6760]);
    ['profile' => $secondRider] = $this->createRiderContext(null, true, ['latitude' => 24.7150, 'longitude' => 46.6770]);
    $ops = $this->createUserWithRole('ops_dispatcher');
    $order = $this->createPlacedOrder($customerContext, $merchantContext);
    $order->update([
        'status' => 'assigned',
        'rider_profile_id' => $firstRider->id,
    ]);

    \App\Models\DeliveryAssignment::query()->create([
        'order_id' => $order->id,
        'rider_profile_id' => $firstRider->id,
        'assignment_type' => 'auto',
        'status' => 'active',
        'assigned_at' => now(),
    ]);

    Sanctum::actingAs($ops, ['ops:dispatch.manage']);

    $this->postJson("/api/v1/ops/dispatch/orders/{$order->uuid}/reassign", [
        'rider_uuid' => $secondRider->uuid,
        'reason_code' => 'ops_override',
        'reason_note' => 'Ops moved the order during manual dispatch review.',
    ])->assertOk();

    $this->assertDatabaseHas('audit_logs', [
        'event' => 'rider_reassigned',
    ]);

    $this->assertDatabaseHas('order_timelines', [
        'event_type' => 'rider_reassigned',
    ]);
});

it('returns route and eta projections for ops dispatch assignments', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    ['profile' => $rider] = $this->createRiderContext(null, true, [
        'latitude' => 24.7140,
        'longitude' => 46.6760,
    ]);
    $ops = $this->createUserWithRole('ops_dispatcher');
    $order = $this->createPlacedOrder($customerContext, $merchantContext);
    $order->update([
        'status' => 'assigned',
        'rider_profile_id' => $rider->id,
    ]);

    \App\Models\DeliveryAssignment::query()->create([
        'order_id' => $order->id,
        'rider_profile_id' => $rider->id,
        'assignment_type' => 'auto',
        'status' => 'active',
        'score' => 92,
        'assigned_at' => now(),
    ]);

    Sanctum::actingAs($ops, ['ops:dispatch.manage']);

    $this->getJson('/api/v1/ops/dispatch/assignments')
        ->assertOk()
        ->assertJsonPath('data.0.orderUuid', $order->uuid)
        ->assertJsonPath('data.0.zone', 'Central Riyadh')
        ->assertJsonPath('data.0.riderName', $rider->user->name)
        ->assertJsonPath('data.0.mapsProvider', 'demo')
        ->assertJsonStructure([
            'data' => [
                [
                    'pickupEtaMinutes',
                    'dropoffEtaMinutes',
                    'riderLocation' => ['label', 'latitude', 'longitude'],
                    'pickupLocation' => ['label', 'latitude', 'longitude'],
                    'dropoffLocation' => ['label', 'latitude', 'longitude'],
                ],
            ],
        ]);
});

it('returns realtime sla reassignment and rider state visibility for ops dispatch assignments', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    ['profile' => $currentRider] = $this->createRiderContext(null, true, [
        'latitude' => 24.7140,
        'longitude' => 46.6760,
    ]);
    ['profile' => $backupRider] = $this->createRiderContext(null, true, [
        'latitude' => 24.7138,
        'longitude' => 46.6762,
    ]);
    $ops = $this->createUserWithRole('ops_dispatcher');
    $order = $this->createPlacedOrder($customerContext, $merchantContext);
    $order->update([
        'status' => 'assigned',
        'rider_profile_id' => $currentRider->id,
        'placed_at' => now()->subMinutes(42),
        'accepted_at' => now()->subMinutes(37),
    ]);

    $assignment = \App\Models\DeliveryAssignment::query()->create([
        'order_id' => $order->id,
        'rider_profile_id' => $currentRider->id,
        'assignment_type' => 'auto',
        'status' => 'active',
        'score' => 72,
        'assigned_at' => now()->subMinutes(32),
    ]);

    $currentRider->locations()->latest('recorded_at')->first()->update([
        'recorded_at' => now()->subMinutes(8),
    ]);

    Sanctum::actingAs($ops, ['ops:dispatch.manage']);

    $this->getJson('/api/v1/ops/dispatch/assignments')
        ->assertOk()
        ->assertJsonPath('data.0.assignmentId', $assignment->id)
        ->assertJsonPath('data.0.orderStatus', 'assigned')
        ->assertJsonPath('data.0.assignmentStatus', 'active')
        ->assertJsonPath('data.0.assignmentType', 'auto')
        ->assertJsonPath('data.0.riderUuid', $currentRider->uuid)
        ->assertJsonPath('data.0.realtime.channel', 'ops.dispatch')
        ->assertJsonPath('data.0.realtime.event', 'ops.dispatch.updated')
        ->assertJsonPath('data.0.sla.level', 'breached')
        ->assertJsonPath('data.0.sla.targetMinutes', 30)
        ->assertJsonPath('data.0.reassignment.canReassign', true)
        ->assertJsonPath('data.0.reassignment.reasonRequired', true)
        ->assertJsonPath('data.0.eligibleRiders.0.riderUuid', $backupRider->uuid)
        ->assertJsonStructure([
            'data' => [
                [
                    'assignedAt',
                    'lastRiderSeenAt',
                    'orderAgeMinutes',
                    'assignmentAgeMinutes',
                    'sla' => ['level', 'label', 'targetMinutes', 'elapsedMinutes', 'minutesRemaining'],
                    'reassignment' => ['canReassign', 'reasonRequired', 'reasonCodes'],
                    'eligibleRiders' => [
                        [
                            'riderUuid',
                            'riderName',
                            'availability',
                            'score',
                            'activeLoad',
                            'pickupEtaMinutes',
                            'distanceBucket',
                            'lastSeenAt',
                            'isCurrent',
                        ],
                    ],
                ],
            ],
        ]);
});

it('records reassignment reason metadata and broadcasts ops dispatch updates', function () {
    Event::fake(['App\Modules\Dispatch\Events\OpsDispatchBoardUpdated']);

    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    ['profile' => $firstRider] = $this->createRiderContext(null, true, ['latitude' => 24.7140, 'longitude' => 46.6760]);
    ['profile' => $secondRider] = $this->createRiderContext(null, true, ['latitude' => 24.7150, 'longitude' => 46.6770]);
    $ops = $this->createUserWithRole('ops_dispatcher');
    $order = $this->createPlacedOrder($customerContext, $merchantContext);
    $order->update([
        'status' => 'assigned',
        'rider_profile_id' => $firstRider->id,
    ]);

    \App\Models\DeliveryAssignment::query()->create([
        'order_id' => $order->id,
        'rider_profile_id' => $firstRider->id,
        'assignment_type' => 'auto',
        'status' => 'active',
        'assigned_at' => now(),
    ]);

    Sanctum::actingAs($ops, ['ops:dispatch.manage']);

    $this->postJson("/api/v1/ops/dispatch/orders/{$order->uuid}/reassign", [
        'rider_uuid' => $secondRider->uuid,
        'reason_code' => 'sla_risk',
        'reason_note' => 'Pickup SLA is at risk; move to the closest available rider.',
    ])->assertOk();

    $this->assertDatabaseHas('order_timelines', [
        'event_type' => 'rider_reassigned',
    ]);

    $timeline = $order->timeline()->where('event_type', 'rider_reassigned')->latest('id')->first();

    expect($timeline->metadata)->toMatchArray([
        'rider_uuid' => $secondRider->uuid,
        'previous_rider_uuid' => $firstRider->uuid,
        'reason_code' => 'sla_risk',
        'reason_note' => 'Pickup SLA is at risk; move to the closest available rider.',
    ]);

    Event::assertDispatched(
        'App\Modules\Dispatch\Events\OpsDispatchBoardUpdated',
        fn ($event) => $event->order->is($order->fresh())
            && $event->reason === 'rider_reassigned'
    );
});
