<?php

namespace App\Modules\Dispatch\Services;

use App\Models\Order;
use App\Models\RiderProfile;
use App\Modules\Dispatch\Enums\RiderAvailability;
use App\Modules\Orders\Services\OrderPricingService;

class DispatchScoringService
{
    public function __construct(private readonly OrderPricingService $pricingService)
    {
    }

    public function score(Order $order, RiderProfile $rider): ?int
    {
        if ($rider->availability !== RiderAvailability::AVAILABLE) {
            return null;
        }

        $latestLocation = $rider->locations()->latest('recorded_at')->first();

        if (! $latestLocation) {
            return null;
        }

        $branch = $order->branch()->first();
        $address = $order->customerAddress()->first();

        $zoneMatch = $branch->serviceZones()
            ->where('is_active', true)
            ->get()
            ->contains(function ($zone) use ($address) {
                return $zone->city === $address->city
                    && $this->pricingService->distanceMeters(
                        (float) $zone->center_latitude,
                        (float) $zone->center_longitude,
                        (float) $address->latitude,
                        (float) $address->longitude
                    ) <= $zone->radius_meters;
            });

        if (! $zoneMatch) {
            return null;
        }

        $distanceToBranch = $this->pricingService->distanceMeters(
            (float) $latestLocation->latitude,
            (float) $latestLocation->longitude,
            (float) $branch->latitude,
            (float) $branch->longitude,
        );

        $activeLoad = $rider->assignments()
            ->whereIn('status', ['active', 'accepted'])
            ->count();

        if ($activeLoad >= 3) {
            return null;
        }

        return 10000 - (int) floor($distanceToBranch / 50) - ($activeLoad * 500);
    }
}
