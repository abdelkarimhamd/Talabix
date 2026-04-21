<?php

namespace App\Modules\Settlements\Resources;

use App\Models\LedgerEntry;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin LedgerEntry
 */
class LedgerEntryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'order_uuid' => data_get($this->order, 'uuid'),
            'merchant_id' => $this->merchant_id,
            'merchant_name' => data_get($this->merchant, 'name'),
            'rider_profile_id' => $this->rider_profile_id,
            'rider_name' => data_get($this->riderProfile, 'user.name'),
            'entry_type' => $this->entry_type->value,
            'amount_minor' => $this->amount_minor,
            'currency' => $this->currency,
            'notes' => $this->notes,
            'occurred_at' => $this->occurred_at,
        ];
    }
}
