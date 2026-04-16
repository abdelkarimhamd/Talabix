<?php

namespace App\Providers;

use App\Modules\Dispatch\Listeners\BroadcastOpsDispatchBoardUpdate;
use App\Modules\Notifications\Listeners\QueueOrderStatusNotifications;
use App\Modules\Orders\Events\OrderStatusChanged;
use App\Modules\Orders\Listeners\AttemptAutoDispatch;
use App\Modules\Settlements\Listeners\CreateOrderSettlementEntries;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        OrderStatusChanged::class => [
            QueueOrderStatusNotifications::class,
            AttemptAutoDispatch::class,
            CreateOrderSettlementEntries::class,
            BroadcastOpsDispatchBoardUpdate::class,
        ],
    ];
}
