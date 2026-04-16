<?php

namespace App\Modules\Notifications\Requests;

use App\Modules\Notifications\Enums\NotificationChannel;
use App\Modules\Notifications\Enums\NotificationDeliveryStatus;
use App\Modules\Notifications\Enums\NotificationType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class NotificationIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'order_uuid' => ['nullable', 'uuid'],
            'recipient_actor' => ['nullable', 'string', Rule::in(['customer', 'merchant', 'rider'])],
            'channel' => ['nullable', 'string', Rule::in(array_column(NotificationChannel::cases(), 'value'))],
            'provider' => ['nullable', 'string', 'max:40'],
            'status' => ['nullable', 'string', Rule::in(array_column(NotificationDeliveryStatus::cases(), 'value'))],
            'notification_type' => ['nullable', 'string', Rule::in(array_column(NotificationType::cases(), 'value'))],
        ];
    }
}
