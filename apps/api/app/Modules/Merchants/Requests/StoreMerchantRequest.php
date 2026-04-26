<?php

namespace App\Modules\Merchants\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreMerchantRequest extends FormRequest
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
            'slug' => ['required', 'string', 'max:255'],
            'platform_commission_bps' => ['nullable', 'integer', 'between:0,10000'],
            'branch.name' => ['required', 'string', 'max:255'],
            'branch.city' => ['required', 'string', 'max:120'],
            'branch.address_line' => ['required', 'string', 'max:255'],
            'branch.latitude' => ['required', 'numeric'],
            'branch.longitude' => ['required', 'numeric'],
            'branch.hours' => ['required', 'array', 'min:1'],
            'branch.hours.*.day_of_week' => ['required', 'integer', 'between:0,6'],
            'branch.hours.*.opens_at' => ['nullable', 'date_format:H:i'],
            'branch.hours.*.closes_at' => ['nullable', 'date_format:H:i'],
            'branch.zones' => ['required', 'array', 'min:1'],
            'branch.zones.*.name' => ['required', 'string'],
            'branch.zones.*.city' => ['required', 'string'],
            'branch.zones.*.center_latitude' => ['required', 'numeric'],
            'branch.zones.*.center_longitude' => ['required', 'numeric'],
            'branch.zones.*.radius_meters' => ['required', 'integer', 'min:100'],
            'branch.fee_bands' => ['required', 'array', 'min:1'],
            'branch.fee_bands.*.min_distance_meters' => ['required', 'integer', 'min:0'],
            'branch.fee_bands.*.max_distance_meters' => ['required', 'integer', 'min:1'],
            'branch.fee_bands.*.fee_minor' => ['required', 'integer', 'min:0'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            foreach ($this->input('branch.fee_bands', []) as $index => $band) {
                $minDistance = (int) ($band['min_distance_meters'] ?? 0);
                $maxDistance = (int) ($band['max_distance_meters'] ?? 0);

                if ($maxDistance <= $minDistance) {
                    $validator->errors()->add(
                        "branch.fee_bands.{$index}.max_distance_meters",
                        'The max distance must be greater than the min distance.'
                    );
                }
            }
        });
    }
}
