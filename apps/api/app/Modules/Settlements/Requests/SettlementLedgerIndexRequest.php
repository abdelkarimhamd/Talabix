<?php

namespace App\Modules\Settlements\Requests;

use App\Modules\Settlements\Enums\LedgerEntryType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SettlementLedgerIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'entry_type' => ['nullable', 'string', Rule::in(array_column(LedgerEntryType::cases(), 'value'))],
            'order_uuid' => ['nullable', 'uuid'],
            'direction' => ['nullable', 'string', Rule::in(['positive', 'negative'])],
        ];
    }
}
