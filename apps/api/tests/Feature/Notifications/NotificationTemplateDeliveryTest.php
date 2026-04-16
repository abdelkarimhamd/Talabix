<?php

use App\Models\NotificationDelivery;
use App\Modules\Notifications\Services\NotificationDeliveryService;
use App\Modules\Orders\Enums\OrderStatus;
use Laravel\Sanctum\Sanctum;
use Tests\Support\CreatesDomainData;

uses(CreatesDomainData::class);

it('builds rider-specific assignment copy for in-app notifications', function () {
    $this->seedRoles();

    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    ['profile' => $riderProfile] = $this->createRiderContext();
    $order = $this->createPlacedOrder($customerContext, $merchantContext);
    $order->update([
        'status' => OrderStatus::ASSIGNED,
        'rider_profile_id' => $riderProfile->id,
    ]);

    app(NotificationDeliveryService::class)->queueOrderStatusNotifications(
        $order->fresh(),
        OrderStatus::ASSIGNED,
        null,
        ['assignment_type' => 'auto']
    );

    $delivery = NotificationDelivery::query()
        ->where('order_id', $order->id)
        ->where('recipient_actor', 'rider')
        ->where('channel', 'in_app')
        ->firstOrFail();

    expect($delivery->title)->toBe('New assignment ready');
    expect($delivery->body)->toContain('Main Branch');
    expect($delivery->payload['action_route'])->toBe('/delivery');
});

it('queues customer sms deliveries for critical delivered updates with actor-specific copy', function () {
    $this->seedRoles();

    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    ['riderUser' => $riderUser, 'profile' => $riderProfile] = $this->createRiderContext();
    $order = $this->createPlacedOrder($customerContext, $merchantContext);
    $order->update([
        'status' => OrderStatus::DELIVERED,
        'rider_profile_id' => $riderProfile->id,
    ]);

    app(NotificationDeliveryService::class)->queueOrderStatusNotifications(
        $order->fresh(),
        OrderStatus::DELIVERED,
        $riderUser->id
    );

    $delivery = NotificationDelivery::query()
        ->where('order_id', $order->id)
        ->where('recipient_actor', 'customer')
        ->where('channel', 'sms')
        ->firstOrFail();

    expect($delivery->provider)->toBe('sms-log');
    expect($delivery->status->value)->toBe('sent');
    expect($delivery->title)->toBe('Order delivered');
    expect($delivery->body)->toContain('marked delivered');
    expect($delivery->payload['action_route'])->toBe("/orders/{$order->uuid}");
});

it('records failed sms attempts and lets ops retry them after the provider recovers', function () {
    config()->set('notifications.channels.sms.driver', 'failing');
    config()->set('notifications.max_attempts', 2);
    config()->set('notifications.retry_backoff_seconds', [0, 0]);

    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    $opsSupport = $this->createUserWithRole('ops_support');
    $order = $this->createPlacedOrder($customerContext, $merchantContext);

    app(NotificationDeliveryService::class)->queueOrderStatusNotifications(
        $order->fresh(),
        OrderStatus::CANCELLED
    );

    $delivery = NotificationDelivery::query()
        ->where('order_id', $order->id)
        ->where('recipient_actor', 'customer')
        ->where('channel', 'sms')
        ->firstOrFail();

    expect($delivery->status->value)->toBe('failed');
    expect($delivery->provider)->toBe('failing');
    expect($delivery->attempt_count)->toBe(2);
    expect($delivery->last_error)->toContain('configured to fail');

    config()->set('notifications.channels.sms.driver', 'log');

    Sanctum::actingAs($opsSupport, ['ops:support.manage']);

    $this->postJson("/api/v1/ops/notifications/{$delivery->id}/retry")
        ->assertStatus(202)
        ->assertJsonPath('data.id', $delivery->id)
        ->assertJsonPath('data.status', 'sent')
        ->assertJsonPath('data.provider', 'sms-log')
        ->assertJsonPath('data.attempt_count', 3);
});
