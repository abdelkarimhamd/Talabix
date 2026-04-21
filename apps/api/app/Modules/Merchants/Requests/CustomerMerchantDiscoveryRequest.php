<?php

namespace App\Modules\Merchants\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CustomerMerchantDiscoveryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'address_uuid' => ['nullable', 'uuid'],
            'search' => ['nullable', 'string', 'max:120'],
            'open_now' => ['nullable', 'boolean'],
        ];
    }
}
