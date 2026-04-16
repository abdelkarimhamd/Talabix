<?php

namespace App\Modules\Orders\Services;

use App\Models\Branch;
use App\Models\CatalogItem;
use App\Models\CustomerAddress;
use App\Modules\Shared\Services\MapsProviderService;
use App\Modules\Settlements\Enums\LedgerEntryType;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class OrderPricingService
{
    public function __construct(private readonly MapsProviderService $mapsProviderService)
    {
    }

    public function quote(Branch $branch, CustomerAddress $address, Collection $lineItems): array
    {
        $zone = $branch->serviceZones()
            ->where('is_active', true)
            ->get()
            ->first(function ($candidate) use ($address) {
                return $candidate->city === $address->city
                    && $this->distanceMeters(
                        (float) $candidate->center_latitude,
                        (float) $candidate->center_longitude,
                        (float) $address->latitude,
                        (float) $address->longitude,
                    ) <= $candidate->radius_meters;
            });

        if (! $zone) {
            throw ValidationException::withMessages([
                'address_uuid' => 'The selected address is outside this branch service area.',
            ]);
        }

        $distance = $this->distanceMeters(
            (float) $branch->latitude,
            (float) $branch->longitude,
            (float) $address->latitude,
            (float) $address->longitude,
        );
        $routeEstimate = $this->mapsProviderService->distanceEstimate(
            (float) $branch->latitude,
            (float) $branch->longitude,
            (float) $address->latitude,
            (float) $address->longitude,
        );

        $band = $branch->feeBands()
            ->orderBy('min_distance_meters')
            ->get()
            ->first(fn ($feeBand) => $distance >= $feeBand->min_distance_meters && $distance <= $feeBand->max_distance_meters);

        if (! $band) {
            throw ValidationException::withMessages([
                'address_uuid' => 'No delivery fee band matches the selected address.',
            ]);
        }

        $subtotal = 0;
        $items = $lineItems->map(function (array $entry) use ($branch, &$subtotal) {
            /** @var CatalogItem $catalogItem */
            $catalogItem = $entry['model'];
            $override = $catalogItem->branchOverrides()
                ->where('branch_id', $branch->id)
                ->first();
            [$selectedModifierGroups, $modifierUnitDelta] = $this->resolveSelectedModifiers(
                $catalogItem,
                collect($entry['modifier_option_uuids'] ?? [])
            );

            $price = $override?->price_minor ?? $catalogItem->base_price_minor;
            $available = $override?->is_available ?? $catalogItem->is_active;
            $stock = $override?->stock_quantity ?? $catalogItem->base_stock;

            if (! $available) {
                throw ValidationException::withMessages([
                    'items' => sprintf('%s is not available for this branch.', $catalogItem->name),
                ]);
            }

            if (! is_null($stock) && $stock < $entry['quantity']) {
                throw ValidationException::withMessages([
                    'items' => sprintf('%s does not have enough stock.', $catalogItem->name),
                ]);
            }

            $unitPrice = $price + $modifierUnitDelta;
            $lineTotal = $unitPrice * $entry['quantity'];
            $subtotal += $lineTotal;

            return [
                'catalog_item_id' => $catalogItem->id,
                'quantity' => $entry['quantity'],
                'unit_price_minor' => $unitPrice,
                'line_total_minor' => $lineTotal,
                'item_snapshot' => [
                    'uuid' => $catalogItem->uuid,
                    'name' => $catalogItem->name,
                    'sku' => $catalogItem->sku,
                    'category_name' => $catalogItem->category_name,
                    'image_url' => $catalogItem->image_url,
                    'selected_modifier_groups' => $selectedModifierGroups,
                ],
            ];
        });

        $commission = (int) round($subtotal * (($branch->merchant?->platform_commission_bps ?? 1200) / 10000));
        $deliveryFee = $band->fee_minor;
        $riderEarning = $deliveryFee;

        return [
            'items' => $items->values()->all(),
            'pricing' => [
                'subtotal_minor' => $subtotal,
                'delivery_fee_minor' => $deliveryFee,
                'platform_commission_minor' => $commission,
                'rider_earning_minor' => $riderEarning,
                'total_minor' => $subtotal + $deliveryFee,
                'currency' => 'SAR',
                'distance_meters' => $distance,
                'estimated_duration_minutes' => $routeEstimate['duration_minutes'],
                'maps_provider' => $routeEstimate['provider'],
                'zone_id' => $zone->id,
                'fee_band_id' => $band->id,
                'ledger_entry_types' => array_map(
                    fn (LedgerEntryType $type) => $type->value,
                    LedgerEntryType::cases()
                ),
            ],
        ];
    }

    private function resolveSelectedModifiers(CatalogItem $catalogItem, Collection $selectedOptionUuids): array
    {
        $catalogItem->loadMissing(['modifierGroups.options']);

        $selectedOptionUuids = $selectedOptionUuids
            ->filter()
            ->unique()
            ->values();

        $modifierGroups = $catalogItem->modifierGroups
            ->where('is_active', true)
            ->values();

        $availableOptionUuids = $modifierGroups
            ->flatMap(fn ($group) => $group->options->where('is_active', true)->pluck('uuid'))
            ->unique()
            ->values();

        if ($selectedOptionUuids->diff($availableOptionUuids)->isNotEmpty()) {
            throw ValidationException::withMessages([
                'items' => sprintf('One or more selected modifiers are invalid for %s.', $catalogItem->name),
            ]);
        }

        $selectedModifierGroups = [];
        $modifierUnitDelta = 0;

        foreach ($modifierGroups as $group) {
            $groupOptions = $group->options
                ->where('is_active', true)
                ->sortBy(fn ($option) => sprintf('%05d-%s', $option->sort_order, $option->name))
                ->values();

            $selectedOptions = $groupOptions
                ->whereIn('uuid', $selectedOptionUuids)
                ->values();

            $minSelected = (int) ($group->min_selected ?? 0);
            $maxSelected = $group->max_selected ?? ($group->selection_type === 'single' ? 1 : null);

            if ($selectedOptions->count() < $minSelected) {
                throw ValidationException::withMessages([
                    'items' => sprintf('%s requires at least %d option(s) for %s.', $catalogItem->name, $minSelected, $group->name),
                ]);
            }

            if (! is_null($maxSelected) && $selectedOptions->count() > (int) $maxSelected) {
                throw ValidationException::withMessages([
                    'items' => sprintf('%s allows at most %d option(s) for %s.', $catalogItem->name, $maxSelected, $group->name),
                ]);
            }

            if ($group->selection_type === 'single' && $selectedOptions->count() > 1) {
                throw ValidationException::withMessages([
                    'items' => sprintf('%s only allows one option for %s.', $catalogItem->name, $group->name),
                ]);
            }

            if ($selectedOptions->isEmpty()) {
                continue;
            }

            $modifierUnitDelta += $selectedOptions->sum('price_delta_minor');

            $selectedModifierGroups[] = [
                'uuid' => $group->uuid,
                'name' => $group->name,
                'selection_type' => $group->selection_type,
                'options' => $selectedOptions
                    ->map(fn ($option) => [
                        'uuid' => $option->uuid,
                        'name' => $option->name,
                        'price_delta_minor' => $option->price_delta_minor,
                    ])
                    ->values()
                    ->all(),
            ];
        }

        return [$selectedModifierGroups, $modifierUnitDelta];
    }

    public function distanceMeters(float $fromLat, float $fromLng, float $toLat, float $toLng): int
    {
        return $this->mapsProviderService->distanceMeters($fromLat, $fromLng, $toLat, $toLng);
    }
}
