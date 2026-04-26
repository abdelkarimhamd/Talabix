<?php

namespace App\Modules\Merchants\Resources;

use App\Models\BranchServiceZone;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin BranchServiceZone
 */
class BranchServiceZoneResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'name' => $this->name,
            'city' => $this->city,
            'postal_code' => $this->postal_code,
            'center_latitude' => (float) $this->center_latitude,
            'center_longitude' => (float) $this->center_longitude,
            'radius_meters' => (int) $this->radius_meters,
            'is_active' => (bool) $this->is_active,
        ];
    }
}
