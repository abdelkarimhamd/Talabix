<?php

namespace App\Modules\Merchants\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpsertBranchServiceZoneRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:120'],
            'postal_code' => ['nullable', 'string', 'max:40'],
            'center_latitude' => ['required', 'numeric'],
            'center_longitude' => ['required', 'numeric'],
            'radius_meters' => ['required', 'integer', 'min:100'],
            'is_active' => ['required', 'boolean'],
        ];
    }
}
