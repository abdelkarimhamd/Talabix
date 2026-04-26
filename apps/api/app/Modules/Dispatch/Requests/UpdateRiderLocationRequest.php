<?php

namespace App\Modules\Dispatch\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRiderLocationRequest extends FormRequest
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
            'latitude' => ['required', 'numeric'],
            'longitude' => ['required', 'numeric'],
        ];
    }
}
