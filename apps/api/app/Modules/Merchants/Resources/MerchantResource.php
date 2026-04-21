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
        $attributes = $this->resource->getAttributes();

        return [
            'uuid' => $this->uuid,
            'name' => $this->name,
            'slug' => $this->slug,
            'status' => $this->status,
            'is_open_now' => (bool) ($attributes['is_open_now'] ?? false),
            'is_serviceable' => array_key_exists('is_serviceable', $attributes)
                ? (bool) $attributes['is_serviceable']
                : null,
            'serviceable_branch_count' => array_key_exists('serviceable_branch_count', $attributes)
                ? (int) $attributes['serviceable_branch_count']
                : null,
            'branches' => BranchResource::collection($this->whenLoaded('branches')),
        ];
    }
}
