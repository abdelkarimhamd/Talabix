<?php

use App\Modules\Orders\Services\OrderPricingService;
use Tests\Support\CreatesDomainData;

uses(CreatesDomainData::class);

it('calculates subtotal delivery and total correctly', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    $modifierOptionUuid = $merchantContext['catalogItem']
        ->modifierGroups()
        ->firstOrFail()
        ->options()
        ->where('name', 'American cheese')
        ->value('uuid');

    $service = app(OrderPricingService::class);
    $quote = $service->quote(
        $merchantContext['branch'],
        $customerContext['address'],
        collect([
            [
                'quantity' => 2,
                'model' => $merchantContext['catalogItem'],
                'modifier_option_uuids' => [$modifierOptionUuid],
            ],
        ])
    );

    expect($quote['pricing']['subtotal_minor'])->toBe(6000)
        ->and($quote['pricing']['delivery_fee_minor'])->toBe(1500)
        ->and($quote['pricing']['total_minor'])->toBe(7500)
        ->and($quote['items'][0]['item_snapshot']['selected_modifier_groups'][0]['options'][0]['name'])->toBe('American cheese');
});
