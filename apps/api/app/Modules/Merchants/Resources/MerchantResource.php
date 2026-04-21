<?php

namespace App\Modules\Merchants\Resources;

use App\Models\Merchant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Merchant
 */
class MerchantResource extends JsonResource
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
            'is_open_now' => (bool) ($this->is_open_now ?? false),
            'is_serviceable' => $this->is_serviceable,
            'serviceable_branch_count' => $this->serviceable_branch_count,
            'branches' => BranchResource::collection($this->whenLoaded('branches')),
        ];
    }
}
