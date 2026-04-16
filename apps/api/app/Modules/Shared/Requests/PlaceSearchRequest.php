<?php

namespace App\Modules\Shared\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PlaceSearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'query' => ['required', 'string', 'min:2', 'max:120'],
        ];
    }

    public function queryParameters(): array
    {
        return [
            'query' => [
                'description' => 'Place search text entered by the customer while creating an address.',
                'example' => 'King Fahd',
            ],
        ];
    }
}
