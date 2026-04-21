<?php

namespace App\Modules\Dispatch\Controllers;

use App\Http\Controllers\Controller;
use App\Models\DeliveryAssignment;
use App\Models\Order;
use App\Models\RiderProfile;
use App\Modules\Dispatch\Enums\RiderAvailability;
use App\Modules\Dispatch\Events\OpsDispatchBoardUpdated;
use App\Modules\Dispatch\Requests\ReassignOrderRequest;
use App\Modules\Dispatch\Services\DispatchRouteProjectionService;
use App\Modules\Dispatch\Services\DispatchScoringService;
use App\Modules\Orders\Enums\OrderStatus;
use App\Modules\Orders\Enums\OrderTimelineEventType;
use App\Modules\Orders\Resources\OrderResource;
use App\Modules\Orders\Services\OrderLifecycleService;
use App\Modules\Shared\Actions\RecordAuditLogAction;
use App\Modules\Shared\Enums\AuditActionType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class DispatchController extends Controller
{
    public function __construct(
        private readonly OrderLifecycleService $orderLifecycleService,
        private readonly RecordAuditLogAction $recordAuditLogAction,
        private readonly DispatchRouteProjectionService $dispatchRouteProjectionService,
        private readonly DispatchScoringService $dispatchScoringService,
    ) {}

    public function board(Request $request): JsonResponse
    {
        $this->ensureAbility($request, 'ops:dispatch.manage');

        $orders = Order::query()
            ->with([
                'items',
                'timeline',
                'merchant',
                'branch.serviceZones',
                'branch.feeBands',
                'customerAddress',
                'customerProfile.user',
                'riderProfile.user',
                'assignments.riderProfile.user',
                'assignments.riderProfile.locations',
            ])
            ->whereIn('status', [OrderStatus::ACCEPTED, OrderStatus::ASSIGNED, OrderStatus::PICKED_UP])
            ->latest()
            ->get();

        $data = $orders->map(function (Order $order) use ($request) {
            $payload = (new OrderResource($order))->toArray($request);
            $activeAssignment = $order->assignments
                ->whereNotIn('status', ['reassigned', 'cancelled', 'completed'])
                ->sortByDesc('id')
                ->first();

            if ($activeAssignment) {
                $activeAssignment->setRelation('order', $order);
                $payload['dispatch'] = $this->dispatchRouteProjectionService->projectAssignment($activeAssignment);
            } else {
                $payload['dispatch'] = null;
            }

            return $payload;
        })->values();

        return response()->json([
            'data' => $data,
            'meta' => [
                'total_active_orders' => $orders->count(),
                'realtime' => [
                    'channel' => 'ops.dispatch',
                    'event' => 'ops.dispatch.updated',
                ],
            ],
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
        $activeStatus = $order->status;

        if (in_array($activeStatus, [OrderStatus::DELIVERED, OrderStatus::CANCELLED], true)) {
            throw ValidationException::withMessages([
                'order' => __('messages.dispatch.reassignment.terminal_order'),
            ]);
        }

        $rider = RiderProfile::query()->where('uuid', $validated['rider_uuid'])->firstOrFail();
        $previousRiderUuid = $order->riderProfile?->uuid;
        $currentActiveAssignment = DeliveryAssignment::query()
            ->where('order_id', $order->id)
            ->whereNotIn('status', ['reassigned', 'cancelled', 'completed'])
            ->latest()
            ->first();

        if (
            $order->rider_profile_id === $rider->id
            || $currentActiveAssignment?->rider_profile_id === $rider->id
        ) {
            throw ValidationException::withMessages([
                'rider_uuid' => __('messages.dispatch.reassignment.same_rider'),
            ]);
        }

        if ($rider->availability !== RiderAvailability::AVAILABLE) {
            throw ValidationException::withMessages([
                'rider_uuid' => __('messages.dispatch.reassignment.unavailable_rider'),
            ]);
        }

        $score = $this->dispatchScoringService->score($order, $rider);

        if ($score === null) {
            throw ValidationException::withMessages([
                'rider_uuid' => __('messages.dispatch.reassignment.ineligible_rider'),
            ]);
        }

        DeliveryAssignment::query()
            ->where('order_id', $order->id)
            ->whereNotIn('status', ['reassigned', 'cancelled', 'completed'])
            ->update(['status' => 'reassigned']);

        $assignment = DeliveryAssignment::query()->create([
            'order_id' => $order->id,
            'rider_profile_id' => $rider->id,
            'assigned_by_user_id' => $request->user()->id,
            'assignment_type' => 'manual',
            'status' => 'active',
            'score' => $score,
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
