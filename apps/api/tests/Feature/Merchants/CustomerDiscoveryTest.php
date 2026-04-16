<?php

use App\Models\Branch;
use App\Models\BranchFeeBand;
use App\Models\BranchHour;
use App\Models\BranchServiceZone;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\Support\CreatesDomainData;

uses(CreatesDomainData::class);

it('filters merchant discovery by address search and open now', function () {
    Carbon::setTestNow('2026-04-14 10:00:00');

    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $merchantContext['merchant']->update(['name' => 'Talabix Grill']);

    $closedMerchantContext = $this->createMerchantContext();
    $closedMerchantContext['merchant']->update(['name' => 'Talabix Breakfast']);
    $closedMerchantContext['branch']->hours()->update([
        'opens_at' => '06:00:00',
        'closes_at' => '08:00:00',
    ]);

    $customerContext = $this->createCustomerContext();

    Sanctum::actingAs($customerContext['customerUser'], ['customer:profile.read']);

    $response = $this->getJson(sprintf(
        '/api/v1/customer/merchants?address_uuid=%s&search=Talabix&open_now=1',
        $customerContext['address']->uuid
    ));

    $response
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Talabix Grill')
        ->assertJsonPath('data.0.is_serviceable', true)
        ->assertJsonPath('data.0.is_open_now', true)
        ->assertJsonPath('data.0.branches.0.serviceability.is_serviceable', true)
        ->assertJsonPath('data.0.branches.0.serviceability.maps_provider', 'demo')
        ->assertJsonStructure([
            'data' => [
                [
                    'branches' => [
                        [
                            'serviceability' => [
                                'estimated_duration_minutes',
                            ],
                        ],
                    ],
                ],
            ],
        ]);

    Carbon::setTestNow();
});

it('searches customer place suggestions through the selected maps provider', function () {
    $this->seedRoles();
    $customerContext = $this->createCustomerContext();

    Sanctum::actingAs($customerContext['customerUser'], ['customer:addresses.write']);

    $this->getJson('/api/v1/customer/maps/places?query=King%20Fahd')
        ->assertOk()
        ->assertJsonPath('meta.provider', 'demo')
        ->assertJsonPath('data.0.id', 'place-home-olaya')
        ->assertJsonPath('data.0.line_1', 'King Fahd Road')
        ->assertJsonStructure([
            'data' => [
                [
                    'title',
                    'label',
                    'city',
                    'latitude',
                    'longitude',
                ],
            ],
        ]);
});

it('returns serviceability aware branch data for merchant detail', function () {
    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();

    $secondBranch = Branch::query()->create([
        'uuid' => (string) Str::uuid(),
        'merchant_id' => $merchantContext['merchant']->id,
        'name' => 'North Branch',
        'status' => 'active',
        'city' => 'Riyadh',
        'address_line' => 'Northern Ring Road',
        'latitude' => 24.9500,
        'longitude' => 46.5000,
        'accepts_orders' => true,
    ]);

    foreach (range(0, 6) as $day) {
        BranchHour::query()->create([
            'branch_id' => $secondBranch->id,
            'day_of_week' => $day,
            'opens_at' => '09:00:00',
            'closes_at' => '23:00:00',
            'is_closed' => false,
        ]);
    }

    BranchServiceZone::query()->create([
        'branch_id' => $secondBranch->id,
        'name' => 'North Riyadh',
        'city' => 'Riyadh',
        'center_latitude' => 24.9500,
        'center_longitude' => 46.5000,
        'radius_meters' => 3000,
        'is_active' => true,
    ]);

    BranchFeeBand::query()->create([
        'branch_id' => $secondBranch->id,
        'min_distance_meters' => 0,
        'max_distance_meters' => 3000,
        'fee_minor' => 1800,
    ]);

    Sanctum::actingAs($customerContext['customerUser'], ['customer:profile.read']);

    $response = $this->getJson(sprintf(
        '/api/v1/customer/merchants/%s?address_uuid=%s',
        $merchantContext['merchant']->uuid,
        $customerContext['address']->uuid
    ));

    $response
        ->assertOk()
        ->assertJsonPath('data.uuid', $merchantContext['merchant']->uuid)
        ->assertJsonCount(2, 'data.branches')
        ->assertJsonPath('data.branches.0.serviceability.address_uuid', $customerContext['address']->uuid)
        ->assertJsonStructure([
            'data' => [
                'branches' => [
                    [
                        'serviceability' => [
                            'distance_meters',
                            'estimated_duration_minutes',
                            'maps_provider',
                        ],
                    ],
                ],
            ],
        ]);

    expect(collect($response->json('data.branches'))->pluck('serviceability.is_serviceable')->all())
        ->toContain(true)
        ->toContain(false);
});
