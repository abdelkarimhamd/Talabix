<?php

namespace App\Modules\Merchants\Resources;

use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Branch
 */
class BranchResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $attributes = $this->resource->getAttributes();

        return [
            'uuid' => $this->uuid,
            'name' => $this->name,
            'status' => $this->status,
            'city' => $this->city,
            'address_line' => $this->address_line,
            'latitude' => (float) $this->latitude,
            'longitude' => (float) $this->longitude,
            'accepts_orders' => (bool) $this->accepts_orders,
            'is_open_now' => (bool) ($attributes['is_open_now'] ?? false),
            'today_hours' => $attributes['today_hours'] ?? null,
            'serviceability' => $attributes['serviceability'] ?? null,
        ];
    }
}
