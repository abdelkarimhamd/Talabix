<?php

namespace App\Modules\Merchants\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OpsBranchConfigurationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'name' => $this->name,
            'status' => $this->status,
            'city' => $this->city,
            'address_line' => $this->address_line,
            'latitude' => (float) $this->latitude,
            'longitude' => (float) $this->longitude,
            'accepts_orders' => (bool) $this->accepts_orders,
            'service_zones' => BranchServiceZoneResource::collection($this->whenLoaded('serviceZones')),
            'fee_bands' => BranchFeeBandResource::collection($this->whenLoaded('feeBands')),
        ];
    }
}
