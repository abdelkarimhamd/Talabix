<?php

namespace App\Modules\Identity\Requests;

use App\Modules\Identity\Enums\UserAccountStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreOpsUserRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:32'],
            'role' => ['required', Rule::in(['ops_admin', 'ops_dispatcher', 'ops_support'])],
            'account_status' => ['sometimes', Rule::enum(UserAccountStatus::class)],
            'password' => ['required', 'confirmed', Password::min(8)],
        ];
    }
}
