<?php

namespace App\Modules\Merchants\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MerchantConfigurationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'name' => $this->name,
            'slug' => $this->slug,
            'status' => $this->status,
            'platform_commission_bps' => (int) $this->platform_commission_bps,
            'branches' => OpsBranchConfigurationResource::collection($this->whenLoaded('branches')),
        ];
    }
}
