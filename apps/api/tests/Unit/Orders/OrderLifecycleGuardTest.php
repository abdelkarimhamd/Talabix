<?php

use App\Modules\Orders\Enums\OrderStatus;
use App\Modules\Orders\Exceptions\InvalidOrderTransitionException;
use App\Modules\Orders\Services\OrderLifecycleService;
use Tests\Support\CreatesDomainData;

uses(CreatesDomainData::class);

it('rejects invalid order transitions', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    $order = $this->createPlacedOrder($customerContext, $merchantContext);

    $service = app(OrderLifecycleService::class);

    expect(fn () => $service->transition($order, OrderStatus::DELIVERED))
        ->toThrow(InvalidOrderTransitionException::class);
});

it('allows merchant fulfillment transitions through preparing and ready for pickup', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    $order = $this->createPlacedOrder($customerContext, $merchantContext);

    $service = app(OrderLifecycleService::class);

    $accepted = $service->transition($order, OrderStatus::ACCEPTED);
    $preparing = $service->transition($accepted, OrderStatus::PREPARING);
    $ready = $service->transition($preparing, OrderStatus::READY_FOR_PICKUP);

    expect($ready->status)->toBe(OrderStatus::READY_FOR_PICKUP);
});
