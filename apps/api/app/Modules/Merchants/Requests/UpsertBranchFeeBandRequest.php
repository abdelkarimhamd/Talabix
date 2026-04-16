<?php

namespace App\Modules\Merchants\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpsertBranchFeeBandRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'min_distance_meters' => ['required', 'integer', 'min:0'],
            'max_distance_meters' => ['required', 'integer', 'min:1'],
            'fee_minor' => ['required', 'integer', 'min:0'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $minDistance = (int) $this->input('min_distance_meters', 0);
            $maxDistance = (int) $this->input('max_distance_meters', 0);

            if ($maxDistance <= $minDistance) {
                $validator->errors()->add(
                    'max_distance_meters',
                    'The max distance must be greater than the min distance.'
                );
            }
        });
    }
}
