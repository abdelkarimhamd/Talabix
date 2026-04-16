<?php

use Laravel\Sanctum\Sanctum;
use Tests\Support\CreatesDomainData;

uses(CreatesDomainData::class);

it('blocks customer tokens from ops merchant endpoints', function () {
    $this->seedRoles();
    ['customerUser' => $customer] = $this->createCustomerContext();

    Sanctum::actingAs($customer, ['customer:profile.read']);

    $this->getJson('/api/v1/ops/merchants')->assertForbidden();
});
