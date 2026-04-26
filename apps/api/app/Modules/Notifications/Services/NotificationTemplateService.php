<?php

namespace App\Modules\Notifications\Services;

use App\Models\Order;
use App\Models\SupportNote;
use App\Modules\Notifications\Enums\NotificationChannel;
use App\Modules\Orders\Enums\OrderStatus;
use Illuminate\Support\Str;

/**
 * @phpstan-type NotificationPayload array<string, mixed>
 * @phpstan-type NotificationTemplate array{title: string, body: string, channels: list<NotificationChannel>, payload: NotificationPayload}
 */
class NotificationTemplateService
{
    /**
     * @param  array<string, mixed>  $metadata
     * @return NotificationTemplate
     */
    public function orderStatusMessage(Order $order, OrderStatus $status, string $actor, array $metadata = []): array
    {
        $orderCode = Str::upper(Str::substr($order->uuid, 0, 8));

        return match ($actor) {
            'customer' => $this->customerOrderStatusMessage($order, $status, $metadata, $orderCode),
            'merchant' => $this->merchantOrderStatusMessage($order, $status, $metadata, $orderCode),
            'rider' => $this->riderOrderStatusMessage($order, $status, $metadata, $orderCode),
            default => $this->genericOrderStatusMessage($order, $status, $metadata, $orderCode),
        };
    }

    /**
     * @return NotificationTemplate
     */
    public function supportNoteMessage(Order $order, SupportNote $note, string $actor): array
    {
        $orderCode = Str::upper(Str::substr($order->uuid, 0, 8));
        $author = data_get($note->author, 'name', __('messages.notifications.support_author'));
        $snippet = Str::limit($note->body, 96);

        return match ($actor) {
            'customer' => [
                'title' => __('messages.notifications.customer.support_note.title'),
                'body' => __('messages.notifications.customer.support_note.body', [
                    'author' => $author,
                    'order' => $orderCode,
                    'snippet' => $snippet,
                ]),
                'channels' => [NotificationChannel::IN_APP, NotificationChannel::PUSH, NotificationChannel::EMAIL],
                'payload' => $this->basePayload($order, [
                    'support_note_id' => $note->id,
                    'action_label' => $this->actionLabel('open_order_tracking'),
                    'action_route' => sprintf('/orders/%s', $order->uuid),
                ]),
            ],
            'merchant' => [
                'title' => __('messages.notifications.merchant.support_note.title'),
                'body' => __('messages.notifications.merchant.support_note.body', [
                    'order' => $orderCode,
                    'customer' => data_get($order, 'customerProfile.user.name', __('messages.notifications.fallbacks.customer')),
                    'snippet' => $snippet,
                ]),
                'channels' => [NotificationChannel::IN_APP, NotificationChannel::EMAIL],
                'payload' => $this->basePayload($order, [
                    'support_note_id' => $note->id,
                    'action_label' => $this->actionLabel('open_merchant_board'),
                    'action_route' => '/merchant/orders',
                ]),
            ],
            'rider' => [
                'title' => __('messages.notifications.rider.support_note.title'),
                'body' => __('messages.notifications.rider.support_note.body', [
                    'order' => $orderCode,
                    'snippet' => $snippet,
                ]),
                'channels' => [NotificationChannel::IN_APP, NotificationChannel::PUSH],
                'payload' => $this->basePayload($order, [
                    'support_note_id' => $note->id,
                    'action_label' => $this->actionLabel('open_delivery'),
                    'action_route' => '/delivery',
                ]),
            ],
            default => [
                'title' => __('messages.notifications.generic.support_title'),
                'body' => __('messages.notifications.generic.support_body', ['order' => $orderCode]),
                'channels' => [NotificationChannel::IN_APP],
                'payload' => $this->basePayload($order, [
                    'support_note_id' => $note->id,
                ]),
            ],
        };
    }

    /**
     * @param  array<string, mixed>  $metadata
     * @return NotificationTemplate
     */
    private function customerOrderStatusMessage(Order $order, OrderStatus $status, array $metadata, string $orderCode): array
    {
        $channels = [NotificationChannel::IN_APP, NotificationChannel::PUSH, NotificationChannel::EMAIL];

        if (in_array($status, [
            OrderStatus::ACCEPTED,
            OrderStatus::ASSIGNED,
            OrderStatus::DELIVERED,
            OrderStatus::CANCELLED,
        ], true)) {
            $channels[] = NotificationChannel::SMS;
        }

        [$title, $body] = match ($status) {
            OrderStatus::ACCEPTED => $this->titleBody('customer.accepted', [
                'merchant' => data_get($order->merchant, 'name', __('messages.notifications.fallbacks.merchant')),
                'order' => $orderCode,
            ]),
            OrderStatus::PREPARING => $this->titleBody('customer.preparing', [
                'merchant' => data_get($order->merchant, 'name', __('messages.notifications.fallbacks.merchant')),
                'order' => $orderCode,
            ]),
            OrderStatus::READY_FOR_PICKUP => $this->titleBody('customer.ready_for_pickup', [
                'order' => $orderCode,
                'branch' => data_get($order->branch, 'name', __('messages.notifications.fallbacks.branch')),
            ]),
            OrderStatus::ASSIGNED => $this->titleBody('customer.assigned', [
                'rider' => data_get($order, 'riderProfile.user.name', __('messages.notifications.fallbacks.rider')),
                'branch' => data_get($order->branch, 'name', __('messages.notifications.fallbacks.branch')),
                'order' => $orderCode,
            ]),
            OrderStatus::PICKED_UP => $this->titleBody('customer.picked_up', [
                'rider' => data_get($order, 'riderProfile.user.name', __('messages.notifications.fallbacks.customer_rider')),
                'order' => $orderCode,
            ]),
            OrderStatus::DELIVERED => $this->titleBody('customer.delivered', [
                'order' => $orderCode,
            ]),
            OrderStatus::CANCELLED => $this->titleBody('customer.cancelled', [
                'order' => $orderCode,
            ]),
            default => $this->genericTitleBody($orderCode, $status),
        };

        return [
            'title' => $title,
            'body' => $body,
            'channels' => $channels,
            'payload' => $this->basePayload($order, [
                'status' => $status->value,
                'metadata' => $metadata,
                'action_label' => $this->actionLabel('open_order_tracking'),
                'action_route' => sprintf('/orders/%s', $order->uuid),
            ]),
        ];
    }

