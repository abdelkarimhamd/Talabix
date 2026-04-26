<?php

namespace App\Modules\Orders\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReportDeliveryExceptionRequest extends FormRequest
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
            'reason_code' => [
                'required',
                'string',
                Rule::in([
                    'customer_unreachable',
                    'address_issue',
                    'merchant_delay',
                    'vehicle_issue',
                    'safety_issue',
                    'other',
                ]),
            ],
            'note' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
