<?php

use App\Modules\Dispatch\Services\DispatchScoringService;
use Tests\Support\CreatesDomainData;

uses(CreatesDomainData::class);

it('scores an available rider inside the branch zone', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    ['profile' => $riderProfile] = $this->createRiderContext(null, true, [
        'latitude' => 24.7140,
        'longitude' => 46.6760,
    ]);
    $order = $this->createPlacedOrder($customerContext, $merchantContext);

    $score = app(DispatchScoringService::class)->score($order, $riderProfile);

    expect($score)->toBeInt()->toBeGreaterThan(0);
});

it('returns null when the rider is offline', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    ['profile' => $riderProfile] = $this->createRiderContext(null, false, [
        'latitude' => 24.7140,
        'longitude' => 46.6760,
    ]);
    $order = $this->createPlacedOrder($customerContext, $merchantContext);

    $score = app(DispatchScoringService::class)->score($order, $riderProfile);

    expect($score)->toBeNull();
});
