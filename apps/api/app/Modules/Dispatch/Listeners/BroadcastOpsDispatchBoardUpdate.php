<?php

namespace App\Modules\Dispatch\Listeners;

use App\Modules\Dispatch\Events\OpsDispatchBoardUpdated;
use App\Modules\Orders\Events\OrderStatusChanged;

class BroadcastOpsDispatchBoardUpdate
{
    public function handle(OrderStatusChanged $event): void
    {
        event(new OpsDispatchBoardUpdated(
            order: $event->order->fresh(),
            reason: 'order_status_changed',
            payload: [
                'from_status' => $event->from->value,
                'to_status' => $event->to->value,
            ],
        ));
    }
}
