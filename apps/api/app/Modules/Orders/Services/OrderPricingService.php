<?php

namespace App\Modules\Orders\Services;

use App\Models\Branch;
use App\Models\CatalogItem;
use App\Models\CustomerAddress;
use App\Models\PromotionOffer;
use App\Modules\Settlements\Enums\LedgerEntryType;
use App\Modules\Shared\Services\MapsProviderService;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class OrderPricingService
{
    public function __construct(private readonly MapsProviderService $mapsProviderService) {}

    public function quote(Branch $branch, CustomerAddress $address, Collection $lineItems, ?string $promoCode = null): array
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
        $discounts = $this->calculateOfferDiscounts(
            $branch,
            $items,
            $subtotal,
            $deliveryFee,
            $promoCode
        );

        return [
            'items' => $items->values()->all(),
            'pricing' => [
                'subtotal_minor' => $subtotal,
                'delivery_fee_minor' => $deliveryFee,
                'item_discount_minor' => $discounts['item_discount_minor'],
                'delivery_discount_minor' => $discounts['delivery_discount_minor'],
                'discount_minor' => $discounts['discount_minor'],
                'platform_commission_minor' => $commission,
                'rider_earning_minor' => $riderEarning,
                'total_minor' => max(0, $subtotal + $deliveryFee - $discounts['discount_minor']),
                'currency' => 'SAR',
                'applied_offer_ids' => $discounts['applied_offer_ids'],
                'applied_offers' => $discounts['applied_offers'],
                'redeemed_promo_code' => $discounts['redeemed_promo_code'],
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

    private function calculateOfferDiscounts(
        Branch $branch,
        Collection $items,
        int $subtotal,
        int $deliveryFee,
        ?string $promoCode,
    ): array {
        $normalizedPromoCode = $this->normalizePromoCode($promoCode);
        $catalogItemIds = $items->pluck('catalog_item_id')->filter()->unique()->values();
        $lineTotalsByCatalogItem = $items
            ->groupBy('catalog_item_id')
            ->map(fn (Collection $group) => (int) $group->sum('line_total_minor'));
        $offers = PromotionOffer::query()
            ->where('branch_id', $branch->id)
            ->where('is_active', true)
            ->where('min_spend_minor', '<=', $subtotal)
            ->where(function ($query) use ($catalogItemIds) {
                $query->whereNull('catalog_item_id')
                    ->orWhereIn('catalog_item_id', $catalogItemIds);
            })
            ->where(function ($query) {
                $query->whereNull('starts_at')
                    ->orWhere('starts_at', '<=', now());
            })
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->orderBy('id')
            ->get();
        $appliedOffers = [];
        $appliedOfferIds = [];
        $manualPromoMatched = false;
        $itemDiscount = 0;
        $deliveryDiscount = 0;

        foreach ($offers as $offer) {
            $offerPromoCode = $this->normalizePromoCode($offer->code);

            if ($offer->requires_promo_code) {
                if (! $normalizedPromoCode || $offerPromoCode !== $normalizedPromoCode) {
                    continue;
                }

                $manualPromoMatched = true;
            }

            if (! $offer->requires_promo_code && $normalizedPromoCode && $offerPromoCode === $normalizedPromoCode) {
                $manualPromoMatched = true;
            }

            $eligibleLineTotal = $offer->catalog_item_id
                ? (int) ($lineTotalsByCatalogItem[$offer->catalog_item_id] ?? 0)
                : $subtotal;
            $discountMinor = $this->discountMinorForOffer(
                $offer,
                $eligibleLineTotal,
                $deliveryFee,
                $itemDiscount,
                $deliveryDiscount,
                $subtotal
            );

            if ($discountMinor <= 0) {
                continue;
            }

            if ($offer->discount_type === 'delivery') {
                $deliveryDiscount += $discountMinor;
            } else {
                $itemDiscount += $discountMinor;
            }

            $appliedOfferIds[] = $offer->uuid;
            $appliedOffers[] = [
                'id' => $offer->uuid,
                'title' => $offer->title,
                'discount_label' => $offer->discount_label,
                'discount_minor' => $discountMinor,
                'discount_type' => $offer->discount_type,
                'promo_code' => $offer->requires_promo_code ? $normalizedPromoCode : null,
            ];
        }

        if ($normalizedPromoCode && ! $manualPromoMatched) {
            throw ValidationException::withMessages([
                'promo_code' => 'The promo code is not valid for this cart.',
            ]);
        }

        return [
            'applied_offer_ids' => $appliedOfferIds,
            'applied_offers' => $appliedOffers,
            'delivery_discount_minor' => $deliveryDiscount,
            'discount_minor' => $itemDiscount + $deliveryDiscount,
            'item_discount_minor' => $itemDiscount,
            'redeemed_promo_code' => $manualPromoMatched ? $normalizedPromoCode : null,
        ];
    }

    private function discountMinorForOffer(
        PromotionOffer $offer,
        int $eligibleLineTotal,
        int $deliveryFee,
        int $itemDiscount,
        int $deliveryDiscount,
        int $subtotal,
    ): int {
        if ($offer->discount_type === 'delivery') {
            return max(0, $deliveryFee - $deliveryDiscount);
        }

        if ($eligibleLineTotal <= 0) {
            return 0;
        }

        $discountMinor = match ($offer->discount_type) {
            'item_percent' => (int) floor($eligibleLineTotal * (($offer->percent ?? 0) / 100)),
            'item_fixed' => min($eligibleLineTotal, (int) ($offer->amount_minor ?? 0)),
            default => 0,
        };

        return min($discountMinor, max(0, $subtotal - $itemDiscount));
    }

    private function normalizePromoCode(?string $promoCode): ?string
    {
        $normalized = str($promoCode ?? '')->trim()->upper()->toString();

        return $normalized === '' ? null : $normalized;
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
