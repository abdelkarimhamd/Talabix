<?php

namespace App\Modules\Merchants\Resources;

use App\Models\Merchant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Merchant
 */
class MerchantConfigurationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
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
