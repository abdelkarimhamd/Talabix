<?php

namespace App\Modules\Merchants\Resources;

use App\Models\BranchFeeBand;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin BranchFeeBand
 */
class BranchFeeBandResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'min_distance_meters' => (int) $this->min_distance_meters,
            'max_distance_meters' => (int) $this->max_distance_meters,
            'fee_minor' => (int) $this->fee_minor,
        ];
    }
}
