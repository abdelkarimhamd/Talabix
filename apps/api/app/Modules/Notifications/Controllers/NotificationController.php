<?php

namespace App\Modules\Notifications\Controllers;

use App\Http\Controllers\Controller;
use App\Models\NotificationDelivery;
use App\Modules\Notifications\Enums\NotificationChannel;
use App\Modules\Notifications\Requests\NotificationInboxRequest;
use App\Modules\Notifications\Requests\NotificationIndexRequest;
use App\Modules\Notifications\Resources\NotificationDeliveryResource;
use App\Modules\Notifications\Services\NotificationDeliveryService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(
        private readonly NotificationDeliveryService $notificationDeliveryService,
    ) {}

    public function index(NotificationIndexRequest $request): JsonResponse
    {
        $this->ensureAbility($request, 'ops:support.manage');

        $deliveries = NotificationDelivery::query()
            ->with(['order', 'recipientUser'])
            ->when(
                $request->filled('order_uuid'),
                fn ($query) => $query->whereHas(
                    'order',
                    fn ($orderQuery) => $orderQuery->where('uuid', $request->string('order_uuid')->toString())
                )
            )
            ->when(
                $request->filled('recipient_actor'),
                fn ($query) => $query->where('recipient_actor', $request->string('recipient_actor')->toString())
            )
            ->when(
                $request->filled('channel'),
                fn ($query) => $query->where('channel', $request->string('channel')->toString())
            )
            ->when(
                $request->filled('provider'),
                fn ($query) => $query->where('provider', $request->string('provider')->toString())
            )
            ->when(
                $request->filled('status'),
                fn ($query) => $query->where('status', $request->string('status')->toString())
            )
            ->when(
                $request->filled('notification_type'),
                fn ($query) => $query->where('notification_type', $request->string('notification_type')->toString())
            )
            ->latest('queued_at')
            ->get();

        return response()->json([
            'data' => NotificationDeliveryResource::collection($deliveries),
            'meta' => [
                'total' => $deliveries->count(),
            ],
        ]);
    }

    public function retry(Request $request, NotificationDelivery $notificationDelivery): JsonResponse
    {
        $this->ensureAbility($request, 'ops:support.manage');

        $delivery = $this->notificationDeliveryService->retryDelivery($notificationDelivery);

        return response()->json([
            'data' => new NotificationDeliveryResource($delivery->load(['order', 'recipientUser'])),
        ], 202);
    }

    public function customerInbox(NotificationInboxRequest $request): JsonResponse
    {
        return $this->actorInbox($request, 'customer', 'customer:notifications.read');
    }

    public function customerMarkRead(Request $request, NotificationDelivery $notificationDelivery): JsonResponse
    {
        return $this->actorMarkRead($request, $notificationDelivery, 'customer', 'customer:notifications.update');
    }

    public function merchantInbox(NotificationInboxRequest $request): JsonResponse
    {
        return $this->actorInbox($request, 'merchant', 'merchant:notifications.read');
    }

    public function merchantMarkRead(Request $request, NotificationDelivery $notificationDelivery): JsonResponse
    {
        return $this->actorMarkRead($request, $notificationDelivery, 'merchant', 'merchant:notifications.update');
    }

    public function riderInbox(NotificationInboxRequest $request): JsonResponse
    {
        return $this->actorInbox($request, 'rider', 'rider:notifications.read');
    }

    public function riderMarkRead(Request $request, NotificationDelivery $notificationDelivery): JsonResponse
    {
        return $this->actorMarkRead($request, $notificationDelivery, 'rider', 'rider:notifications.update');
    }

    private function actorInbox(NotificationInboxRequest $request, string $actor, string $ability): JsonResponse
    {
        $this->ensureAbility($request, $ability);

        $baseQuery = $this->actorInboxQuery(
            $request,
            $actor,
            $request->user()->id
        );

        $deliveries = (clone $baseQuery)
            ->when($request->boolean('unread_only'), fn (Builder $query) => $query->whereNull('read_at'))
            ->latest('created_at')
            ->get();

        return response()->json([
            'data' => NotificationDeliveryResource::collection($deliveries),
            'meta' => [
                'total' => $deliveries->count(),
                'unread_count' => (clone $baseQuery)->whereNull('read_at')->count(),
            ],
        ]);
    }

    private function actorMarkRead(
        Request $request,
        NotificationDelivery $notificationDelivery,
        string $actor,
        string $ability
    ): JsonResponse {
        $this->ensureAbility($request, $ability);

        $delivery = $this->actorInboxQuery($request, $actor, $request->user()->id)
            ->whereKey($notificationDelivery->id)
            ->firstOrFail();

        if (! $delivery->read_at) {
            $delivery->forceFill([
                'read_at' => now(),
            ])->save();
        }

        return response()->json([
            'data' => new NotificationDeliveryResource($delivery->fresh()->load(['order', 'recipientUser'])),
        ]);
    }

    /**
     * @return Builder<NotificationDelivery>
     */
    private function actorInboxQuery(Request $request, string $actor, int $userId): Builder
    {
        return NotificationDelivery::query()
            ->with(['order', 'recipientUser'])
            ->where('recipient_user_id', $userId)
            ->where('recipient_actor', $actor)
            ->where('channel', NotificationChannel::IN_APP->value)
            ->when(
                $request->filled('order_uuid'),
                fn (Builder $query) => $query->whereHas(
                    'order',
                    fn (Builder $orderQuery) => $orderQuery->where('uuid', $request->string('order_uuid')->toString())
                )
            );
    }
}
