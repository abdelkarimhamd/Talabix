<?php

namespace App\Models;

use App\Modules\Notifications\Enums\NotificationChannel;
use App\Modules\Notifications\Enums\NotificationDeliveryStatus;
use App\Modules\Notifications\Enums\NotificationType;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int|null $order_id
 * @property int $recipient_user_id
 * @property string $recipient_actor
 * @property NotificationType $notification_type
 * @property NotificationChannel $channel
 * @property string|null $provider
 * @property string|null $provider_reference
 * @property NotificationDeliveryStatus $status
 * @property int $attempt_count
 * @property string $title
 * @property string $body
 * @property array<string, mixed>|null $payload
 * @property Carbon|null $queued_at
 * @property Carbon|null $last_attempted_at
 * @property Carbon|null $next_retry_at
 * @property string|null $last_error
 * @property Carbon|null $sent_at
 * @property Carbon|null $read_at
 * @property Carbon|null $created_at
 * @property Order|null $order
 * @property User $recipientUser
 */
class NotificationDelivery extends Model
{
    /** @use HasFactory<Factory<NotificationDelivery>> */
    use HasFactory;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'notification_type' => NotificationType::class,
            'channel' => NotificationChannel::class,
            'status' => NotificationDeliveryStatus::class,
            'payload' => 'array',
            'attempt_count' => 'integer',
            'queued_at' => 'datetime',
            'last_attempted_at' => 'datetime',
            'next_retry_at' => 'datetime',
            'sent_at' => 'datetime',
            'read_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /** @return BelongsTo<User, $this> */
    public function recipientUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_user_id');
    }
}
