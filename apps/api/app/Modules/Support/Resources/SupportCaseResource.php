<?php

namespace App\Modules\Support\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SupportCaseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'order_id' => $this->order_id,
            'order_uuid' => $this->order?->uuid,
            'status' => $this->status?->value ?? $this->status,
            'issue_type' => $this->issue_type?->value ?? $this->issue_type,
            'summary' => $this->summary,
            'cancellation_reason_code' => $this->cancellation_reason_code?->value ?? $this->cancellation_reason_code,
            'resolution_type' => $this->resolution_type?->value ?? $this->resolution_type,
            'resolution_notes' => $this->resolution_notes,
            'opened_by_user_id' => $this->opened_by_user_id,
            'opened_by_name' => $this->openedBy?->name,
            'resolved_by_user_id' => $this->resolved_by_user_id,
            'resolved_by_name' => $this->resolvedBy?->name,
            'opened_at' => $this->opened_at,
            'resolved_at' => $this->resolved_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
