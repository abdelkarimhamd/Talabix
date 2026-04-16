<?php

namespace App\Modules\Merchants\Actions;

use App\Models\Branch;
use App\Models\BranchFeeBand;
use App\Models\BranchHour;
use App\Models\BranchServiceZone;
use App\Models\Merchant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CreateMerchantAction
{
    public function execute(array $payload, User $creator): Merchant
    {
        return DB::transaction(function () use ($payload, $creator) {
            $merchant = Merchant::query()->create([
                'uuid' => (string) Str::uuid(),
                'name' => $payload['name'],
                'slug' => Str::slug($payload['slug']),
                'status' => 'active',
                'platform_commission_bps' => $payload['platform_commission_bps'] ?? 1200,
                'created_by_user_id' => $creator->id,
            ]);

            $branch = Branch::query()->create([
                'uuid' => (string) Str::uuid(),
                'merchant_id' => $merchant->id,
                'name' => $payload['branch']['name'],
                'status' => 'active',
                'city' => $payload['branch']['city'],
                'address_line' => $payload['branch']['address_line'],
                'latitude' => $payload['branch']['latitude'],
                'longitude' => $payload['branch']['longitude'],
                'accepts_orders' => true,
            ]);

            foreach ($payload['branch']['hours'] as $hour) {
                BranchHour::query()->create([
                    'branch_id' => $branch->id,
                    'day_of_week' => $hour['day_of_week'],
                    'opens_at' => $hour['opens_at'] ?? null,
                    'closes_at' => $hour['closes_at'] ?? null,
                    'is_closed' => empty($hour['opens_at']) || empty($hour['closes_at']),
                ]);
            }

            foreach ($payload['branch']['zones'] as $zone) {
                BranchServiceZone::query()->create([
                    'branch_id' => $branch->id,
                    'name' => $zone['name'],
                    'city' => $zone['city'],
                    'postal_code' => $zone['postal_code'] ?? null,
                    'center_latitude' => $zone['center_latitude'],
                    'center_longitude' => $zone['center_longitude'],
                    'radius_meters' => $zone['radius_meters'],
                    'is_active' => true,
                ]);
            }

            foreach ($payload['branch']['fee_bands'] as $band) {
                BranchFeeBand::query()->create([
                    'branch_id' => $branch->id,
                    'min_distance_meters' => $band['min_distance_meters'],
                    'max_distance_meters' => $band['max_distance_meters'],
                    'fee_minor' => $band['fee_minor'],
                ]);
            }

            return $merchant->load('branches');
        });
    }
}
