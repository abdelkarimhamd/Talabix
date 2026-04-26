<?php

use App\Modules\Dispatch\Services\DispatchSlaBreachMonitor;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('ops:dispatch-sla-alerts', function () {
    $monitor = app(DispatchSlaBreachMonitor::class);
    $snapshot = $monitor->snapshot();

    if ($monitor->shouldAlert($snapshot)) {
        Log::warning('Dispatch SLA breach window exceeded.', $snapshot);
    } else {
        Log::info('Dispatch SLA breach window healthy.', $snapshot);
    }

    $this->line(json_encode($snapshot, JSON_THROW_ON_ERROR));
})->purpose('Log dispatch and delivery exception SLA breach counts for ops monitoring');

Schedule::command('ops:dispatch-sla-alerts')->everyFiveMinutes()->withoutOverlapping();
Schedule::command('backup:clean')->daily()->at('01:00')->withoutOverlapping();
Schedule::command('backup:run --only-db')->daily()->at('01:30')->withoutOverlapping();
Schedule::command('backup:monitor')->daily()->at('10:00')->withoutOverlapping();
