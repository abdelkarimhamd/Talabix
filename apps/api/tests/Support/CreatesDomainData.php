<?php

namespace Tests\Support;

use App\Models\Branch;
use App\Models\BranchFeeBand;
use App\Models\BranchHour;
use App\Models\BranchServiceZone;
use App\Models\CatalogItem;
use App\Models\CatalogItemModifierGroup;
use App\Models\CustomerAddress;
use App\Models\CustomerProfile;
use App\Models\Merchant;
use App\Models\MerchantStaffMembership;
use App\Models\Order;
use App\Models\RiderLocation;
use App\Models\RiderProfile;
use App\Models\User;
use App\Modules\Dispatch\Enums\RiderAvailability;
use App\Modules\Identity\Enums\UserAccountStatus;
use App\Modules\Orders\Enums\OrderStatus;
use App\Modules\Orders\Enums\PaymentStatus;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Str;

trait CreatesDomainData
{
    protected function seedRoles(): void
    {
        $this->seed(RolePermissionSeeder::class);
    }

    protected function createUserWithRole(string $role, array $overrides = []): User
    {
        $user = User::query()->create(array_merge([
            'uuid' => (string) Str::uuid(),
            'name' => ucfirst(str_replace('_', ' ', $role)),
            'email' => sprintf('%s-%s@talabix.test', $role, Str::lower(Str::random(6))),
            'phone' => '+9665'.random_int(10000000, 99999999),
            'email_verified_at' => now(),
            'account_status' => UserAccountStatus::ACTIVE,
            'password' => 'password',
        ], $overrides));

        $user->syncRoles([$role]);

        return $user;
    }

    protected function createMerchantContext(?User $merchantUser = null): array
    {
        $merchantUser ??= $this->createUserWithRole('merchant_manager');

        $merchant = Merchant::query()->create([
            'uuid' => (string) Str::uuid(),
            'name' => 'Demo Merchant',
            'slug' => 'demo-merchant-'.Str::lower(Str::random(5)),
            'status' => 'active',
            'created_by_user_id' => $merchantUser->id,
        ]);

        $branch = Branch::query()->create([
            'uuid' => (string) Str::uuid(),
            'merchant_id' => $merchant->id,
            'name' => 'Main Branch',
            'status' => 'active',
            'city' => 'Riyadh',
            'address_line' => 'Olaya Street',
            'latitude' => 24.7136,
            'longitude' => 46.6753,
            'accepts_orders' => true,
        ]);

        MerchantStaffMembership::query()->create([
            'uuid' => (string) Str::uuid(),
            'merchant_id' => $merchant->id,
            'branch_id' => $branch->id,
            'user_id' => $merchantUser->id,
            'membership_role' => 'merchant_manager',
            'status' => 'active',
        ]);

        foreach (range(0, 6) as $day) {
            BranchHour::query()->create([
                'branch_id' => $branch->id,
                'day_of_week' => $day,
                'opens_at' => '09:00:00',
                'closes_at' => '23:00:00',
                'is_closed' => false,
            ]);
        }

        $zone = BranchServiceZone::query()->create([
            'branch_id' => $branch->id,
            'name' => 'Central Riyadh',
            'city' => 'Riyadh',
            'center_latitude' => 24.7136,
            'center_longitude' => 46.6753,
            'radius_meters' => 15000,
            'is_active' => true,
        ]);

        BranchFeeBand::query()->create([
            'branch_id' => $branch->id,
            'min_distance_meters' => 0,
            'max_distance_meters' => 15000,
            'fee_minor' => 1500,
        ]);

        $catalogItem = CatalogItem::query()->create([
            'uuid' => (string) Str::uuid(),
            'merchant_id' => $merchant->id,
            'name' => 'Burger',
            'category_name' => 'Mains',
            'sku' => 'burger',
            'description' => 'Signature burger',
            'image_url' => 'https://images.talabix.test/catalog/burger.jpg',
            'base_price_minor' => 2800,
            'base_stock' => 50,
            'is_active' => true,
        ]);

        $modifierGroup = CatalogItemModifierGroup::query()->create([
            'uuid' => (string) Str::uuid(),
            'catalog_item_id' => $catalogItem->id,
            'name' => 'Cheese',
            'description' => 'Optional cheese add-ons.',
            'selection_type' => 'single',
            'min_selected' => 0,
            'max_selected' => 1,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $modifierGroup->options()->createMany([
            [
                'uuid' => (string) Str::uuid(),
                'name' => 'No cheese',
                'description' => null,
                'price_delta_minor' => 0,
                'is_default' => true,
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'uuid' => (string) Str::uuid(),
                'name' => 'American cheese',
                'description' => null,
                'price_delta_minor' => 200,
                'is_default' => false,
                'is_active' => true,
                'sort_order' => 2,
            ],
        ]);

        return compact('merchantUser', 'merchant', 'branch', 'zone', 'catalogItem');
    }

    protected function createCustomerContext(?User $customerUser = null, array $addressOverrides = []): array
    {
        $customerUser ??= $this->createUserWithRole('customer');

        $profile = CustomerProfile::query()->create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $customerUser->id,
        ]);

        $address = CustomerAddress::query()->create(array_merge([
            'uuid' => (string) Str::uuid(),
            'customer_profile_id' => $profile->id,
            'label' => 'Home',
            'line_1' => 'King Fahd Road',
            'line_2' => null,
            'building' => 'Tower A',
            'floor' => '12',
            'apartment' => '1204',
            'landmark' => 'North gate',
            'delivery_notes' => 'Call on arrival',
            'city' => 'Riyadh',
            'latitude' => 24.7160,
            'longitude' => 46.6810,
            'is_default' => true,
        ], $addressOverrides));

        return compact('customerUser', 'profile', 'address');
    }

