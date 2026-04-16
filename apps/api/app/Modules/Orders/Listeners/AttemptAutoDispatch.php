<?php

namespace App\Modules\Orders\Listeners;

use App\Modules\Dispatch\Services\AutoAssignOrderAction;
use App\Modules\Orders\Enums\OrderStatus;
use App\Modules\Orders\Events\OrderStatusChanged;

class AttemptAutoDispatch
{
    public function __construct(private readonly AutoAssignOrderAction $autoAssignOrderAction)
    {
    }

    public function handle(OrderStatusChanged $event): void
    {
        if ($event->to === OrderStatus::ACCEPTED) {
            $this->autoAssignOrderAction->execute($event->order);
        }
    }
}
