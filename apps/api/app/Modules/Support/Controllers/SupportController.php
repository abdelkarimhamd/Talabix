<?php

namespace App\Modules\Support\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\SupportCase;
use App\Models\SupportNote;
use App\Modules\Notifications\Services\NotificationDeliveryService;
use App\Modules\Orders\Enums\OrderStatus;
use App\Modules\Orders\Enums\OrderTimelineEventType;
use App\Modules\Orders\Resources\OrderResource;
use App\Modules\Orders\Services\OrderLifecycleService;
use App\Modules\Shared\Actions\RecordAuditLogAction;
use App\Modules\Shared\Enums\AuditActionType;
use App\Modules\Support\Requests\CancelSupportOrderRequest;
use App\Modules\Support\Requests\StoreSupportCaseRequest;
use App\Modules\Support\Requests\StoreSupportNoteRequest;
use App\Modules\Support\Requests\UpdateSupportCaseRequest;
use App\Modules\Support\Resources\SupportCaseResource;
use App\Modules\Support\Resources\SupportNoteResource;
use App\Modules\Support\Services\SupportCaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupportController extends Controller
{
    public function __construct(
        private readonly OrderLifecycleService $orderLifecycleService,
        private readonly RecordAuditLogAction $recordAuditLogAction,
        private readonly NotificationDeliveryService $notificationDeliveryService,
        private readonly SupportCaseService $supportCaseService,
    ) {}

    public function searchOrders(Request $request): JsonResponse
    {
        $this->ensureAbility($request, 'ops:support.manage');

        $query = (string) $request->query('q', '');

        $orders = Order::query()
            ->with(['items', 'timeline', 'merchant', 'customerProfile.user', 'supportNotes.author', 'supportCase.openedBy', 'supportCase.resolvedBy'])
            ->when($query !== '', function ($builder) use ($query) {
                $builder
                    ->where('uuid', 'like', "%{$query}%")
                    ->orWhereHas('merchant', fn ($merchant) => $merchant->where('name', 'like', "%{$query}%"))
                    ->orWhereHas('customerProfile.user', fn ($user) => $user
                        ->where('email', 'like', "%{$query}%")
                        ->orWhere('name', 'like', "%{$query}%"))
                    ->orWhereHas('supportCase', fn ($supportCase) => $supportCase
                        ->where('summary', 'like', "%{$query}%"));
            })
            ->latest()
            ->get();

        return response()->json([
            'data' => OrderResource::collection($orders),
        ]);
    }

    public function storeCase(StoreSupportCaseRequest $request, Order $order): JsonResponse
    {
        $this->ensureAbility($request, 'ops:support.manage');
        $wasMissing = ! $order->supportCase()->exists();

        $supportCase = $this->supportCaseService->createOrUpdateForOrder(
            $order,
            $request->validated(),
            $request->user()
        );

        $this->recordAuditLogAction->execute(
            AuditActionType::SUPPORT_CASE_UPDATED,
            $request->user(),
            $order,
            'Support case created or updated.',
            [
                'support_case_uuid' => $supportCase->uuid,
                'status' => $supportCase->status->value,
                'issue_type' => $supportCase->issue_type->value,
            ]
        );

        return response()->json([
            'data' => new SupportCaseResource($supportCase),
        ], $wasMissing ? 201 : 200);
    }

    public function updateCase(UpdateSupportCaseRequest $request, SupportCase $supportCase): JsonResponse
    {
        $this->ensureAbility($request, 'ops:support.manage');

        $supportCase = $this->supportCaseService->update(
            $supportCase,
            $request->validated(),
            $request->user()
        );

        $this->recordAuditLogAction->execute(
            AuditActionType::SUPPORT_CASE_UPDATED,
            $request->user(),
            $supportCase->order,
            'Support case updated.',
            [
                'support_case_uuid' => $supportCase->uuid,
                'status' => $supportCase->status->value,
                'resolution_type' => $supportCase->resolution_type?->value,
            ]
        );

        return response()->json([
            'data' => new SupportCaseResource($supportCase),
        ]);
    }

    public function cancelOrder(CancelSupportOrderRequest $request, Order $order): JsonResponse
    {
        $this->ensureAbility($request, 'ops:support.manage');
        $this->authorize('dispatch', $order);

        $supportCase = $this->supportCaseService->resolveFromCancellation(
            $order,
            $request->validated(),
            $request->user()
        );

        $order = $this->orderLifecycleService->transition($order, OrderStatus::CANCELLED, $request->user(), [
            'reason' => 'support_cancelled',
            'reason_code' => $request->string('reason_code')->toString(),
            'reason_note' => $request->string('reason_note')->toString() ?: null,
            'support_case_uuid' => $supportCase->uuid,
        ]);

        $this->recordAuditLogAction->execute(
            AuditActionType::ORDER_CANCELLED,
            $request->user(),
            $order,
            'Order cancelled by support.',
            [
                'order_uuid' => $order->uuid,
                'support_case_uuid' => $supportCase->uuid,
                'reason_code' => $request->string('reason_code')->toString(),
            ]
        );

        return response()->json([
            'data' => new OrderResource($order->load([
                'items',
                'timeline',
                'merchant',
                'customerProfile.user',
                'supportNotes.author',
                'supportCase.openedBy',
                'supportCase.resolvedBy',
            ])),
        ]);
    }

    public function storeNote(StoreSupportNoteRequest $request, Order $order): JsonResponse
    {
        $this->ensureAbility($request, 'ops:support.manage');

        $attachmentPath = $request->file('attachment')?->store('support-notes');

        $note = SupportNote::query()->create([
            'order_id' => $order->id,
            'author_user_id' => $request->user()->id,
            'body' => $request->validated('body'),
            'attachment_disk' => $attachmentPath ? config('filesystems.default') : null,
            'attachment_path' => $attachmentPath,
        ]);

        $this->orderLifecycleService->recordTimelineEvent(
            $order,
            OrderTimelineEventType::SUPPORT_NOTE_ADDED,
            $request->user(),
            ['support_note_id' => $note->id]
        );

        $this->recordAuditLogAction->execute(
            AuditActionType::SUPPORT_NOTE_ADDED,
            $request->user(),
            $order,
            'Support note attached to order.',
            ['support_note_id' => $note->id]
        );

        $this->notificationDeliveryService->queueSupportNoteAdded($order, $note, $request->user()->id);

        return response()->json([
            'data' => new SupportNoteResource($note->load(['order', 'author'])),
        ], 201);
    }
}
