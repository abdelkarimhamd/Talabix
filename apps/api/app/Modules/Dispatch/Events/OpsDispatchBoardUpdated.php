<?php

namespace App\Modules\Dispatch\Events;

use App\Models\Order;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OpsDispatchBoardUpdated implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public ?Order $order = null,
        public string $reason = 'dispatch_state_changed',
        public array $payload = [],
    ) {}

    public function broadcastOn(): array
    {
        if (app()->runningUnitTests()) {
            return [];
        }

        return [new PrivateChannel('ops.dispatch')];
    }

    public function broadcastAs(): string
    {
        return 'ops.dispatch.updated';
    }

    public function broadcastWhen(): bool
    {
        return ! app()->runningUnitTests();
    }

    public function broadcastWith(): array
    {
        return [
            'order_uuid' => $this->order?->uuid,
            'reason' => $this->reason,
            'payload' => $this->payload,
        ];
    }
}
