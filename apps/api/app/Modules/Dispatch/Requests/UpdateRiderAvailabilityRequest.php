<?php

namespace App\Modules\Dispatch\Requests;

use App\Modules\Dispatch\Enums\RiderAvailability;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateRiderAvailabilityRequest extends FormRequest
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
            'availability' => ['required', new Enum(RiderAvailability::class)],
        ];
    }
}
