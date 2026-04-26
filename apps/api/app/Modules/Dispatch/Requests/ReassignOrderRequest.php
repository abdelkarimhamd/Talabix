<?php

namespace App\Modules\Dispatch\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReassignOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'rider_uuid' => ['required', 'uuid'],
            'reason_code' => [
                'required',
                'string',
                Rule::in([
                    'sla_risk',
                    'rider_unavailable',
                    'customer_request',
                    'load_balance',
                    'ops_override',
                    'other',
                ]),
            ],
            'reason_note' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, array<string, string>>
     */
    public function bodyParameters(): array
    {
        return [
            'rider_uuid' => [
                'description' => 'UUID of the replacement rider profile selected by ops.',
                'example' => 'ff10916f-9ec0-412f-b6c6-bd8f436f4002',
            ],
            'reason_code' => [
                'description' => 'Structured reason for the manual reassignment.',
                'example' => 'sla_risk',
            ],
            'reason_note' => [
                'description' => 'Optional ops note explaining the reassignment decision.',
                'example' => 'Pickup SLA is at risk; move to the closest available rider.',
            ],
        ];
    }
}
