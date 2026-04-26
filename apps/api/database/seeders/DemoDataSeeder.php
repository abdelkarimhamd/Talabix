<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\BranchFeeBand;
use App\Models\BranchHour;
use App\Models\BranchServiceZone;
use App\Models\CatalogItem;
use App\Models\CustomerProfile;
use App\Models\Merchant;
use App\Models\MerchantStaffMembership;
use App\Models\PromotionOffer;
use App\Models\RiderProfile;
use App\Models\User;
use App\Modules\Dispatch\Enums\RiderAvailability;
use App\Modules\Identity\Enums\UserAccountStatus;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $ops = User::query()->firstOrCreate(
            ['email' => 'ops@talabix.test'],
            [
                'uuid' => (string) Str::uuid(),
                'name' => 'Talabix Ops',
                'password' => 'password',
                'phone' => '+966500000001',
                'email_verified_at' => now(),
                'account_status' => UserAccountStatus::ACTIVE,
            ]
        );
        $ops->syncRoles(['ops_admin']);

        $merchantUser = User::query()->firstOrCreate(
            ['email' => 'merchant@talabix.test'],
            [
                'uuid' => (string) Str::uuid(),
                'name' => 'Merchant Manager',
                'password' => 'password',
                'phone' => '+966500000002',
                'email_verified_at' => now(),
                'account_status' => UserAccountStatus::ACTIVE,
            ]
        );
        $merchantUser->syncRoles(['merchant_manager']);

        $customerUser = User::query()->firstOrCreate(
            ['email' => 'customer@talabix.test'],
            [
                'uuid' => (string) Str::uuid(),
                'name' => 'Talabix Customer',
                'password' => 'password',
                'phone' => '+966500000003',
                'email_verified_at' => now(),
                'account_status' => UserAccountStatus::ACTIVE,
            ]
        );
        $customerUser->syncRoles(['customer']);

        $riderUser = User::query()->firstOrCreate(
            ['email' => 'rider@talabix.test'],
            [
                'uuid' => (string) Str::uuid(),
                'name' => 'Talabix Rider',
                'password' => 'password',
                'phone' => '+966500000004',
                'email_verified_at' => now(),
                'account_status' => UserAccountStatus::ACTIVE,
            ]
        );
        $riderUser->syncRoles(['rider']);

        $merchant = Merchant::query()->firstOrCreate(
            ['slug' => 'talabix-demo-kitchen'],
            [
                'uuid' => (string) Str::uuid(),
                'name' => 'Talabix Demo Kitchen',
                'status' => 'active',
                'created_by_user_id' => $ops->id,
            ]
        );

        $branch = Branch::query()->firstOrCreate(
            ['merchant_id' => $merchant->id, 'name' => 'Olaya Branch'],
            [
                'uuid' => (string) Str::uuid(),
                'status' => 'active',
                'city' => 'Riyadh',
                'address_line' => 'Olaya Street, Riyadh',
                'latitude' => 24.7136000,
                'longitude' => 46.6753000,
                'accepts_orders' => true,
            ]
        );

        MerchantStaffMembership::query()->firstOrCreate(
            ['merchant_id' => $merchant->id, 'user_id' => $merchantUser->id],
            [
                'uuid' => (string) Str::uuid(),
                'branch_id' => $branch->id,
                'membership_role' => 'merchant_manager',
                'status' => 'active',
            ]
        );

        CustomerProfile::query()->firstOrCreate(
            ['user_id' => $customerUser->id],
            ['uuid' => (string) Str::uuid()]
        );

        RiderProfile::query()->firstOrCreate(
            ['user_id' => $riderUser->id],
            [
                'uuid' => (string) Str::uuid(),
                'vehicle_type' => 'bike',
                'plate_number' => 'RYD-101',
                'availability' => RiderAvailability::AVAILABLE,
            ]
        );

        foreach (range(0, 6) as $day) {
            BranchHour::query()->firstOrCreate(
                ['branch_id' => $branch->id, 'day_of_week' => $day],
                [
                    'opens_at' => '09:00:00',
                    'closes_at' => '23:00:00',
                    'is_closed' => false,
                ]
            );
        }

        BranchServiceZone::query()->firstOrCreate(
            ['branch_id' => $branch->id, 'name' => 'Central Riyadh'],
            [
                'city' => 'Riyadh',
                'postal_code' => null,
                'center_latitude' => 24.7136000,
                'center_longitude' => 46.6753000,
                'radius_meters' => 12000,
                'is_active' => true,
            ]
        );

        BranchFeeBand::query()->firstOrCreate(
            ['branch_id' => $branch->id, 'min_distance_meters' => 0, 'max_distance_meters' => 5000],
            ['fee_minor' => 1200]
        );

        BranchFeeBand::query()->firstOrCreate(
            ['branch_id' => $branch->id, 'min_distance_meters' => 5001, 'max_distance_meters' => 12000],
            ['fee_minor' => 1800]
        );

        $shawarma = CatalogItem::query()->firstOrCreate(
            ['merchant_id' => $merchant->id, 'name' => 'Chicken Shawarma'],
            [
                'uuid' => (string) Str::uuid(),
                'sku' => 'shawarma-chicken',
                'description' => 'House chicken shawarma wrap.',
                'base_price_minor' => 2500,
                'base_stock' => 100,
                'is_active' => true,
            ]
        );

        CatalogItem::query()->firstOrCreate(
            ['merchant_id' => $merchant->id, 'name' => 'Fries'],
            [
                'uuid' => (string) Str::uuid(),
                'sku' => 'fries',
                'description' => 'Crispy fries.',
                'base_price_minor' => 1000,
                'base_stock' => 100,
                'is_active' => true,
            ]
        );

        PromotionOffer::query()->firstOrCreate(
            ['branch_id' => $branch->id, 'catalog_item_id' => $shawarma->id, 'title' => 'Free delivery'],
            [
                'uuid' => (string) Str::uuid(),
                'code' => null,
                'discount_label' => '0 SAR delivery',
                'discount_type' => 'delivery',
                'percent' => null,
                'amount_minor' => null,
                'min_spend_minor' => 2500,
                'requires_promo_code' => false,
                'is_active' => true,
                'expires_at' => now()->addMonth(),
            ]
        );

        PromotionOffer::query()->firstOrCreate(
            ['branch_id' => $branch->id, 'catalog_item_id' => $shawarma->id, 'code' => 'SHAWARMA5'],
            [
                'uuid' => (string) Str::uuid(),
                'title' => 'Shawarma promo code',
                'discount_label' => 'SAR 5 off',
                'discount_type' => 'item_fixed',
                'percent' => null,
                'amount_minor' => 500,
                'min_spend_minor' => 2500,
                'requires_promo_code' => true,
                'is_active' => true,
                'expires_at' => now()->addMonth(),
            ]
        );
    }
}
