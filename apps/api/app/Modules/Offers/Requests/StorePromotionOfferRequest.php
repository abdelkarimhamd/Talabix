<?php

namespace App\Modules\Offers\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePromotionOfferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'branch_uuid' => ['required', 'uuid'],
            'catalog_item_uuid' => ['nullable', 'uuid'],
            'code' => ['nullable', 'string', 'max:64', Rule::requiredIf(fn () => $this->boolean('requires_promo_code'))],
            'title' => ['required', 'string', 'max:255'],
            'discount_label' => ['required', 'string', 'max:255'],
            'discount_type' => ['required', Rule::in(['delivery', 'item_percent', 'item_fixed'])],
            'percent' => ['nullable', 'integer', 'min:1', 'max:100', Rule::requiredIf(fn () => $this->input('discount_type') === 'item_percent')],
            'amount_minor' => ['nullable', 'integer', 'min:1', Rule::requiredIf(fn () => $this->input('discount_type') === 'item_fixed')],
            'min_spend_minor' => ['nullable', 'integer', 'min:0'],
            'requires_promo_code' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'starts_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after:starts_at'],
        ];
    }
}
