<?php

use App\Models\Branch;
use App\Models\Order;
use App\Modules\Orders\Enums\OrderStatus;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\Support\CreatesDomainData;

uses(CreatesDomainData::class);

it('returns merchant sales aggregates for the requested merchant and range', function () {
    Carbon::setTestNow('2026-04-15 12:00:00');
    $this->seedRoles();

    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();

    $secondaryBranch = Branch::query()->create([
        'uuid' => (string) Str::uuid(),
        'merchant_id' => $merchantContext['merchant']->id,
        'name' => 'North Branch',
        'status' => 'active',
        'city' => 'Riyadh',
        'address_line' => 'King Abdullah Road',
        'latitude' => 24.7333,
        'longitude' => 46.6933,
        'accepts_orders' => true,
    ]);

    $deliveredOrder = $this->createPlacedOrder($customerContext, $merchantContext);
    $deliveredOrder->forceFill([
        'status' => OrderStatus::DELIVERED,
        'subtotal_minor' => 2800,
        'delivery_fee_minor' => 1500,
        'placed_at' => Carbon::now()->subDay(),
        'delivered_at' => Carbon::now()->subDay()->addMinutes(35),
    ])->save();

    $secondaryDeliveredOrder = Order::query()->create([
        'uuid' => (string) Str::uuid(),
        'customer_profile_id' => $customerContext['profile']->id,
        'customer_address_id' => $customerContext['address']->id,
        'merchant_id' => $merchantContext['merchant']->id,
        'branch_id' => $secondaryBranch->id,
        'status' => OrderStatus::DELIVERED,
        'payment_status' => 'pending_cod',
        'currency' => 'SAR',
        'subtotal_minor' => 4200,
        'delivery_fee_minor' => 1700,
        'platform_commission_minor' => 504,
        'rider_earning_minor' => 1500,
        'total_minor' => 5900,
        'pricing_snapshot' => ['distance_meters' => 2400],
        'delivery_address_snapshot' => [
            'uuid' => $customerContext['address']->uuid,
            'label' => $customerContext['address']->label,
        ],
        'placed_at' => Carbon::now()->subDays(2),
        'delivered_at' => Carbon::now()->subDays(2)->addMinutes(42),
    ]);
    $secondaryDeliveredOrder->items()->create([
        'catalog_item_id' => $merchantContext['catalogItem']->id,
        'quantity' => 2,
        'unit_price_minor' => 2100,
        'line_total_minor' => 4200,
        'item_snapshot' => [
            'uuid' => $merchantContext['catalogItem']->uuid,
            'name' => 'Loaded Fries',
            'category_name' => 'Sides',
            'selected_modifier_groups' => [],
        ],
    ]);

    $cancelledOrder = Order::query()->create([
        'uuid' => (string) Str::uuid(),
        'customer_profile_id' => $customerContext['profile']->id,
        'customer_address_id' => $customerContext['address']->id,
        'merchant_id' => $merchantContext['merchant']->id,
        'branch_id' => $secondaryBranch->id,
        'status' => OrderStatus::CANCELLED,
        'payment_status' => 'pending_cod',
        'currency' => 'SAR',
        'subtotal_minor' => 3600,
        'delivery_fee_minor' => 1500,
        'platform_commission_minor' => 432,
        'rider_earning_minor' => 0,
        'total_minor' => 5100,
        'pricing_snapshot' => ['distance_meters' => 1800],
        'delivery_address_snapshot' => [
            'uuid' => $customerContext['address']->uuid,
            'label' => $customerContext['address']->label,
        ],
        'placed_at' => Carbon::now()->subDays(3),
    ]);
    $cancelledOrder->items()->create([
        'catalog_item_id' => $merchantContext['catalogItem']->id,
        'quantity' => 1,
        'unit_price_minor' => 3600,
        'line_total_minor' => 3600,
        'item_snapshot' => [
            'uuid' => $merchantContext['catalogItem']->uuid,
            'name' => 'Cancelled Burger',
            'category_name' => 'Mains',
            'selected_modifier_groups' => [],
        ],
    ]);

    Sanctum::actingAs($merchantContext['merchantUser'], ['merchant:dashboard.read']);

    $this->getJson(
        "/api/v1/merchant/reports/sales?merchant_uuid={$merchantContext['merchant']->uuid}&range_days=7"
    )->assertOk()
        ->assertJsonPath('data.merchant.uuid', $merchantContext['merchant']->uuid)
        ->assertJsonPath('data.summary.total_orders', 3)
        ->assertJsonPath('data.summary.delivered_orders', 2)
        ->assertJsonPath('data.summary.cancelled_orders', 1)
        ->assertJsonPath('data.summary.gross_sales_minor', 7000)
        ->assertJsonPath('data.summary.completed_sales_minor', 7000)
        ->assertJsonPath('data.summary.delivery_fees_minor', 3200)
        ->assertJsonPath('data.top_items.0.item_name', 'Loaded Fries')
        ->assertJsonPath('data.top_items.0.quantity_sold', 2)
        ->assertJsonPath('data.branch_breakdown.0.branch_name', 'North Branch');

    Carbon::setTestNow();
});

it('blocks merchant sales access for merchants outside the membership scope', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $otherMerchantContext = $this->createMerchantContext();

    Sanctum::actingAs($merchantContext['merchantUser'], ['merchant:dashboard.read']);

    $this->getJson(
        "/api/v1/merchant/reports/sales?merchant_uuid={$otherMerchantContext['merchant']->uuid}"
    )->assertForbidden();
});
