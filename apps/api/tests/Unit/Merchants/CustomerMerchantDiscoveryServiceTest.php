<?php

use App\Modules\Merchants\Services\CustomerMerchantDiscoveryService;
use Illuminate\Support\Carbon;
use Tests\Support\CreatesDomainData;

uses(CreatesDomainData::class);

it('evaluates open now and serviceability consistently', function () {
    Carbon::setTestNow('2026-04-14 10:00:00');

    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $closedMerchantContext = $this->createMerchantContext();
    $closedMerchantContext['branch']->hours()->update([
        'opens_at' => '06:00:00',
        'closes_at' => '08:00:00',
    ]);

    $customerContext = $this->createCustomerContext();

    $results = app(CustomerMerchantDiscoveryService::class)->list(
        $customerContext['address'],
        null,
        true
    );

    expect($results)->toHaveCount(1);
    expect($results->first()->branches)->toHaveCount(1);
    expect($results->first()->getAttribute('is_open_now'))->toBeTrue();
    expect($results->first()->branches->first()->getAttribute('serviceability')['is_serviceable'])->toBeTrue();
    expect($results->first()->branches->first()->getAttribute('serviceability')['estimated_duration_minutes'])
        ->toBeGreaterThan(0);
    expect($results->first()->branches->first()->getAttribute('serviceability')['maps_provider'])
        ->toBe('demo');

    Carbon::setTestNow();
});

it('returns route metadata and reason codes for serviceability decisions', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $insideCustomerContext = $this->createCustomerContext();
    $outsideCustomerContext = $this->createCustomerContext(null, [
        'label' => 'Far office',
        'latitude' => 25.1000,
        'longitude' => 47.1000,
    ]);

    $service = app(CustomerMerchantDiscoveryService::class);

    $serviceableBranch = $service
        ->detail($merchantContext['merchant'], $insideCustomerContext['address'])
        ->branches
        ->first();

    expect($serviceableBranch->getAttribute('serviceability'))->toMatchArray([
        'address_uuid' => $insideCustomerContext['address']->uuid,
        'is_serviceable' => true,
        'reason_code' => 'serviceable',
    ]);
    expect($serviceableBranch->getAttribute('serviceability')['route'])
        ->toMatchArray([
            'provider' => 'demo',
            'mode' => 'driving',
        ]);

    $unserviceableBranch = $service
        ->detail($merchantContext['merchant'], $outsideCustomerContext['address'])
        ->branches
        ->first();

    expect($unserviceableBranch->getAttribute('serviceability'))->toMatchArray([
        'address_uuid' => $outsideCustomerContext['address']->uuid,
        'is_serviceable' => false,
        'reason_code' => 'outside_service_zone',
        'delivery_fee_minor' => null,
        'estimated_duration_minutes' => null,
    ]);
    expect($unserviceableBranch->getAttribute('serviceability')['route']['distance_meters'])
        ->toBeGreaterThan(0);
});
