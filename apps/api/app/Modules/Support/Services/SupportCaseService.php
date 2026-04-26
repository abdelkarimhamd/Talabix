<?php

namespace App\Modules\Support\Services;

use App\Models\Order;
use App\Models\SupportCase;
use App\Models\User;
use App\Modules\Support\Enums\SupportCaseStatus;
use App\Modules\Support\Enums\SupportResolutionType;
use Illuminate\Support\Str;

class SupportCaseService
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function createOrUpdateForOrder(Order $order, array $payload, User $actor): SupportCase
    {
        $supportCase = $order->supportCase()->firstOrNew();

        if (! $supportCase->exists) {
            $supportCase->fill([
                'uuid' => (string) Str::uuid(),
                'order_id' => $order->id,
                'opened_by_user_id' => $actor->id,
                'opened_at' => now(),
            ]);
        }

        return $this->persist($supportCase, $payload, $actor);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function update(SupportCase $supportCase, array $payload, User $actor): SupportCase
    {
        return $this->persist($supportCase, $payload, $actor);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function resolveFromCancellation(Order $order, array $payload, User $actor): SupportCase
    {
        return $this->createOrUpdateForOrder($order, [
            'summary' => $payload['summary'],
            'issue_type' => $payload['issue_type'],
            'status' => SupportCaseStatus::RESOLVED->value,
            'cancellation_reason_code' => $payload['reason_code'],
            'resolution_type' => SupportResolutionType::CANCELLED_ORDER->value,
            'resolution_notes' => $payload['reason_note'] ?? null,
        ], $actor);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function persist(SupportCase $supportCase, array $payload, User $actor): SupportCase
    {
        $currentStatus = $supportCase->exists ? $supportCase->status->value : SupportCaseStatus::OPEN->value;
        $status = $payload['status'] ?? $currentStatus;

        $supportCase->fill([
            'summary' => $payload['summary'] ?? $supportCase->summary,
            'issue_type' => $payload['issue_type'] ?? $supportCase->issue_type->value,
            'status' => $status,
            'cancellation_reason_code' => $payload['cancellation_reason_code'] ?? $supportCase->cancellation_reason_code?->value,
            'resolution_type' => array_key_exists('resolution_type', $payload)
                ? $payload['resolution_type']
                : $supportCase->resolution_type?->value,
            'resolution_notes' => array_key_exists('resolution_notes', $payload)
                ? $payload['resolution_notes']
                : $supportCase->resolution_notes,
        ]);

        if ($status === SupportCaseStatus::RESOLVED->value) {
            $supportCase->resolved_by_user_id = $actor->id;
            $supportCase->resolved_at = $supportCase->resolved_at ?? now();
        } else {
            $supportCase->resolved_by_user_id = null;
            $supportCase->resolved_at = null;
        }

        $supportCase->save();

        return $supportCase->fresh(['order', 'openedBy', 'resolvedBy']);
    }
}
