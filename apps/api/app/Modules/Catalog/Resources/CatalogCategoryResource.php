<?php

namespace App\Modules\Catalog\Resources;

use App\Models\CatalogCategory;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin CatalogCategory
 */
class CatalogCategoryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'merchant_id' => $this->merchant_id,
            'merchant_uuid' => $this->merchant?->uuid,
            'name' => $this->name,
            'description' => $this->description,
            'is_active' => (bool) $this->is_active,
            'sort_order' => (int) $this->sort_order,
            'item_count' => (int) (
                $this->resource->getAttribute('item_count') ?? 0
            ),
        ];
    }
}
