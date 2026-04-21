<?php

namespace App\Modules\Orders\Support;

use Carbon\CarbonInterface;

class DeliveryExceptionSla
{
    /**
     * @return array<string, mixed>
     */
    public static function snapshot(?CarbonInterface $reportedAt): array
    {
        $targetMinutes = max(1, (int) config('services.dispatch.delivery_exception_response_sla_minutes', 10));
        $warningMinutes = max(1, (int) config('services.dispatch.delivery_exception_response_warning_minutes', 3));
        $elapsedMinutes = self::minutesSince($reportedAt);
        $minutesRemaining = $targetMinutes - $elapsedMinutes;

        if ($minutesRemaining < 0) {
            $level = 'breached';
            $label = __('messages.dispatch.exception_sla.breached');
            $escalationAction = 'support_reassignment_required';
        } elseif ($minutesRemaining <= $warningMinutes) {
            $level = 'warning';
            $label = __('messages.dispatch.exception_sla.warning');
            $escalationAction = 'support_follow_up_due';
        } else {
            $level = 'on_track';
            $label = __('messages.dispatch.exception_sla.on_track');
            $escalationAction = 'support_monitoring';
        }

        return [
            'level' => $level,
            'label' => $label,
            'target_minutes' => $targetMinutes,
            'elapsed_minutes' => $elapsedMinutes,
            'minutes_remaining' => $minutesRemaining,
            'escalation_action' => $escalationAction,
        ];
    }

    private static function minutesSince(?CarbonInterface $timestamp): int
    {
        if (! $timestamp) {
            return 0;
        }

        return max(0, (int) floor($timestamp->diffInMinutes(now(), true)));
    }
}
