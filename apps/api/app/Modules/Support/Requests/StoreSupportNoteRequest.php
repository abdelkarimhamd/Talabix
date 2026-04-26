<?php

namespace App\Modules\Support\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSupportNoteRequest extends FormRequest
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
            'body' => ['required', 'string'],
            'attachment' => ['nullable', 'file', 'max:5120'],
        ];
    }

    /**
     * @return array<string, array<string, string>>
     */
    public function bodyParameters(): array
    {
        return [
            'body' => [
                'description' => 'Support note body visible to ops users and included in the order support history.',
                'example' => 'Customer confirmed they can meet the rider in the lobby.',
            ],
            'attachment' => [
                'description' => 'Optional support attachment file. Maximum size is 5 MB.',
            ],
        ];
    }
}
