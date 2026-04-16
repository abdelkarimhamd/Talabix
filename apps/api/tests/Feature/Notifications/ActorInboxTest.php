<?php

use App\Models\NotificationDelivery;
use App\Modules\Notifications\Services\NotificationDeliveryService;
use App\Modules\Orders\Enums\OrderStatus;
use Laravel\Sanctum\Sanctum;
use Tests\Support\CreatesDomainData;

uses(CreatesDomainData::class);

function queueActorNotifications(\App\Models\Order $order): void
{
    app(NotificationDeliveryService::class)->queueOrderStatusNotifications($order->fresh(), OrderStatus::ASSIGNED);
    app(NotificationDeliveryService::class)->queueOrderStatusNotifications($order->fresh(), OrderStatus::PICKED_UP);
}

it('lists customer inbox notifications scoped to the signed-in customer and unread count', function () {
    $this->seedRoles();

    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    $riderContext = $this->createRiderContext();
    $order = $this->createPlacedOrder($customerContext, $merchantContext);
    $order->update(['rider_profile_id' => $riderContext['profile']->id]);

    queueActorNotifications($order);

    Sanctum::actingAs($customerContext['customerUser'], [
        'customer:notifications.read',
        'customer:notifications.update',
    ]);

    $this->getJson('/api/v1/customer/notifications')
        ->assertOk()
        ->assertJsonPath('meta.total', 2)
        ->assertJsonPath('meta.unread_count', 2)
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.recipient_actor', 'customer')
        ->assertJsonPath('data.0.channel', 'in_app');
});

it('marks customer inbox notifications as read and supports unread-only filtering', function () {
    $this->seedRoles();

    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    $riderContext = $this->createRiderContext();
    $order = $this->createPlacedOrder($customerContext, $merchantContext);
    $order->update(['rider_profile_id' => $riderContext['profile']->id]);

    queueActorNotifications($order);

    $customerNotification = NotificationDelivery::query()
        ->where('recipient_user_id', $customerContext['customerUser']->id)
        ->where('recipient_actor', 'customer')
        ->where('channel', 'in_app')
        ->latest('id')
        ->firstOrFail();

    Sanctum::actingAs($customerContext['customerUser'], [
        'customer:notifications.read',
        'customer:notifications.update',
    ]);

    $this->postJson("/api/v1/customer/notifications/{$customerNotification->id}/read")
        ->assertOk()
        ->assertJsonPath('data.id', $customerNotification->id);

    expect($customerNotification->fresh()->read_at)->not->toBeNull();

    $this->getJson('/api/v1/customer/notifications?unread_only=1')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('meta.unread_count', 1);
});

it('prevents riders from reading customer inbox notifications', function () {
    $this->seedRoles();

    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    $riderContext = $this->createRiderContext();
    $order = $this->createPlacedOrder($customerContext, $merchantContext);
    $order->update(['rider_profile_id' => $riderContext['profile']->id]);

    queueActorNotifications($order);

    $customerNotification = NotificationDelivery::query()
        ->where('recipient_user_id', $customerContext['customerUser']->id)
        ->where('recipient_actor', 'customer')
        ->where('channel', 'in_app')
        ->latest('id')
        ->firstOrFail();

    Sanctum::actingAs($riderContext['riderUser'], [
        'rider:notifications.read',
        'rider:notifications.update',
    ]);

    $this->postJson("/api/v1/rider/notifications/{$customerNotification->id}/read")
        ->assertNotFound();
});

it('lists merchant inbox notifications for merchant sessions only', function () {
    $this->seedRoles();

    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    $order = $this->createPlacedOrder($customerContext, $merchantContext);

    app(NotificationDeliveryService::class)->queueOrderStatusNotifications($order->fresh(), OrderStatus::ACCEPTED);

    Sanctum::actingAs($merchantContext['merchantUser'], [
        'merchant:notifications.read',
        'merchant:notifications.update',
    ]);

    $this->getJson('/api/v1/merchant/notifications')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('meta.unread_count', 1)
        ->assertJsonPath('data.0.recipient_actor', 'merchant')
        ->assertJsonPath('data.0.channel', 'in_app')
        ->assertJsonPath('data.0.title', 'Order accepted');
});
