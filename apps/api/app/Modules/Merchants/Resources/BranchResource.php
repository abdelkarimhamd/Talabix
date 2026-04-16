<?php

namespace App\Modules\Merchants\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BranchResource extends JsonResource
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
            'is_open_now' => (bool) ($this->is_open_now ?? false),
            'today_hours' => $this->today_hours,
            'serviceability' => $this->serviceability,
        ];
    }
}
