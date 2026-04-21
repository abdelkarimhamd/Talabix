<?php

namespace App\Modules\Shared\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMapsProviderConfigurationRequest extends FormRequest
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
            'provider' => ['sometimes', 'string', 'in:google_maps,demo'],
            'google_maps_api_key' => ['sometimes', 'string', 'min:1', 'max:2048'],
            'clear_google_maps_api_key' => ['sometimes', 'boolean'],
            'google_maps_region' => ['sometimes', 'string', 'min:1', 'max:32'],
            'google_maps_location_bias' => ['sometimes', 'nullable', 'string', 'max:255'],
            'google_maps_timeout_seconds' => ['sometimes', 'numeric', 'between:0.5,30'],
            'google_maps_fallback_to_demo' => ['sometimes', 'boolean'],
        ];
    }
}
