<?php

namespace App\Modules\Offers\Resources;

use App\Models\PromotionOffer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin PromotionOffer
 */
class PromotionOfferResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'merchant_uuid' => data_get($this, 'branch.merchant.uuid'),
            'merchant_name' => data_get($this, 'branch.merchant.name'),
            'branch_uuid' => data_get($this->branch, 'uuid'),
            'branch_name' => data_get($this->branch, 'name'),
            'catalog_item_uuid' => data_get($this->catalogItem, 'uuid'),
            'catalog_item_name' => data_get($this->catalogItem, 'name'),
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