    /**
     * @param  array<string, mixed>  $metadata
     * @return NotificationTemplate
     */
    private function merchantOrderStatusMessage(Order $order, OrderStatus $status, array $metadata, string $orderCode): array
    {
        [$title, $body] = match ($status) {
            OrderStatus::ACCEPTED => $this->titleBody('merchant.accepted', [
                'order' => $orderCode,
                'branch' => data_get($order->branch, 'name', __('messages.notifications.fallbacks.merchant_branch')),
            ]),
            OrderStatus::ASSIGNED => $this->titleBody('merchant.assigned', [
                'rider' => data_get($order, 'riderProfile.user.name', __('messages.notifications.fallbacks.rider')),
                'order' => $orderCode,
                'branch' => data_get($order->branch, 'name', __('messages.notifications.fallbacks.merchant_branch')),
            ]),
            OrderStatus::PICKED_UP => $this->titleBody('merchant.picked_up', [
                'rider' => data_get($order, 'riderProfile.user.name', __('messages.notifications.fallbacks.merchant_rider')),
                'order' => $orderCode,
            ]),
            OrderStatus::DELIVERED => $this->titleBody('merchant.delivered', [
                'order' => $orderCode,
                'customer' => data_get($order, 'customerProfile.user.name', __('messages.notifications.fallbacks.customer')),
            ]),
            OrderStatus::CANCELLED => $this->titleBody('merchant.cancelled', [
                'order' => $orderCode,
            ]),
            default => $this->genericTitleBody($orderCode, $status),
        };

        return [
            'title' => $title,
            'body' => $body,
            'channels' => [NotificationChannel::IN_APP, NotificationChannel::EMAIL],
            'payload' => $this->basePayload($order, [
                'status' => $status->value,
                'metadata' => $metadata,
                'action_label' => $this->actionLabel('open_merchant_board'),
                'action_route' => '/merchant/orders',
            ]),
        ];
    }

    /**
     * @param  array<string, mixed>  $metadata
     * @return NotificationTemplate
     */
    private function riderOrderStatusMessage(Order $order, OrderStatus $status, array $metadata, string $orderCode): array
    {
        [$title, $body] = match ($status) {
            OrderStatus::ASSIGNED => $this->titleBody('rider.assigned', [
                'branch' => data_get($order->branch, 'name', __('messages.notifications.fallbacks.branch')),
                'order' => $orderCode,
            ]),
            OrderStatus::CANCELLED => $this->titleBody('rider.cancelled', [
                'order' => $orderCode,
            ]),
            default => $this->genericTitleBody($orderCode, $status),
        };

        return [
            'title' => $title,
            'body' => $body,
            'channels' => [NotificationChannel::IN_APP, NotificationChannel::PUSH],
            'payload' => $this->basePayload($order, [
                'status' => $status->value,
                'metadata' => $metadata,
                'action_label' => $this->actionLabel('open_delivery'),
                'action_route' => '/delivery',
            ]),
        ];
    }

    /**
     * @param  array<string, mixed>  $metadata
     * @return NotificationTemplate
     */
    private function genericOrderStatusMessage(Order $order, OrderStatus $status, array $metadata, string $orderCode): array
    {
        [$title, $body] = $this->genericTitleBody($orderCode, $status);

        return [
            'title' => $title,
            'body' => $body,
            'channels' => [NotificationChannel::IN_APP],
            'payload' => $this->basePayload($order, [
                'status' => $status->value,
                'metadata' => $metadata,
            ]),
        ];
    }

    /**
     * @param  array<string, mixed>  $replace
     * @return array{0: string, 1: string}
     */
    private function titleBody(string $key, array $replace = []): array
    {
        return [
            __("messages.notifications.{$key}.title", $replace),
            __("messages.notifications.{$key}.body", $replace),
        ];
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function genericTitleBody(string $orderCode, OrderStatus $status): array
    {
        $statusLabel = str_replace('_', ' ', $status->value);

        return [
            __('messages.notifications.generic.title', ['order' => $orderCode]),
            __('messages.notifications.generic.body', [
                'order' => $orderCode,
                'status' => $statusLabel,
            ]),
        ];
    }

    private function actionLabel(string $action): string
    {
        return __("messages.notifications.actions.{$action}");
    }

    /**
     * @param  NotificationPayload  $extra
     * @return NotificationPayload
     */
    private function basePayload(Order $order, array $extra = []): array
    {
        return array_merge([
            'order_uuid' => $order->uuid,
            'branch_name' => data_get($order->branch, 'name'),
            'merchant_name' => data_get($order->merchant, 'name'),
            'locale' => app()->getLocale(),
        ], $extra);
    }
}
