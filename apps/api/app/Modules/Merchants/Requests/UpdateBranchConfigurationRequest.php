<?php

namespace App\Modules\Merchants\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBranchConfigurationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['sometimes', 'string', 'in:active,inactive'],
            'accepts_orders' => ['sometimes', 'boolean'],
        ];
    }
}
