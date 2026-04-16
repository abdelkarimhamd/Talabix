<?php

use App\Modules\Orders\Enums\OrderStatus;
use Laravel\Sanctum\Sanctum;
use Tests\Support\CreatesDomainData;

uses(CreatesDomainData::class);

it('returns a branch-scoped merchant order board with customer context and actions', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    $order = $this->createPlacedOrder($customerContext, $merchantContext);

    Sanctum::actingAs($merchantContext['merchantUser'], [
        'merchant:orders.read',
    ]);

    $this->getJson("/api/v1/merchant/branches/{$merchantContext['branch']->uuid}/orders")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.uuid', $order->uuid)
        ->assertJsonPath('data.0.customer_name', $customerContext['customerUser']->name)
        ->assertJsonPath('data.0.branch_name', $merchantContext['branch']->name)
        ->assertJsonPath('data.0.item_count', 1)
        ->assertJsonPath('data.0.merchant_actions.0', 'accept')
        ->assertJsonPath('data.0.merchant_actions.1', 'reject');
});

it('moves a merchant order from accepted to preparing and ready for pickup', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    $order = $this->createPlacedOrder($customerContext, $merchantContext);

    Sanctum::actingAs($merchantContext['merchantUser'], [
        'merchant:orders.read',
        'merchant:orders.update',
    ]);

    $this->postJson("/api/v1/merchant/orders/{$order->uuid}/accept")
        ->assertOk()
        ->assertJsonPath('data.status', 'accepted')
        ->assertJsonPath('data.merchant_actions.0', 'start_preparing');

    $this->postJson("/api/v1/merchant/orders/{$order->uuid}/start-preparing")
        ->assertOk()
        ->assertJsonPath('data.status', 'preparing')
        ->assertJsonPath('data.merchant_actions.0', 'mark_ready');

    $this->postJson("/api/v1/merchant/orders/{$order->uuid}/ready-for-pickup")
        ->assertOk()
        ->assertJsonPath('data.status', 'ready_for_pickup')
        ->assertJsonPath('data.merchant_actions', []);

    $this->assertDatabaseHas('order_timelines', [
        'order_id' => $order->id,
        'event_type' => 'merchant_accepted',
        'to_status' => 'accepted',
    ]);

    $this->assertDatabaseHas('order_timelines', [
        'order_id' => $order->id,
        'event_type' => 'dispatch_started',
        'to_status' => 'preparing',
    ]);

    $this->assertDatabaseHas('order_timelines', [
        'order_id' => $order->id,
        'event_type' => 'dispatch_started',
        'to_status' => 'ready_for_pickup',
    ]);
});

it('records a merchant rejected timeline event when a merchant rejects an order', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    $order = $this->createPlacedOrder($customerContext, $merchantContext);

    Sanctum::actingAs($merchantContext['merchantUser'], [
        'merchant:orders.update',
    ]);

    $this->postJson("/api/v1/merchant/orders/{$order->uuid}/reject")
        ->assertOk()
        ->assertJsonPath('data.status', 'cancelled');

    $this->assertDatabaseHas('order_timelines', [
        'order_id' => $order->id,
        'event_type' => 'merchant_rejected',
        'to_status' => 'cancelled',
    ]);
});

it('returns 422 when a merchant skips fulfillment stages', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    $order = $this->createPlacedOrder($customerContext, $merchantContext);

    Sanctum::actingAs($merchantContext['merchantUser'], [
        'merchant:orders.update',
    ]);

    $this->postJson("/api/v1/merchant/orders/{$order->uuid}/ready-for-pickup")
        ->assertStatus(422)
        ->assertJsonPath('message', 'Cannot transition order from placed to ready_for_pickup.');

    expect($order->refresh()->status)->toBe(OrderStatus::PLACED);
});
