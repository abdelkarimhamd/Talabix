<?php

namespace App\Modules\Catalog\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CatalogModifierGroupResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'name' => $this->name,
            'description' => $this->description,
            'selection_type' => $this->selection_type,
            'min_selected' => $this->min_selected,
            'max_selected' => $this->max_selected,
            'is_active' => (bool) $this->is_active,
            'sort_order' => $this->sort_order,
            'options' => $this->whenLoaded(
                'options',
                fn () => CatalogModifierOptionResource::collection($this->options)->resolve()
            ),
        ];
    }
}
