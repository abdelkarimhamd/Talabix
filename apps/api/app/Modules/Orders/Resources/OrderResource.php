<?php

namespace App\Modules\Orders\Resources;

use App\Models\DeliveryAssignment;
use App\Models\Order;
use App\Modules\Orders\Enums\OrderStatus;
use BackedEnum;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Order
 */
class OrderResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $items = $this->relationLoaded('items') ? $this->items : collect();
        $timeline = $this->relationLoaded('timeline') ? $this->timeline : collect();
        $assignments = $this->relationLoaded('assignments') ? $this->assignments : collect();
        $supportNotes = $this->relationLoaded('supportNotes') ? $this->supportNotes : collect();
        $supportCase = $this->relationLoaded('supportCase') ? $this->supportCase : null;
        $latestAssignment = $assignments->sortByDesc('id')->first();

        return [
            'uuid' => $this->uuid,
            'status' => $this->status->value,
            'payment_status' => $this->payment_status->value,
            'currency' => $this->currency,
            'subtotal_minor' => $this->subtotal_minor,
            'delivery_fee_minor' => $this->delivery_fee_minor,
            'platform_commission_minor' => $this->platform_commission_minor,
            'rider_earning_minor' => $this->rider_earning_minor,
            'total_minor' => $this->total_minor,
            'pricing_snapshot' => $this->pricing_snapshot,
            'applied_offer_ids' => $this->applied_offer_ids ?? [],
            'delivery_address_snapshot' => $this->delivery_address_snapshot,
            'notes' => $this->notes,
            'placed_at' => $this->placed_at,
            'accepted_at' => $this->accepted_at,
            'delivered_at' => $this->delivered_at,
            'customer_name' => $this->customerProfile?->user?->name,
            'merchant_name' => $this->merchant?->name,
            'branch_name' => $this->branch?->name,
            'item_count' => $items->sum('quantity'),
            'merchant_actions' => $this->merchantActions(),
            'delivery_assignment' => $latestAssignment ? [
                'rider_uuid' => $latestAssignment->riderProfile?->uuid,
                'rider_name' => $latestAssignment->riderProfile?->user?->name,
                'rider_availability' => $latestAssignment->riderProfile?->availability->value,
                'status' => $latestAssignment->status,
                'assignment_type' => $latestAssignment->assignment_type,
                'score' => $latestAssignment->score,
                'assigned_at' => $latestAssignment->assigned_at,
                'accepted_at' => $latestAssignment->accepted_at,
                'picked_up_at' => $latestAssignment->picked_up_at,
                'delivered_at' => $latestAssignment->delivered_at,
                'proof_captured_at' => $latestAssignment->proof_captured_at,
                'proof_metadata' => $latestAssignment->proof_metadata,
            ] : null,
            'rider_actions' => $this->riderActions($latestAssignment),
            'items' => $items->map(fn ($item) => [
                'catalog_item_id' => $item->catalog_item_id,
                'quantity' => $item->quantity,
                'unit_price_minor' => $item->unit_price_minor,
                'line_total_minor' => $item->line_total_minor,
                'item_snapshot' => $item->item_snapshot,
            ])->all(),
            'timeline' => $timeline->map(fn ($event) => [
                'event_type' => $event->event_type->value,
                'from_status' => $event->from_status->value,
                'to_status' => $event->to_status->value,
                'actor_role' => $event->actor_role,
                'metadata' => $event->metadata,
                'created_at' => $event->created_at,
            ])->all(),
            'support_notes' => $supportNotes->map(fn ($note) => [
                'id' => $note->id,
                'author_user_id' => $note->author_user_id,
                'author_name' => $note->author?->name,
                'body' => $note->body,
                'attachment_disk' => $note->attachment_disk,
                'attachment_path' => $note->attachment_path,
                'created_at' => $note->created_at,
            ])->all(),
            'support_case' => $supportCase ? [
                'uuid' => $supportCase->uuid,
                'status' => $this->enumValue($supportCase->status),
                'issue_type' => $this->enumValue($supportCase->issue_type),
                'summary' => $supportCase->summary,
                'cancellation_reason_code' => $this->enumValue($supportCase->cancellation_reason_code),
                'resolution_type' => $this->enumValue($supportCase->resolution_type),
                'resolution_notes' => $supportCase->resolution_notes,
                'opened_by_user_id' => $supportCase->opened_by_user_id,
                'opened_by_name' => $supportCase->openedBy?->name,
                'resolved_by_user_id' => $supportCase->resolved_by_user_id,
                'resolved_by_name' => $supportCase->resolvedBy?->name,
                'opened_at' => $supportCase->opened_at,
                'resolved_at' => $supportCase->resolved_at,
                'created_at' => $supportCase->created_at,
                'updated_at' => $supportCase->updated_at,
            ] : null,
        ];
    }

    /**
     * @return array<int, string>
     */
    private function merchantActions(): array
    {
        $status = $this->status;

        return match ($status) {
            OrderStatus::PLACED => ['accept', 'reject'],
            OrderStatus::ACCEPTED => ['start_preparing', 'reject'],
            OrderStatus::PREPARING => ['mark_ready', 'reject'],
            default => [],
        };
    }

    /**
     * @return array<int, string>
     */
    private function riderActions(?DeliveryAssignment $latestAssignment): array
    {
        $status = $this->status;

        if (! $latestAssignment) {
            return [];
        }

        return match ($status) {
            OrderStatus::ASSIGNED => $latestAssignment->accepted_at
                ? ['confirm_pickup']
                : ['accept_assignment'],
            OrderStatus::PICKED_UP => ['complete_delivery'],
            default => [],
        };
    }

    private function enumValue(mixed $value): ?string
    {
        if ($value instanceof BackedEnum) {
            return (string) $value->value;
        }

        return is_string($value) ? $value : null;
    }
}
