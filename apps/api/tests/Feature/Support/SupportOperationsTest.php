<?php

use App\Models\NotificationDelivery;
use App\Modules\Notifications\Enums\NotificationType;
use Laravel\Sanctum\Sanctum;
use Tests\Support\CreatesDomainData;

uses(CreatesDomainData::class);

it('adds a support note and queues recipient notifications', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    $opsSupport = $this->createUserWithRole('ops_support');
    $order = $this->createPlacedOrder($customerContext, $merchantContext);

    Sanctum::actingAs($opsSupport, ['ops:support.manage']);

    $this->postJson("/api/v1/ops/support/orders/{$order->uuid}/notes", [
        'body' => 'Customer asked to receive a call before drop-off.',
    ])
        ->assertCreated()
        ->assertJsonPath('data.order_uuid', $order->uuid)
        ->assertJsonPath('data.body', 'Customer asked to receive a call before drop-off.');

    $this->assertDatabaseHas('support_notes', [
        'order_id' => $order->id,
        'body' => 'Customer asked to receive a call before drop-off.',
    ]);

    $this->assertDatabaseHas('audit_logs', [
        'event' => 'support_note_added',
    ]);

    expect(NotificationDelivery::query()
        ->where('order_id', $order->id)
        ->where('notification_type', NotificationType::SUPPORT_NOTE_ADDED)
        ->count())->toBe(5);

    $this->assertDatabaseHas('notification_deliveries', [
        'order_id' => $order->id,
        'notification_type' => NotificationType::SUPPORT_NOTE_ADDED,
        'channel' => 'email',
        'provider' => 'mail',
        'status' => 'queued',
        'attempt_count' => 1,
    ]);

    $this->assertDatabaseHas('notification_deliveries', [
        'order_id' => $order->id,
        'notification_type' => NotificationType::SUPPORT_NOTE_ADDED,
        'channel' => 'push',
        'provider' => 'log',
        'status' => 'sent',
        'attempt_count' => 1,
    ]);
});

it('creates and updates a structured support case', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    $opsSupport = $this->createUserWithRole('ops_support');
    $order = $this->createPlacedOrder($customerContext, $merchantContext);

    Sanctum::actingAs($opsSupport, ['ops:support.manage']);

    $createResponse = $this->postJson("/api/v1/ops/support/orders/{$order->uuid}/cases", [
        'summary' => 'Customer requested a lobby handoff call.',
        'issue_type' => 'customer_request',
    ])->assertCreated()
        ->assertJsonPath('data.order_uuid', $order->uuid)
        ->assertJsonPath('data.status', 'open')
        ->assertJsonPath('data.issue_type', 'customer_request');

    $supportCaseUuid = $createResponse->json('data.uuid');

    $this->patchJson("/api/v1/ops/support/cases/{$supportCaseUuid}", [
        'status' => 'resolved',
        'resolution_type' => 'clarified_instructions',
        'resolution_notes' => 'Customer confirmed reception handoff and call preference.',
    ])->assertOk()
        ->assertJsonPath('data.uuid', $supportCaseUuid)
        ->assertJsonPath('data.status', 'resolved')
        ->assertJsonPath('data.resolution_type', 'clarified_instructions');

    $this->assertDatabaseHas('support_cases', [
        'order_id' => $order->id,
        'summary' => 'Customer requested a lobby handoff call.',
        'issue_type' => 'customer_request',
        'status' => 'resolved',
        'resolution_type' => 'clarified_instructions',
    ]);

    $this->assertDatabaseHas('audit_logs', [
        'event' => 'support_case_updated',
    ]);
});

it('searches support orders with support note history and support case attached', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    $opsSupport = $this->createUserWithRole('ops_support');
    $order = $this->createPlacedOrder($customerContext, $merchantContext);

    Sanctum::actingAs($opsSupport, ['ops:support.manage']);

    $this->postJson("/api/v1/ops/support/orders/{$order->uuid}/cases", [
        'summary' => 'Lobby handoff confirmation needed.',
        'issue_type' => 'customer_request',
    ])->assertCreated();

    $this->postJson("/api/v1/ops/support/orders/{$order->uuid}/notes", [
        'body' => 'Lobby handoff confirmed by customer.',
    ])->assertCreated();

    $this->getJson('/api/v1/ops/support/orders/search?q=Demo')
        ->assertOk()
        ->assertJsonPath('data.0.uuid', $order->uuid)
        ->assertJsonPath('data.0.merchant_name', 'Demo Merchant')
        ->assertJsonPath('data.0.support_notes.0.body', 'Lobby handoff confirmed by customer.')
        ->assertJsonPath('data.0.support_case.summary', 'Lobby handoff confirmation needed.')
        ->assertJsonPath('data.0.support_case.status', 'open');
});

