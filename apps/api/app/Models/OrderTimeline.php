<?php

namespace App\Models;

use App\Modules\Orders\Enums\OrderStatus;
use App\Modules\Orders\Enums\OrderTimelineEventType;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderTimeline extends Model
{
    /** @use HasFactory<Factory<OrderTimeline>> */
    use HasFactory;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'event_type' => OrderTimelineEventType::class,
            'from_status' => OrderStatus::class,
            'to_status' => OrderStatus::class,
            'metadata' => 'array',
        ];
    }
}
