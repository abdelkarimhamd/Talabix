<?php

namespace App\Modules\Identity\Requests;

use App\Modules\Identity\Enums\UserAccountStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOpsUserRequest extends FormRequest
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
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:32'],
            'role' => ['sometimes', Rule::in(['ops_admin', 'ops_dispatcher', 'ops_support'])],
            'account_status' => ['sometimes', Rule::enum(UserAccountStatus::class)],
        ];
    }
}
