<?php

namespace App\Modules\Dispatch\Controllers;

use App\Http\Controllers\Controller;
use App\Models\DeliveryAssignment;
use App\Models\Order;
use App\Models\RiderProfile;
use App\Modules\Dispatch\Events\OpsDispatchBoardUpdated;
use App\Modules\Dispatch\Requests\ReassignOrderRequest;
use App\Modules\Dispatch\Services\DispatchRouteProjectionService;
use App\Modules\Orders\Enums\OrderStatus;
use App\Modules\Orders\Enums\OrderTimelineEventType;
use App\Modules\Orders\Resources\OrderResource;
use App\Modules\Orders\Services\OrderLifecycleService;
use App\Modules\Shared\Actions\RecordAuditLogAction;
use App\Modules\Shared\Enums\AuditActionType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DispatchController extends Controller
{
    public function __construct(
        private readonly OrderLifecycleService $orderLifecycleService,
        private readonly RecordAuditLogAction $recordAuditLogAction,
        private readonly DispatchRouteProjectionService $dispatchRouteProjectionService,
    ) {
    }

    public function board(Request $request): JsonResponse
    {
        $this->ensureAbility($request, 'ops:dispatch.manage');

        $orders = Order::query()
            ->with(['items', 'timeline'])
            ->whereIn('status', [OrderStatus::ACCEPTED, OrderStatus::ASSIGNED, OrderStatus::PICKED_UP])
            ->latest()
            ->get();

        return response()->json([
            'data' => OrderResource::collection($orders),
        ]);
    }

    public function assignments(Request $request): JsonResponse
    {
        $this->ensureAbility($request, 'ops:dispatch.manage');

        return response()->json([
            'data' => $this->dispatchRouteProjectionService->activeAssignments(),
        ]);
    }

    public function reassign(ReassignOrderRequest $request, Order $order): JsonResponse
    {
        $this->ensureAbility($request, 'ops:dispatch.manage');
        $this->authorize('dispatch', $order);

        $validated = $request->validated();
        $rider = RiderProfile::query()->where('uuid', $validated['rider_uuid'])->firstOrFail();
        $previousRiderUuid = $order->riderProfile?->uuid;

        DeliveryAssignment::query()
            ->where('order_id', $order->id)
            ->where('status', 'active')
            ->update(['status' => 'reassigned']);

        $assignment = DeliveryAssignment::query()->create([
            'order_id' => $order->id,
            'rider_profile_id' => $rider->id,
            'assigned_by_user_id' => $request->user()->id,
            'assignment_type' => 'manual',
            'status' => 'active',
            'assigned_at' => now(),
        ]);

        $order->forceFill(['rider_profile_id' => $rider->id])->save();

        if ($order->status !== OrderStatus::ASSIGNED) {
            $order = $this->orderLifecycleService->transition($order, OrderStatus::ASSIGNED, $request->user(), [
                'assignment_type' => 'manual',
                'assignment_id' => $assignment->id,
            ]);
        }

        $this->orderLifecycleService->recordTimelineEvent(
            $order,
            OrderTimelineEventType::RIDER_REASSIGNED,
            $request->user(),
            [
                'rider_uuid' => $rider->uuid,
                'previous_rider_uuid' => $previousRiderUuid,
                'assignment_id' => $assignment->id,
                'reason_code' => $validated['reason_code'],
                'reason_note' => $validated['reason_note'] ?? null,
            ]
        );

        $this->recordAuditLogAction->execute(
            AuditActionType::RIDER_REASSIGNED,
            $request->user(),
            $order,
            'Order rider reassigned by ops.',
            [
                'rider_uuid' => $rider->uuid,
                'previous_rider_uuid' => $previousRiderUuid,
                'reason_code' => $validated['reason_code'],
            ]
        );

        event(new OpsDispatchBoardUpdated(
            order: $order->fresh(),
            reason: 'rider_reassigned',
            payload: [
                'rider_uuid' => $rider->uuid,
                'previous_rider_uuid' => $previousRiderUuid,
                'assignment_id' => $assignment->id,
                'reason_code' => $validated['reason_code'],
            ],
        ));

        return response()->json([
            'data' => new OrderResource($order->load(['items', 'timeline'])),
        ]);
    }
}
