<?php

namespace App\Models;

use App\Modules\Notifications\Enums\NotificationChannel;
use App\Modules\Notifications\Enums\NotificationDeliveryStatus;
use App\Modules\Notifications\Enums\NotificationType;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
