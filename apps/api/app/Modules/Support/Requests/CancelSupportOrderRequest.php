<?php

namespace App\Modules\Support\Requests;

use App\Modules\Support\Enums\OrderCancellationReasonCode;
use App\Modules\Support\Enums\SupportIssueType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CancelSupportOrderRequest extends FormRequest
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
            'summary' => ['required', 'string', 'max:255'],
            'issue_type' => ['required', 'string', Rule::in(array_column(SupportIssueType::cases(), 'value'))],
            'reason_code' => ['required', 'string', Rule::in(array_column(OrderCancellationReasonCode::cases(), 'value'))],
            'reason_note' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, array<string, string>>
     */
    public function bodyParameters(): array
    {
        return [
            'summary' => [
                'description' => 'Support case summary for the cancellation decision.',
                'example' => 'Merchant confirmed the requested items are unavailable.',
            ],
            'issue_type' => [
                'description' => 'Structured issue category that led to cancellation.',
                'example' => SupportIssueType::MERCHANT_ISSUE->value,
            ],
            'reason_code' => [
                'description' => 'Structured cancellation reason code.',
                'example' => OrderCancellationReasonCode::OUT_OF_STOCK->value,
            ],
            'reason_note' => [
                'description' => 'Optional human-readable cancellation context.',
                'example' => 'Merchant confirmed the burger line is unavailable tonight.',
            ],
        ];
    }
}
