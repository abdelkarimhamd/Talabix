<?php

namespace App\Modules\Catalog\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CatalogItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $attributes = $this->resource->getAttributes();

        return [
            'uuid' => $this->uuid,
            'merchant_id' => $this->merchant_id,
            'merchant_uuid' => $this->merchant?->uuid,
            'name' => $this->name,
            'category_name' => $this->category_name,
            'sku' => $this->sku,
            'description' => $this->description,
            'image_url' => $this->image_url,
            'base_price_minor' => $this->base_price_minor,
            'base_stock' => $this->base_stock,
            'is_active' => (bool) $this->is_active,
            'effective_branch_uuid' => $this->when(
                array_key_exists('effective_branch_uuid', $attributes),
                fn () => $attributes['effective_branch_uuid']
            ),
            'effective_price_minor' => $this->when(
                array_key_exists('effective_price_minor', $attributes),
                fn () => (int) $attributes['effective_price_minor']
            ),
            'effective_stock_quantity' => $this->when(
                array_key_exists('effective_stock_quantity', $attributes),
                fn () => $attributes['effective_stock_quantity']
            ),
            'effective_is_available' => $this->when(
                array_key_exists('effective_is_available', $attributes),
                fn () => (bool) $attributes['effective_is_available']
            ),
            'modifier_groups' => $this->whenLoaded(
                'modifierGroups',
                fn () => CatalogModifierGroupResource::collection($this->modifierGroups)->resolve()
            ),
            'branch_overrides' => $this->whenLoaded('branchOverrides', fn () => $this->branchOverrides
                ->map(fn ($override) => [
                    'branch_uuid' => $override->branch?->uuid,
                    'branch_name' => $override->branch?->name,
                    'price_minor' => $override->price_minor,
                    'stock_quantity' => $override->stock_quantity,
                    'is_available' => (bool) $override->is_available,
                ])
                ->values()
                ->all()),
        ];
    }
}
