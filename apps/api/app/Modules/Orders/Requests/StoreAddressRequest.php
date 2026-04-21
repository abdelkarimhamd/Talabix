<?php

namespace App\Modules\Orders\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAddressRequest extends FormRequest
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
            'label' => ['required', 'string', 'max:120'],
            'line_1' => ['required', 'string', 'max:255'],
            'line_2' => ['nullable', 'string', 'max:255'],
            'building' => ['nullable', 'string', 'max:120'],
            'floor' => ['nullable', 'string', 'max:60'],
            'apartment' => ['nullable', 'string', 'max:60'],
            'landmark' => ['nullable', 'string', 'max:255'],
            'delivery_notes' => ['nullable', 'string', 'max:1000'],
            'city' => ['required', 'string', 'max:120'],
            'latitude' => ['required', 'numeric'],
            'longitude' => ['required', 'numeric'],
            'is_default' => ['sometimes', 'boolean'],
        ];
    }
}
