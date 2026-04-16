<?php

namespace App\Modules\Notifications\Requests;

use Illuminate\Foundation\Http\FormRequest;

class NotificationInboxRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'order_uuid' => ['nullable', 'uuid'],
            'unread_only' => ['nullable', 'boolean'],
        ];
    }
}
