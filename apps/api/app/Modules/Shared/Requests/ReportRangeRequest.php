<?php

namespace App\Modules\Shared\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReportRangeRequest extends FormRequest
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
            'range_days' => ['nullable', 'integer', 'min:1', 'max:90'],
        ];
    }
}