    protected function createRiderContext(?User $riderUser = null, bool $available = true, ?array $location = null): array
    {
        $riderUser ??= $this->createUserWithRole('rider');

        $profile = RiderProfile::query()->create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $riderUser->id,
            'vehicle_type' => 'bike',
            'plate_number' => 'RID-'.random_int(100, 999),
            'availability' => $available ? RiderAvailability::AVAILABLE : RiderAvailability::OFFLINE,
        ]);

        if ($location) {
            RiderLocation::query()->create([
                'rider_profile_id' => $profile->id,
                'latitude' => $location['latitude'],
                'longitude' => $location['longitude'],
                'recorded_at' => now(),
            ]);
        }

        return compact('riderUser', 'profile');
    }

    protected function createPlacedOrder(array $customerContext, array $merchantContext): Order
    {
        $order = Order::query()->create([
            'uuid' => (string) Str::uuid(),
            'customer_profile_id' => $customerContext['profile']->id,
            'customer_address_id' => $customerContext['address']->id,
            'merchant_id' => $merchantContext['merchant']->id,
            'branch_id' => $merchantContext['branch']->id,
            'status' => OrderStatus::PLACED,
            'payment_status' => PaymentStatus::PENDING_COD,
            'currency' => 'SAR',
            'subtotal_minor' => 2800,
            'delivery_fee_minor' => 1500,
            'platform_commission_minor' => 336,
            'rider_earning_minor' => 1500,
            'total_minor' => 4300,
            'pricing_snapshot' => ['distance_meters' => 1200],
            'delivery_address_snapshot' => [
                'uuid' => $customerContext['address']->uuid,
                'label' => $customerContext['address']->label,
                'line_1' => $customerContext['address']->line_1,
                'line_2' => $customerContext['address']->line_2,
                'building' => $customerContext['address']->building,
                'floor' => $customerContext['address']->floor,
                'apartment' => $customerContext['address']->apartment,
                'landmark' => $customerContext['address']->landmark,
                'delivery_notes' => $customerContext['address']->delivery_notes,
                'city' => $customerContext['address']->city,
                'latitude' => $customerContext['address']->latitude,
                'longitude' => $customerContext['address']->longitude,
            ],
            'placed_at' => now(),
        ]);

        $order->items()->create([
            'catalog_item_id' => $merchantContext['catalogItem']->id,
            'quantity' => 1,
            'unit_price_minor' => 2800,
            'line_total_minor' => 2800,
            'item_snapshot' => [
                'uuid' => $merchantContext['catalogItem']->uuid,
                'name' => $merchantContext['catalogItem']->name,
                'category_name' => $merchantContext['catalogItem']->category_name,
                'image_url' => $merchantContext['catalogItem']->image_url,
                'selected_modifier_groups' => [],
            ],
        ]);

        return $order->refresh();
    }
}
