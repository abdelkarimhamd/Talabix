<?php

namespace App\Modules\Orders\Events;

use App\Models\Order;
use App\Models\User;
use App\Modules\Orders\Enums\OrderStatus;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderStatusChanged
{
    use Dispatchable;
    use SerializesModels;

    /**
     * @param  array<string, mixed>  $metadata
     */
    public function __construct(
        public Order $order,
        public OrderStatus $from,
        public OrderStatus $to,
        public ?User $actor,
        public array $metadata = [],
    ) {}
}
