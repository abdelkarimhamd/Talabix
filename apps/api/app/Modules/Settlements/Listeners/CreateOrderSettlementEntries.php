<?php

namespace App\Modules\Settlements\Listeners;

use App\Modules\Orders\Enums\OrderStatus;
use App\Modules\Orders\Events\OrderStatusChanged;
use App\Modules\Settlements\Services\SettlementService;

class CreateOrderSettlementEntries
{
    public function __construct(private readonly SettlementService $settlementService) {}

    public function handle(OrderStatusChanged $event): void
    {
        if ($event->to === OrderStatus::DELIVERED) {
            $this->settlementService->createEntriesForOrder($event->order);
        }
    }
}
