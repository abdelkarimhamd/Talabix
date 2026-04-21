<?php

use App\Models\DeliveryAssignment;
use Illuminate\Console\Scheduling\Event;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Contracts\Console\Kernel as ConsoleKernel;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Tests\Support\CreatesDomainData;

uses(CreatesDomainData::class);

function scheduledDispatchSlaEvents(): Collection
{
    app(ConsoleKernel::class)->bootstrap();

    return collect(app(Schedule::class)->events())
        ->filter(fn (Event $event): bool => str_contains((string) $event->command, 'ops:dispatch-sla-alerts'))
        ->values();
}

it('schedules dispatch sla breach monitoring', function () {
    $events = scheduledDispatchSlaEvents();

    expect($events)->toHaveCount(1)
        ->and($events->first()->expression)->toBe('*/5 * * * *')
        ->and($events->first()->withoutOverlapping)->toBeTrue();
});

it('logs breached pickup and delivery exception sla counts for ops monitoring', function () {
    config([
        'services.dispatch.pickup_sla_minutes' => 30,
        'services.dispatch.delivery_exception_response_sla_minutes' => 10,
        'services.dispatch.sla_alert_threshold' => 1,
    ]);

    $this->seedRoles();
    $merchantContext = $this->createMerchantContext();
    $customerContext = $this->createCustomerContext();
    ['profile' => $pickupRider] = $this->createRiderContext();
    ['profile' => $exceptionRider] = $this->createRiderContext();

    $pickupOrder = $this->createPlacedOrder($customerContext, $merchantContext);
    $pickupOrder->update([
        'status' => 'assigned',
        'rider_profile_id' => $pickupRider->id,
        'placed_at' => now()->subMinutes(42),
        'accepted_at' => now()->subMinutes(37),
    ]);

    DeliveryAssignment::query()->create([
        'order_id' => $pickupOrder->id,
        'rider_profile_id' => $pickupRider->id,
        'assignment_type' => 'auto',
        'status' => 'active',
        'assigned_at' => now()->subMinutes(35),
        'accepted_at' => now()->subMinutes(32),
    ]);

    $exceptionOrder = $this->createPlacedOrder($customerContext, $merchantContext);
    $exceptionOrder->update([
        'status' => 'picked_up',
        'rider_profile_id' => $exceptionRider->id,
        'placed_at' => now()->subMinutes(40),
        'accepted_at' => now()->subMinutes(35),
    ]);

    DeliveryAssignment::query()->create([
        'order_id' => $exceptionOrder->id,
        'rider_profile_id' => $exceptionRider->id,
        'assignment_type' => 'auto',
        'status' => 'exception_reported',
        'assigned_at' => now()->subMinutes(30),
        'accepted_at' => now()->subMinutes(26),
        'picked_up_at' => now()->subMinutes(20),
    ]);

    $exceptionOrder->timeline()->create([
        'event_type' => 'delivery_exception_reported',
        'actor_user_id' => $exceptionRider->user_id,
        'actor_role' => 'rider',
        'metadata' => [
            'reason_code' => 'customer_unreachable',
            'reason_label' => 'Customer unreachable',
            'reported_by' => 'rider',
        ],
        'created_at' => now()->subMinutes(16),
        'updated_at' => now()->subMinutes(16),
    ]);

    Log::spy();

    $this->artisan('ops:dispatch-sla-alerts')->assertExitCode(0);

    Log::shouldHaveReceived('warning')
        ->with('Dispatch SLA breach window exceeded.', Mockery::on(
            fn (array $context): bool => $context['event'] === 'dispatch_sla_breach_window_exceeded'
                && $context['breached_pickup_assignments'] === 1
                && $context['breached_delivery_exceptions'] === 1
                && $context['threshold'] === 1
                && $context['oldest_pickup_assignment_minutes'] >= 35
                && $context['oldest_delivery_exception_minutes'] >= 16
                && in_array($pickupOrder->uuid, $context['sample_order_uuids'], true)
                && in_array($exceptionOrder->uuid, $context['sample_order_uuids'], true)
        ));
});
