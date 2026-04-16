<?php

namespace App\Modules\Settlements\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LedgerEntryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'order_uuid' => $this->order?->uuid,
            'merchant_id' => $this->merchant_id,
            'merchant_name' => $this->merchant?->name,
            'rider_profile_id' => $this->rider_profile_id,
            'rider_name' => $this->riderProfile?->user?->name,
            'entry_type' => $this->entry_type?->value ?? $this->entry_type,
            'amount_minor' => $this->amount_minor,
            'currency' => $this->currency,
            'notes' => $this->notes,
            'occurred_at' => $this->occurred_at,
        ];
    }
}
