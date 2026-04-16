<?php

namespace App\Modules\Merchants\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMerchantConfigurationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['sometimes', 'string', 'in:active,inactive'],
            'platform_commission_bps' => ['sometimes', 'integer', 'between:0,10000'],
        ];
    }
}
