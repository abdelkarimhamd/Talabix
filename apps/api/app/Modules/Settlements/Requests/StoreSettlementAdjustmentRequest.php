<?php

namespace App\Modules\Settlements\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSettlementAdjustmentRequest extends FormRequest
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
            'amount_minor' => ['required', 'integer', 'not_in:0'],
            'notes' => ['required', 'string', 'max:255'],
        ];
    }
}
