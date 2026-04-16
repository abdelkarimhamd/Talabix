<?php

namespace App\Modules\Orders\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CompleteDeliveryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'proof_type' => ['required', 'string', Rule::in(['photo', 'recipient_confirmation', 'handoff_code'])],
            'recipient_name' => ['nullable', 'string', 'max:120'],
            'proof_notes' => ['nullable', 'string', 'max:1000'],
            'proof_reference' => ['nullable', 'string', 'max:255'],
        ];
    }
}
