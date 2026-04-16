<?php

namespace App\Modules\Settlements\Controllers;

use App\Http\Controllers\Controller;
use App\Models\LedgerEntry;
use App\Models\Order;
use App\Modules\Orders\Enums\OrderStatus;
use App\Modules\Shared\Actions\RecordAuditLogAction;
use App\Modules\Shared\Enums\AuditActionType;
use App\Modules\Settlements\Requests\SettlementLedgerIndexRequest;
use App\Modules\Settlements\Requests\StoreSettlementAdjustmentRequest;
use App\Modules\Settlements\Resources\LedgerEntryResource;
use App\Modules\Settlements\Services\SettlementService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SettlementController extends Controller
{
    public function __construct(
        private readonly SettlementService $settlementService,
        private readonly RecordAuditLogAction $recordAuditLogAction,
    ) {
    }

    public function index(SettlementLedgerIndexRequest $request): JsonResponse
    {
        $this->ensureAbility($request, 'ops:settlements.read');

        $entries = $this->filteredEntries($request)
            ->with(['order', 'merchant', 'riderProfile.user'])
            ->latest('occurred_at')
            ->get();

        return response()->json([
            'data' => LedgerEntryResource::collection($entries),
            'meta' => [
                'total_entries' => $entries->count(),
                'total_amount_minor' => $entries->sum('amount_minor'),
                'entry_type_totals' => $entries
                    ->groupBy(fn (LedgerEntry $entry) => $entry->entry_type?->value ?? $entry->entry_type)
                    ->map(fn ($group) => $group->sum('amount_minor'))
                    ->all(),
            ],
        ]);
    }

    public function export(SettlementLedgerIndexRequest $request): StreamedResponse
    {
        $this->ensureAbility($request, 'ops:settlements.read');

        $entries = $this->filteredEntries($request)
            ->with(['order', 'merchant', 'riderProfile.user'])
            ->latest('occurred_at')
            ->get();

        return response()->streamDownload(function () use ($entries) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'id',
                'order_uuid',
                'merchant_name',
                'rider_name',
                'entry_type',
                'amount_minor',
                'currency',
                'notes',
                'occurred_at',
            ]);

            foreach ($entries as $entry) {
                fputcsv($handle, [
                    $entry->id,
                    $entry->order?->uuid,
                    $entry->merchant?->name,
                    $entry->riderProfile?->user?->name,
                    $entry->entry_type->value,
                    $entry->amount_minor,
                    $entry->currency,
                    $entry->notes,
                    $entry->occurred_at,
                ]);
            }

            fclose($handle);
        }, 'ledger-export.csv');
    }

    public function storeAdjustment(StoreSettlementAdjustmentRequest $request, Order $order): JsonResponse
    {
        $this->ensureAbility($request, 'ops:settlements.manage');

        abort_unless($order->status === OrderStatus::DELIVERED, 422, 'Adjustments can only be created for delivered orders.');

        $entry = $this->settlementService->createAdjustment(
            $order,
            $request->integer('amount_minor'),
            $request->string('notes')->toString()
        );

        $this->recordAuditLogAction->execute(
            AuditActionType::SETTLEMENT_ADJUSTED,
            $request->user(),
            $order,
            'Settlement adjustment recorded by ops.',
            [
                'ledger_entry_id' => $entry->id,
                'amount_minor' => $entry->amount_minor,
            ]
        );

        return response()->json([
            'data' => new LedgerEntryResource($entry->load(['order', 'merchant', 'riderProfile.user'])),
        ], 201);
    }

    private function filteredEntries(SettlementLedgerIndexRequest $request)
    {
        return LedgerEntry::query()
            ->when(
                $request->filled('entry_type'),
                fn ($query) => $query->where('entry_type', $request->string('entry_type')->toString())
            )
            ->when(
                $request->filled('order_uuid'),
                fn ($query) => $query->whereHas(
                    'order',
                    fn ($orderQuery) => $orderQuery->where('uuid', $request->string('order_uuid')->toString())
                )
            )
            ->when(
                $request->string('direction')->toString() === 'positive',
                fn ($query) => $query->where('amount_minor', '>', 0)
            )
            ->when(
                $request->string('direction')->toString() === 'negative',
                fn ($query) => $query->where('amount_minor', '<', 0)
            );
    }
}
