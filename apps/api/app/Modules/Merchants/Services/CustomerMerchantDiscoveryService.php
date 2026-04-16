<?php

namespace App\Modules\Merchants\Services;

use App\Models\Branch;
use App\Models\CustomerAddress;
use App\Models\Merchant;
use App\Modules\Orders\Services\OrderPricingService;
use App\Modules\Shared\Services\MapsProviderService;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Collection;

class CustomerMerchantDiscoveryService
{
    public function __construct(
        private readonly OrderPricingService $orderPricingService,
        private readonly MapsProviderService $mapsProviderService,
    ) {
    }

    public function list(?CustomerAddress $address = null, ?string $search = null, bool $openNow = false): Collection
    {
        $merchants = Merchant::query()
            ->where('status', 'active')
            ->when(
                filled($search),
                fn ($query) => $query->where('name', 'like', '%'.trim((string) $search).'%')
            )
            ->with([
                'branches.hours',
                'branches.serviceZones',
                'branches.feeBands',
            ])
            ->orderBy('name')
            ->get();

        return $merchants
            ->map(fn (Merchant $merchant) => $this->projectMerchant($merchant, $address, $address !== null))
            ->filter(fn (Merchant $merchant) => $this->passesMerchantFilters($merchant, $address !== null, $openNow))
            ->values();
    }

    public function detail(Merchant $merchant, ?CustomerAddress $address = null): Merchant
    {
        abort_if($merchant->status !== 'active', 404);

        $merchant->loadMissing([
            'branches.hours',
            'branches.serviceZones',
            'branches.feeBands',
        ]);

        return $this->projectMerchant($merchant, $address, false);
    }

    private function projectMerchant(
        Merchant $merchant,
        ?CustomerAddress $address,
        bool $onlyServiceableBranches
    ): Merchant {
        $projectedBranches = $merchant->branches
            ->filter(fn (Branch $branch) => $branch->status === 'active')
            ->map(fn (Branch $branch) => $this->projectBranch($branch, $address))
            ->filter(function (Branch $branch) use ($onlyServiceableBranches) {
                if (! $onlyServiceableBranches) {
                    return true;
                }

                $serviceability = $branch->getAttribute('serviceability');

                return is_array($serviceability) && ($serviceability['is_serviceable'] ?? false);
            })
            ->values();

        $merchant->setRelation('branches', new EloquentCollection($projectedBranches->all()));
        $merchant->setAttribute(
            'is_open_now',
            $projectedBranches->contains(fn (Branch $branch) => (bool) $branch->getAttribute('is_open_now'))
        );

        $serviceableBranchCount = $projectedBranches
            ->filter(fn (Branch $branch) => $this->branchIsServiceable($branch))
            ->count();

        $merchant->setAttribute('is_serviceable', $address ? $serviceableBranchCount > 0 : null);
        $merchant->setAttribute('serviceable_branch_count', $address ? $serviceableBranchCount : null);

        return $merchant;
    }

    private function projectBranch(Branch $branch, ?CustomerAddress $address): Branch
    {
        $todayHours = $this->todayHoursForBranch($branch);

        $branch->setAttribute('is_open_now', $this->isBranchOpenNow($branch, $todayHours));
        $branch->setAttribute('today_hours', $todayHours);
        $branch->setAttribute(
            'serviceability',
            $address ? $this->serviceabilityForBranch($branch, $address) : null
        );

        return $branch;
    }

    private function serviceabilityForBranch(Branch $branch, CustomerAddress $address): array
    {
        $distance = $this->orderPricingService->distanceMeters(
            (float) $branch->latitude,
            (float) $branch->longitude,
            (float) $address->latitude,
            (float) $address->longitude,
        );

        $zone = $branch->serviceZones
            ->where('is_active', true)
            ->first(function ($candidate) use ($address) {
                return $candidate->city === $address->city
                    && $this->orderPricingService->distanceMeters(
                        (float) $candidate->center_latitude,
                        (float) $candidate->center_longitude,
                        (float) $address->latitude,
                        (float) $address->longitude,
                    ) <= $candidate->radius_meters;
            });

        $feeBand = $branch->feeBands
            ->sortBy('min_distance_meters')
            ->first(fn ($candidate) => $distance >= $candidate->min_distance_meters
                && $distance <= $candidate->max_distance_meters);

        $isServiceable = (bool) $zone && (bool) $feeBand;
        $routeEstimate = $this->mapsProviderService->distanceEstimate(
            (float) $branch->latitude,
            (float) $branch->longitude,
            (float) $address->latitude,
            (float) $address->longitude,
        );

        return [
            'address_uuid' => $address->uuid,
            'is_serviceable' => $isServiceable,
            'distance_meters' => $distance,
            'delivery_fee_minor' => $isServiceable ? $feeBand->fee_minor : null,
            'estimated_duration_minutes' => $isServiceable ? $routeEstimate['duration_minutes'] : null,
            'maps_provider' => $routeEstimate['provider'],
        ];
    }

    private function todayHoursForBranch(Branch $branch): ?array
    {
        $now = now();
        $hours = $branch->hours->firstWhere('day_of_week', $now->dayOfWeek);

        if (! $hours) {
            return null;
        }

        return [
            'day_of_week' => (int) $hours->day_of_week,
            'opens_at' => $hours->opens_at,
            'closes_at' => $hours->closes_at,
            'is_closed' => (bool) $hours->is_closed,
        ];
    }

    private function isBranchOpenNow(Branch $branch, ?array $todayHours): bool
    {
        if (
            $branch->status !== 'active'
            || ! $branch->accepts_orders
            || ! $todayHours
            || $todayHours['is_closed']
            || ! $todayHours['opens_at']
            || ! $todayHours['closes_at']
        ) {
            return false;
        }

        $nowTime = now()->format('H:i:s');
        $opensAt = $todayHours['opens_at'];
        $closesAt = $todayHours['closes_at'];

        if ($closesAt >= $opensAt) {
            return $nowTime >= $opensAt && $nowTime <= $closesAt;
        }

        return $nowTime >= $opensAt || $nowTime <= $closesAt;
    }

    private function branchIsServiceable(Branch $branch): bool
    {
        $serviceability = $branch->getAttribute('serviceability');

        return is_array($serviceability) && ($serviceability['is_serviceable'] ?? false);
    }

    private function passesMerchantFilters(Merchant $merchant, bool $addressFilterApplied, bool $openNow): bool
    {
        if ($merchant->branches->isEmpty()) {
            return false;
        }

        if ($addressFilterApplied && ! $merchant->getAttribute('is_serviceable')) {
            return false;
        }

        if ($openNow && ! $merchant->getAttribute('is_open_now')) {
            return false;
        }

        return true;
    }
}
