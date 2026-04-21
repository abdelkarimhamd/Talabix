<?php

use Illuminate\Console\Scheduling\Event;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Contracts\Console\Kernel as ConsoleKernel;
use Illuminate\Support\Collection;

function scheduledBackupEvents(): Collection
{
    app(ConsoleKernel::class)->bootstrap();

    return collect(app(Schedule::class)->events())
        ->filter(fn (Event $event): bool => str_contains((string) $event->command, 'backup:'))
        ->values();
}

function scheduledBackupEvent(string $commandFragment): Event
{
    $event = scheduledBackupEvents()
        ->first(fn (Event $event): bool => str_contains((string) $event->command, $commandFragment));

    expect($event)->not->toBeNull("Missing scheduled backup command containing [{$commandFragment}].");

    return $event;
}

it('schedules database backups, cleanup, and backup health monitoring', function () {
    $cleanup = scheduledBackupEvent('backup:clean');
    $backup = scheduledBackupEvent('backup:run');
    $monitor = scheduledBackupEvent('backup:monitor');

    expect(scheduledBackupEvents())->toHaveCount(3)
        ->and($cleanup->expression)->toBe('0 1 * * *')
        ->and($cleanup->withoutOverlapping)->toBeTrue()
        ->and($backup->command)->toContain('backup:run')
        ->and($backup->command)->toContain('--only-db')
        ->and($backup->expression)->toBe('30 1 * * *')
        ->and($backup->withoutOverlapping)->toBeTrue()
        ->and($monitor->expression)->toBe('0 10 * * *')
        ->and($monitor->withoutOverlapping)->toBeTrue();
});

it('configures verified and monitored backup destinations', function () {
    $destinationDisks = config('backup.backup.destination.disks');

    expect(config('backup.backup.source.databases'))->toBe([config('database.default')])
        ->and($destinationDisks)->toBeArray()->not->toBeEmpty()
        ->and(config('backup.backup.verify_backup'))->toBeTrue()
        ->and(config('backup.backup.password'))->toBeNull()
        ->and(config('backup.notifications.mail.to'))->not->toBe('your@example.com')
        ->and(config('backup.monitor_backups.0.disks'))->toBe($destinationDisks);
});

it('configures mysql dumps to avoid table locks during backups', function () {
    expect(config('database.connections.mysql.dump.useSingleTransaction'))->toBeTrue()
        ->and(config('database.connections.mariadb.dump.useSingleTransaction'))->toBeTrue();
});
