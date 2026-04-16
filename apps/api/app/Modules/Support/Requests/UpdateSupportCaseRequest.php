<?php

namespace App\Modules\Support\Requests;

use App\Modules\Support\Enums\OrderCancellationReasonCode;
use App\Modules\Support\Enums\SupportCaseStatus;
use App\Modules\Support\Enums\SupportIssueType;
use App\Modules\Support\Enums\SupportResolutionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSupportCaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'summary' => ['sometimes', 'string', 'max:255'],
            'issue_type' => ['sometimes', 'string', Rule::in(array_column(SupportIssueType::cases(), 'value'))],
            'status' => ['sometimes', 'string', Rule::in(array_column(SupportCaseStatus::cases(), 'value'))],
            'cancellation_reason_code' => ['nullable', 'string', Rule::in(array_column(OrderCancellationReasonCode::cases(), 'value'))],
            'resolution_type' => ['nullable', 'string', Rule::in(array_column(SupportResolutionType::cases(), 'value'))],
            'resolution_notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function bodyParameters(): array
    {
        return [
            'summary' => [
                'description' => 'Updated support case summary.',
                'example' => 'Merchant confirmed one item is unavailable.',
            ],
            'issue_type' => [
                'description' => 'Updated structured issue category.',
                'example' => SupportIssueType::MERCHANT_ISSUE->value,
            ],
            'status' => [
                'description' => 'Updated support case status.',
                'example' => SupportCaseStatus::RESOLVED->value,
            ],
            'cancellation_reason_code' => [
                'description' => 'Structured cancellation reason when the support outcome includes cancellation.',
                'example' => OrderCancellationReasonCode::OUT_OF_STOCK->value,
            ],
            'resolution_type' => [
                'description' => 'Structured support outcome.',
                'example' => SupportResolutionType::CANCELLED_ORDER->value,
            ],
            'resolution_notes' => [
                'description' => 'Detailed support outcome notes.',
                'example' => 'Customer was notified and the merchant confirmed the stock issue.',
            ],
        ];
    }
}
