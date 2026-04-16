<?php

namespace App\Modules\Support\Requests;

use App\Modules\Support\Enums\SupportCaseStatus;
use App\Modules\Support\Enums\SupportIssueType;
use App\Modules\Support\Enums\SupportResolutionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreSupportCaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'summary' => ['required', 'string', 'max:255'],
            'issue_type' => ['required', 'string', Rule::in(array_column(SupportIssueType::cases(), 'value'))],
            'status' => ['nullable', 'string', Rule::in(array_column(SupportCaseStatus::cases(), 'value'))],
            'resolution_type' => ['nullable', 'string', Rule::in(array_column(SupportResolutionType::cases(), 'value'))],
            'resolution_notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if (
                    $this->input('status') === SupportCaseStatus::RESOLVED->value
                    && blank($this->input('resolution_type'))
                ) {
                    $validator->errors()->add('resolution_type', __('validation.required'));
                }
            },
        ];
    }

    public function bodyParameters(): array
    {
        return [
            'summary' => [
                'description' => 'Short support case summary visible to ops users.',
                'example' => 'Customer needs a pre-arrival call before rider handoff.',
            ],
            'issue_type' => [
                'description' => 'Structured support issue category.',
                'example' => SupportIssueType::CUSTOMER_REQUEST->value,
            ],
            'status' => [
                'description' => 'Current support case status.',
                'example' => SupportCaseStatus::INVESTIGATING->value,
            ],
            'resolution_type' => [
                'description' => 'Optional resolution type when the case outcome is already known.',
                'example' => SupportResolutionType::CUSTOMER_CONTACTED->value,
            ],
            'resolution_notes' => [
                'description' => 'Optional resolution notes for support audit context.',
                'example' => 'Customer confirmed the rider can leave the order at reception.',
            ],
        ];
    }
}
