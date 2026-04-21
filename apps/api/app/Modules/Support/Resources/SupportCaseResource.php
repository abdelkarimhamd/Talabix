<?php

namespace App\Modules\Support\Resources;

use App\Models\SupportCase;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin SupportCase
 */
class SupportCaseResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'order_id' => $this->order_id,
            'order_uuid' => $this->order?->uuid,
            'status' => $this->status->value,
            'issue_type' => $this->issue_type->value,
            'summary' => $this->summary,
            'cancellation_reason_code' => $this->cancellation_reason_code?->value,
            'resolution_type' => $this->resolution_type?->value,
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