it('cancels support orders with a structured reason and resolves the support case', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    $opsSupport = $this->createUserWithRole('ops_support');
    $order = $this->createPlacedOrder($customerContext, $merchantContext);

    Sanctum::actingAs($opsSupport, ['ops:support.manage']);

    $this->postJson("/api/v1/ops/support/orders/{$order->uuid}/cancel", [
        'summary' => 'Merchant ran out of stock for the ordered item.',
        'issue_type' => 'merchant_issue',
        'reason_code' => 'out_of_stock',
        'reason_note' => 'Merchant confirmed the SKU is depleted for the rest of the day.',
    ])
        ->assertOk()
        ->assertJsonPath('data.status', 'cancelled')
        ->assertJsonPath('data.support_case.status', 'resolved')
        ->assertJsonPath('data.support_case.issue_type', 'merchant_issue')
        ->assertJsonPath('data.support_case.cancellation_reason_code', 'out_of_stock')
        ->assertJsonPath('data.support_case.resolution_type', 'cancelled_order')
        ->assertJsonPath('data.timeline.0.metadata.reason_code', 'out_of_stock');

    $this->getJson("/api/v1/ops/notifications?order_uuid={$order->uuid}&notification_type=order_status_updated&status=sent")
        ->assertOk()
        ->assertJsonPath('meta.total', 4)
        ->assertJsonPath('data.0.notification_type', 'order_status_updated')
        ->assertJsonPath('data.0.status', 'sent');

    $this->assertDatabaseHas('notification_deliveries', [
        'order_id' => $order->id,
        'notification_type' => NotificationType::ORDER_STATUS_UPDATED,
        'channel' => 'sms',
        'provider' => 'sms-log',
        'status' => 'sent',
        'title' => 'Order cancelled',
    ]);

    $this->assertDatabaseHas('support_cases', [
        'order_id' => $order->id,
        'issue_type' => 'merchant_issue',
        'status' => 'resolved',
        'cancellation_reason_code' => 'out_of_stock',
        'resolution_type' => 'cancelled_order',
    ]);
});

it('records failed push attempts and allows ops retry once the provider recovers', function () {
    config()->set('notifications.channels.push.driver', 'failing');
    config()->set('notifications.max_attempts', 2);
    config()->set('notifications.retry_backoff_seconds', [0, 0]);

    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    $opsSupport = $this->createUserWithRole('ops_support');
    $order = $this->createPlacedOrder($customerContext, $merchantContext);

    Sanctum::actingAs($opsSupport, ['ops:support.manage']);

    $this->postJson("/api/v1/ops/support/orders/{$order->uuid}/notes", [
        'body' => 'Retry test note.',
    ])->assertCreated();

    $failedPushDelivery = NotificationDelivery::query()
        ->where('order_id', $order->id)
        ->where('notification_type', NotificationType::SUPPORT_NOTE_ADDED)
        ->where('channel', 'push')
        ->firstOrFail();

    expect($failedPushDelivery->status->value)->toBe('failed');
    expect($failedPushDelivery->provider)->toBe('failing');
    expect($failedPushDelivery->attempt_count)->toBe(2);
    expect($failedPushDelivery->last_error)->toContain('configured to fail');

    config()->set('notifications.channels.push.driver', 'log');

    $this->postJson("/api/v1/ops/notifications/{$failedPushDelivery->id}/retry")
        ->assertStatus(202)
        ->assertJsonPath('data.id', $failedPushDelivery->id)
        ->assertJsonPath('data.status', 'sent')
        ->assertJsonPath('data.provider', 'log')
        ->assertJsonPath('data.attempt_count', 3);
});
