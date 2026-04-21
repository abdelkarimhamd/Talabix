<?php

namespace App\Modules\Notifications\Resources;

use App\Models\NotificationDelivery;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin NotificationDelivery
 */
class NotificationDeliveryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'order_uuid' => $this->order?->uuid,
            'recipient_user_id' => $this->recipient_user_id,
            'recipient_actor' => $this->recipient_actor,
            'recipient_name' => $this->recipientUser->name,
            'recipient_email' => $this->recipientUser->email,
            'notification_type' => $this->notification_type->value,
            'channel' => $this->channel->value,
            'provider' => $this->provider,
            'provider_reference' => $this->provider_reference,
            'status' => $this->status->value,
            'attempt_count' => (int) $this->attempt_count,
            'title' => $this->title,
            'body' => $this->body,
            'payload' => $this->payload,
            'queued_at' => $this->queued_at,
            'last_attempted_at' => $this->last_attempted_at,
            'next_retry_at' => $this->next_retry_at,
            'last_error' => $this->last_error,
            'sent_at' => $this->sent_at,
            'read_at' => $this->read_at,
            'created_at' => $this->created_at,
        ];
    }
}
