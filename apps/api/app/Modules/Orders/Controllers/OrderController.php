<?php

namespace App\Modules\Orders\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\CatalogItem;
use App\Models\CustomerAddress;
use App\Models\DeliveryAssignment;
use App\Models\Order;
use App\Modules\Orders\Enums\OrderStatus;
use App\Modules\Orders\Enums\OrderTimelineEventType;
use App\Modules\Orders\Enums\PaymentStatus;
use App\Modules\Orders\Requests\CheckoutRequest;
use App\Modules\Orders\Requests\CompleteDeliveryRequest;
use App\Modules\Orders\Resources\OrderResource;
use App\Modules\Orders\Services\OrderLifecycleService;
use App\Modules\Orders\Services\OrderPricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function __construct(
        private readonly OrderPricingService $orderPricingService,
        private readonly OrderLifecycleService $orderLifecycleService,
    ) {}

    public function customerIndex(Request $request): JsonResponse
    {
        $this->ensureAbility($request, 'customer:orders.read');

        return response()->json([
            'data' => OrderResource::collection(
                Order::query()
                    ->with(['items', 'timeline', 'branch', 'customerProfile.user'])
                    ->where('customer_profile_id', $request->user()->customerProfile->id)
                    ->latest()
                    ->get()
            ),
        ]);
    }

    public function checkout(CheckoutRequest $request): JsonResponse
    {
        $this->ensureAbility($request, 'customer:orders.create');

        $profile = $request->user()->customerProfile;
        $address = CustomerAddress::query()->where('uuid', $request->string('address_uuid'))->firstOrFail();
        abort_unless($address->customer_profile_id === $profile->id, 403);

        $branch = Branch::query()->where('uuid', $request->string('branch_uuid'))->firstOrFail();
        $merchant = $branch->merchant()->first();

        $items = collect((array) $request->validated('items'))->values()->map(function (array $item) {
            return [
                'quantity' => (int) $item['quantity'],
                'modifier_option_uuids' => array_values(array_unique(array_map(
                    static fn (mixed $uuid): string => (string) $uuid,
                    (array) ($item['modifier_option_uuids'] ?? [])
                ))),
                'model' => CatalogItem::query()
                    ->with(['modifierGroups.options'])
                    ->where('uuid', $item['catalog_item_uuid'])
                    ->firstOrFail(),
            ];
        });

        $quote = $this->orderPricingService->quote(
            $branch,
            $address,
            $items,
            $request->validated('promo_code')
        );

        $order = DB::transaction(function () use ($request, $profile, $address, $merchant, $branch, $quote) {
            $order = Order::query()->create([
                'uuid' => (string) Str::uuid(),
                'customer_profile_id' => $profile->id,
                'customer_address_id' => $address->id,
                'merchant_id' => $merchant->id,
                'branch_id' => $branch->id,
                'status' => OrderStatus::PLACED,
                'payment_status' => PaymentStatus::PENDING_COD,
                'currency' => 'SAR',
                'subtotal_minor' => $quote['pricing']['subtotal_minor'],
                'delivery_fee_minor' => $quote['pricing']['delivery_fee_minor'],
                'platform_commission_minor' => $quote['pricing']['platform_commission_minor'],
                'rider_earning_minor' => $quote['pricing']['rider_earning_minor'],
                'total_minor' => $quote['pricing']['total_minor'],
                'pricing_snapshot' => $quote['pricing'],
                'applied_offer_ids' => $quote['pricing']['applied_offer_ids'],
                'delivery_address_snapshot' => [
                    'uuid' => $address->uuid,
                    'label' => $address->label,
                    'line_1' => $address->line_1,
                    'line_2' => $address->line_2,
                    'building' => $address->building,
                    'floor' => $address->floor,
                    'apartment' => $address->apartment,
                    'landmark' => $address->landmark,
                    'delivery_notes' => $address->delivery_notes,
                    'city' => $address->city,
                    'latitude' => $address->latitude,
                    'longitude' => $address->longitude,
                ],
                'notes' => $request->string('notes')->toString(),
                'placed_at' => now(),
            ]);

            $order->items()->createMany($quote['items']);
            $this->orderLifecycleService->recordTimelineEvent(
                $order,
                OrderTimelineEventType::ORDER_PLACED,
                $request->user(),
                ['source' => 'customer_checkout']
            );

            return $order->load(['items', 'timeline', 'branch', 'customerProfile.user', 'assignments']);
        });

        return response()->json([
            'data' => new OrderResource($order),
        ], 201);
    }

    public function show(Request $request, Order $order): JsonResponse
    {
        $this->authorize('view', $order);

        return response()->json([
            'data' => new OrderResource($order->load(['items', 'timeline', 'branch', 'customerProfile.user', 'assignments'])),
        ]);
    }

    public function merchantBoard(Request $request, Branch $branch): JsonResponse
    {
        $this->ensureAbility($request, 'merchant:orders.read');
        $this->authorize('view', $branch->merchant);

        return response()->json([
            'data' => OrderResource::collection(
                Order::query()
                    ->with(['items', 'timeline', 'branch', 'customerProfile.user', 'assignments'])
                    ->where('branch_id', $branch->id)
                    ->latest()
                    ->get()
            ),
        ]);
    }

    public function merchantAccept(Request $request, Order $order): JsonResponse
    {
        $this->ensureAbility($request, 'merchant:orders.update');
        $this->authorize('merchantUpdate', $order);

        $order = $this->orderLifecycleService->transition($order, OrderStatus::ACCEPTED, $request->user(), [
            'source' => 'merchant_board',
        ]);

        return response()->json([
            'data' => new OrderResource($order->load(['items', 'timeline', 'branch', 'customerProfile.user', 'assignments'])),
        ]);
    }

    public function merchantReject(Request $request, Order $order): JsonResponse
    {
        $this->ensureAbility($request, 'merchant:orders.update');
        $this->authorize('merchantUpdate', $order);

        $order = $this->orderLifecycleService->transition(
            order: $order,
            toStatus: OrderStatus::CANCELLED,
            actor: $request->user(),
            metadata: [
                'reason' => 'merchant_rejected',
                'source' => 'merchant_board',
            ],
            eventType: OrderTimelineEventType::MERCHANT_REJECTED,
        );

        return response()->json([
            'data' => new OrderResource($order->load(['items', 'timeline', 'branch', 'customerProfile.user', 'assignments'])),
        ]);
    }

    public function merchantStartPreparing(Request $request, Order $order): JsonResponse
    {
        $this->ensureAbility($request, 'merchant:orders.update');
        $this->authorize('merchantUpdate', $order);

        $order = $this->orderLifecycleService->transition($order, OrderStatus::PREPARING, $request->user(), [
            'fulfillment_stage' => 'preparing',
            'source' => 'merchant_board',
        ]);

        return response()->json([
            'data' => new OrderResource($order->load(['items', 'timeline', 'branch', 'customerProfile.user', 'assignments'])),
        ]);
    }

    public function merchantReadyForPickup(Request $request, Order $order): JsonResponse
    {
        $this->ensureAbility($request, 'merchant:orders.update');
        $this->authorize('merchantUpdate', $order);

        $order = $this->orderLifecycleService->transition($order, OrderStatus::READY_FOR_PICKUP, $request->user(), [
            'fulfillment_stage' => 'ready_for_pickup',
            'source' => 'merchant_board',
        ]);

        return response()->json([
            'data' => new OrderResource($order->load(['items', 'timeline', 'branch', 'customerProfile.user', 'assignments'])),
        ]);
    }

    public function riderAssignments(Request $request): JsonResponse
    {
        $this->ensureAbility($request, 'rider:assignments.read');

        $orders = Order::query()
            ->with(['items', 'timeline', 'branch', 'customerProfile.user', 'assignments'])
            ->where('rider_profile_id', $request->user()->riderProfile->id)
            ->whereIn('status', [OrderStatus::ASSIGNED, OrderStatus::PICKED_UP])
            ->latest()
            ->get();

        return response()->json([
            'data' => OrderResource::collection($orders),
        ]);
    }

    public function riderAcceptAssignment(Request $request, Order $order): JsonResponse
    {
        $this->ensureAbility($request, 'rider:assignments.update');
        $this->authorize('riderUpdate', $order);

        if ($order->status !== OrderStatus::ASSIGNED) {
            throw ValidationException::withMessages([
                'order' => 'Only assigned orders can be accepted by the rider.',
            ]);
        }

        $assignment = $this->activeAssignmentForRider($request, $order);

        if ($assignment->accepted_at) {
            throw ValidationException::withMessages([
                'assignment' => 'This assignment has already been accepted.',
            ]);
        }

        $assignment->update([
            'accepted_at' => now(),
        ]);

        return response()->json([
            'data' => new OrderResource($order->fresh()->load(['items', 'timeline', 'branch', 'customerProfile.user', 'assignments'])),
        ]);
    }

    public function riderPickup(Request $request, Order $order): JsonResponse
    {
        $this->ensureAbility($request, 'rider:delivery.update');
        $this->authorize('riderUpdate', $order);

        if ($order->status !== OrderStatus::ASSIGNED) {
            throw ValidationException::withMessages([
                'order' => 'Only assigned orders can be marked as picked up.',
            ]);
        }

        $assignment = $this->activeAssignmentForRider($request, $order);

        if (! $assignment->accepted_at) {
            throw ValidationException::withMessages([
                'assignment' => 'Accept the assignment before confirming pickup.',
            ]);
        }

        $assignment->update([
            'status' => 'picked_up',
            'picked_up_at' => now(),
        ]);

        $order = $this->orderLifecycleService->transition($order, OrderStatus::PICKED_UP, $request->user());

        return response()->json([
            'data' => new OrderResource($order->load(['items', 'timeline', 'branch', 'customerProfile.user', 'assignments'])),
        ]);
    }

    public function riderDeliver(CompleteDeliveryRequest $request, Order $order): JsonResponse
    {
        $this->ensureAbility($request, 'rider:delivery.update');
        $this->authorize('riderUpdate', $order);

        if ($order->status !== OrderStatus::PICKED_UP) {
            throw ValidationException::withMessages([
                'order' => 'Only picked up orders can be marked as delivered.',
            ]);
        }

        $assignment = $this->activeAssignmentForRider($request, $order);

        if (! $assignment->picked_up_at) {
            throw ValidationException::withMessages([
                'assignment' => 'Confirm pickup before completing delivery.',
            ]);
        }

        $assignment->update([
            'status' => 'completed',
            'delivered_at' => now(),
            'proof_captured_at' => now(),
            'proof_metadata' => [
                'proof_type' => $request->validated('proof_type'),
                'recipient_name' => $request->validated('recipient_name'),
                'proof_notes' => $request->validated('proof_notes'),
                'proof_reference' => $request->validated('proof_reference'),
            ],
        ]);

        $order = $this->orderLifecycleService->transition($order, OrderStatus::DELIVERED, $request->user(), [
            'proof_type' => $request->validated('proof_type'),
            'recipient_name' => $request->validated('recipient_name'),
        ]);

        return response()->json([
            'data' => new OrderResource($order->load(['items', 'timeline', 'branch', 'customerProfile.user', 'assignments'])),
        ]);
    }

    private function activeAssignmentForRider(Request $request, Order $order): DeliveryAssignment
    {
        $assignment = DeliveryAssignment::query()
            ->where('order_id', $order->id)
            ->where('rider_profile_id', $request->user()->riderProfile->id)
            ->whereNotIn('status', ['reassigned', 'cancelled'])
            ->latest()
            ->first();

        if (! $assignment) {
            throw ValidationException::withMessages([
                'assignment' => 'No active assignment was found for this rider.',
            ]);
        }

        return $assignment;
    }
}
