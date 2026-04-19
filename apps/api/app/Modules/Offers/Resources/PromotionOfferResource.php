<?php

namespace App\Modules\Offers\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PromotionOfferResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'merchant_uuid' => $this->branch?->merchant?->uuid,
            'merchant_name' => $this->branch?->merchant?->name,
            'branch_uuid' => $this->branch?->uuid,
            'branch_name' => $this->branch?->name,
            'catalog_item_uuid' => $this->catalogItem?->uuid,
            'catalog_item_name' => $this->catalogItem?->name,
            'code' => $this->code,
            'title' => $this->title,
            'discount_label' => $this->discount_label,
            'discount_type' => $this->discount_type,
            'percent' => $this->percent,
            'amount_minor' => $this->amount_minor,
            'min_spend_minor' => $this->min_spend_minor,
            'requires_promo_code' => (bool) $this->requires_promo_code,
            'is_active' => (bool) $this->is_active,
            'starts_at' => $this->starts_at,
            'expires_at' => $this->expires_at,
        ];
    }
}
