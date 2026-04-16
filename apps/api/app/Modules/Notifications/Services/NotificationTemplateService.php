<?php

namespace App\Modules\Notifications\Services;

use App\Models\Order;
use App\Models\SupportNote;
use App\Modules\Notifications\Enums\NotificationChannel;
use App\Modules\Orders\Enums\OrderStatus;
use Illuminate\Support\Str;

class NotificationTemplateService
{
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

    public function supportNoteMessage(Order $order, SupportNote $note, string $actor): array
    {
        $orderCode = Str::upper(Str::substr($order->uuid, 0, 8));
        $author = $note->author?->name ?? 'Talabix support';
        $snippet = Str::limit($note->body, 96);

        return match ($actor) {
            'customer' => [
                'title' => 'Support updated your order',
                'body' => sprintf('%s added a note to order %s: %s', $author, $orderCode, $snippet),
                'channels' => [NotificationChannel::IN_APP, NotificationChannel::PUSH, NotificationChannel::EMAIL],
                'payload' => $this->basePayload($order, [
                    'support_note_id' => $note->id,
                    'action_label' => 'Open order tracking',
                    'action_route' => sprintf('/orders/%s', $order->uuid),
                ]),
            ],
            'merchant' => [
                'title' => 'Support updated an active order',
                'body' => sprintf('Support added a note to order %s for %s: %s', $orderCode, $order->customerProfile?->user?->name ?? 'the customer', $snippet),
                'channels' => [NotificationChannel::IN_APP, NotificationChannel::EMAIL],
                'payload' => $this->basePayload($order, [
                    'support_note_id' => $note->id,
                    'action_label' => 'Open merchant board',
                    'action_route' => '/merchant/orders',
                ]),
            ],
            'rider' => [
                'title' => 'Support updated the drop-off',
                'body' => sprintf('Support added handoff instructions for order %s: %s', $orderCode, $snippet),
                'channels' => [NotificationChannel::IN_APP, NotificationChannel::PUSH],
                'payload' => $this->basePayload($order, [
                    'support_note_id' => $note->id,
                    'action_label' => 'Open delivery',
                    'action_route' => '/delivery',
                ]),
            ],
            default => [
                'title' => 'Support updated your order',
                'body' => sprintf('Support added a note for order %s.', $orderCode),
                'channels' => [NotificationChannel::IN_APP],
                'payload' => $this->basePayload($order, [
                    'support_note_id' => $note->id,
                ]),
            ],
        };
    }

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
            OrderStatus::ACCEPTED => [
                'Your order was accepted',
                sprintf('%s accepted order %s and started fulfillment.', $order->merchant?->name ?? 'The merchant', $orderCode),
            ],
            OrderStatus::PREPARING => [
                'Your order is being prepared',
                sprintf('%s is preparing order %s.', $order->merchant?->name ?? 'The merchant', $orderCode),
            ],
            OrderStatus::READY_FOR_PICKUP => [
                'Your order is almost ready',
                sprintf('Order %s is staged for rider pickup from %s.', $orderCode, $order->branch?->name ?? 'the branch'),
            ],
            OrderStatus::ASSIGNED => [
                'Rider assigned',
                sprintf('%s is heading to %s for order %s.', $order->riderProfile?->user?->name ?? 'A rider', $order->branch?->name ?? 'the branch', $orderCode),
            ],
            OrderStatus::PICKED_UP => [
                'Order picked up',
                sprintf('%s picked up order %s and is heading to you.', $order->riderProfile?->user?->name ?? 'Your rider', $orderCode),
            ],
            OrderStatus::DELIVERED => [
                'Order delivered',
                sprintf('Order %s was marked delivered. Contact support if anything is wrong.', $orderCode),
            ],
            OrderStatus::CANCELLED => [
                'Order cancelled',
                sprintf('Order %s was cancelled. Support can help if you need a replacement order.', $orderCode),
            ],
            default => $this->genericTitleBody($orderCode, $status),
        };

        return [
            'title' => $title,
            'body' => $body,
            'channels' => $channels,
            'payload' => $this->basePayload($order, [
                'status' => $status->value,
                'metadata' => $metadata,
                'action_label' => 'Open order tracking',
                'action_route' => sprintf('/orders/%s', $order->uuid),
            ]),
        ];
    }

    private function merchantOrderStatusMessage(Order $order, OrderStatus $status, array $metadata, string $orderCode): array
    {
        [$title, $body] = match ($status) {
            OrderStatus::ACCEPTED => [
                'Order accepted',
                sprintf('Order %s is accepted and committed for preparation at %s.', $orderCode, $order->branch?->name ?? 'your branch'),
            ],
            OrderStatus::ASSIGNED => [
                'Rider assigned',
                sprintf('%s is assigned to order %s from %s.', $order->riderProfile?->user?->name ?? 'A rider', $orderCode, $order->branch?->name ?? 'your branch'),
            ],
            OrderStatus::PICKED_UP => [
                'Order picked up',
                sprintf('%s confirmed pickup for order %s.', $order->riderProfile?->user?->name ?? 'The rider', $orderCode),
            ],
            OrderStatus::DELIVERED => [
                'Order delivered',
                sprintf('Order %s was delivered to %s.', $orderCode, $order->customerProfile?->user?->name ?? 'the customer'),
            ],
            OrderStatus::CANCELLED => [
                'Order cancelled',
                sprintf('Order %s was cancelled after merchant acceptance.', $orderCode),
            ],
            default => $this->genericTitleBody($orderCode, $status),
        };

        return [
            'title' => $title,
            'body' => $body,
            'channels' => [NotificationChannel::IN_APP, NotificationChannel::EMAIL],
            'payload' => $this->basePayload($order, [
                'status' => $status->value,
                'metadata' => $metadata,
                'action_label' => 'Open merchant board',
                'action_route' => '/merchant/orders',
            ]),
        ];
    }

    private function riderOrderStatusMessage(Order $order, OrderStatus $status, array $metadata, string $orderCode): array
    {
        [$title, $body] = match ($status) {
            OrderStatus::ASSIGNED => [
                'New assignment ready',
                sprintf('Head to %s for order %s and confirm acceptance when you are ready.', $order->branch?->name ?? 'the branch', $orderCode),
            ],
            OrderStatus::CANCELLED => [
                'Assignment cancelled',
                sprintf('Order %s is no longer active. Return to the assignment queue.', $orderCode),
            ],
            default => $this->genericTitleBody($orderCode, $status),
        };

        return [
            'title' => $title,
            'body' => $body,
            'channels' => [NotificationChannel::IN_APP, NotificationChannel::PUSH],
            'payload' => $this->basePayload($order, [
                'status' => $status->value,
                'metadata' => $metadata,
                'action_label' => 'Open delivery',
                'action_route' => '/delivery',
            ]),
        ];
    }

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

    private function genericTitleBody(string $orderCode, OrderStatus $status): array
    {
        return [
            sprintf('Order %s updated', $orderCode),
            sprintf('Order %s is now %s.', $orderCode, str_replace('_', ' ', $status->value)),
        ];
    }

    private function basePayload(Order $order, array $extra = []): array
    {
        return array_merge([
            'order_uuid' => $order->uuid,
            'branch_name' => $order->branch?->name,
            'merchant_name' => $order->merchant?->name,
        ], $extra);
    }
}
