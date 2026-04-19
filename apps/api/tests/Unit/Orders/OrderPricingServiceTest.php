<?php

use App\Models\PromotionOffer;
use App\Modules\Orders\Services\OrderPricingService;
use Illuminate\Support\Str;
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
        ->and($quote['pricing']['item_discount_minor'])->toBe(0)
        ->and($quote['pricing']['delivery_discount_minor'])->toBe(0)
        ->and($quote['pricing']['discount_minor'])->toBe(0)
        ->and($quote['pricing']['applied_offer_ids'])->toBe([])
        ->and($quote['pricing']['applied_offers'])->toBe([])
        ->and($quote['pricing']['total_minor'])->toBe(7500)
        ->and($quote['items'][0]['item_snapshot']['selected_modifier_groups'][0]['options'][0]['name'])->toBe('American cheese');
});

it('auto-applies eligible delivery offers', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    $offer = PromotionOffer::query()->create([
        'uuid' => (string) Str::uuid(),
        'branch_id' => $merchantContext['branch']->id,
        'catalog_item_id' => $merchantContext['catalogItem']->id,
        'title' => 'Free delivery',
        'discount_label' => '0 SAR delivery',
        'discount_type' => 'delivery',
        'min_spend_minor' => 2500,
        'requires_promo_code' => false,
        'is_active' => true,
    ]);

    $quote = app(OrderPricingService::class)->quote(
        $merchantContext['branch'],
        $customerContext['address'],
        collect([
            [
                'quantity' => 1,
                'model' => $merchantContext['catalogItem'],
                'modifier_option_uuids' => [],
            ],
        ])
    );

    expect($quote['pricing']['delivery_fee_minor'])->toBe(1500)
        ->and($quote['pricing']['delivery_discount_minor'])->toBe(1500)
        ->and($quote['pricing']['discount_minor'])->toBe(1500)
        ->and($quote['pricing']['total_minor'])->toBe(2800)
        ->and($quote['pricing']['applied_offer_ids'])->toBe([$offer->uuid]);
});

it('only applies manual promo-code offers after code redemption', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    $offer = PromotionOffer::query()->create([
        'uuid' => (string) Str::uuid(),
        'branch_id' => $merchantContext['branch']->id,
        'catalog_item_id' => $merchantContext['catalogItem']->id,
        'code' => 'BURGER10',
        'title' => 'Burger promo',
        'discount_label' => 'SAR 10 off',
        'discount_type' => 'item_fixed',
        'amount_minor' => 1000,
        'min_spend_minor' => 2500,
        'requires_promo_code' => true,
        'is_active' => true,
    ]);

    $service = app(OrderPricingService::class);
    $lineItems = collect([
        [
            'quantity' => 1,
            'model' => $merchantContext['catalogItem'],
            'modifier_option_uuids' => [],
        ],
    ]);

    $withoutCode = $service->quote(
        $merchantContext['branch'],
        $customerContext['address'],
        $lineItems
    );
    $withCode = $service->quote(
        $merchantContext['branch'],
        $customerContext['address'],
        $lineItems,
        'burger10'
    );

    expect($withoutCode['pricing']['applied_offer_ids'])->toBe([])
        ->and($withoutCode['pricing']['total_minor'])->toBe(4300)
        ->and($withCode['pricing']['item_discount_minor'])->toBe(1000)
        ->and($withCode['pricing']['total_minor'])->toBe(3300)
        ->and($withCode['pricing']['applied_offer_ids'])->toBe([$offer->uuid])
        ->and($withCode['pricing']['applied_offers'][0]['promo_code'])->toBe('BURGER10');
});
