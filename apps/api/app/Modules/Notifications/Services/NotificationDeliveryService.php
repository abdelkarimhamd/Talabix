<?php

namespace App\Modules\Notifications\Services;

use App\Models\NotificationDelivery;
use App\Models\Order;
use App\Models\SupportNote;
use App\Modules\Notifications\Enums\NotificationChannel;
use App\Modules\Notifications\Enums\NotificationDeliveryStatus;
use App\Modules\Notifications\Enums\NotificationType;
use App\Modules\Notifications\Jobs\ProcessNotificationDeliveryJob;
use App\Modules\Orders\Enums\OrderStatus;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Throwable;

class NotificationDeliveryService
{
    public function __construct(
        private readonly NotificationTransportManager $notificationTransportManager,
        private readonly NotificationTemplateService $notificationTemplateService,
    ) {
    }

    public function queueOrderStatusNotifications(
        Order $order,
        OrderStatus $status,
        ?int $actorUserId = null,
        array $metadata = []
    ): void {
        $order->loadMissing([
            'customerProfile.user',
            'riderProfile.user',
            'merchant.staffMemberships.user',
            'branch',
        ]);

        $this->persistDeliveries(
            $order,
            NotificationType::ORDER_STATUS_UPDATED,
            $this->orderRecipients($order, $actorUserId),
            fn (array $recipient) => $this->notificationTemplateService->orderStatusMessage(
                $order,
                $status,
                $recipient['actor'],
                $metadata
            )
        );
    }

    public function queueSupportNoteAdded(Order $order, SupportNote $note, ?int $actorUserId = null): void
    {
        $order->loadMissing([
            'customerProfile.user',
            'riderProfile.user',
            'merchant.staffMemberships.user',
            'branch',
        ]);
        $note->loadMissing('author');

        $this->persistDeliveries(
            $order,
            NotificationType::SUPPORT_NOTE_ADDED,
            $this->orderRecipients($order, $actorUserId),
            fn (array $recipient) => $this->notificationTemplateService->supportNoteMessage(
                $order,
                $note,
                $recipient['actor']
            )
        );
    }

    private function persistDeliveries(
        Order $order,
        NotificationType $type,
        Collection $recipients,
        callable $templateResolver
    ): void {
        $timestamp = now();

        foreach ($recipients as $recipient) {
            $template = $templateResolver($recipient);

            foreach ($template['channels'] as $channel) {
                $delivery = NotificationDelivery::query()->create([
                    'order_id' => $order->id,
                    'recipient_user_id' => $recipient['user_id'],
                    'recipient_actor' => $recipient['actor'],
                    'notification_type' => $type,
                    'channel' => $channel,
                    'provider' => $this->providerForChannel($channel),
                    'status' => $channel === NotificationChannel::IN_APP
                        ? NotificationDeliveryStatus::SENT
                        : NotificationDeliveryStatus::QUEUED,
                    'title' => $template['title'],
                    'body' => $template['body'],
                    'payload' => $template['payload'] ?? [],
                    'attempt_count' => $channel === NotificationChannel::IN_APP ? 1 : 0,
                    'last_attempted_at' => $channel === NotificationChannel::IN_APP ? $timestamp : null,
                    'queued_at' => $timestamp,
                    'next_retry_at' => null,
                    'sent_at' => $channel === NotificationChannel::IN_APP ? $timestamp : null,
                    'provider_reference' => $channel === NotificationChannel::IN_APP
                        ? sprintf('internal:%s', $order->uuid)
                        : null,
                ]);

                if ($channel !== NotificationChannel::IN_APP) {
                    $this->processDelivery($delivery);
                }
            }
        }
    }

    public function processDelivery(NotificationDelivery $delivery): NotificationDelivery
    {
        if ($delivery->status === NotificationDeliveryStatus::SENT) {
            return $delivery;
        }

        $transport = $this->notificationTransportManager->forDelivery(
            $delivery->loadMissing(['recipientUser', 'order'])
        );
        $delivery->forceFill([
            'provider' => $transport->driverName(),
            'attempt_count' => $delivery->attempt_count + 1,
            'last_attempted_at' => now(),
            'next_retry_at' => null,
            'last_error' => null,
        ])->save();

        try {
            $providerReference = $transport->send($delivery);

            $delivery->forceFill([
                'status' => NotificationDeliveryStatus::SENT,
                'provider_reference' => $providerReference,
                'sent_at' => now(),
                'next_retry_at' => null,
                'last_error' => null,
            ])->save();

            return $delivery->fresh();
        } catch (Throwable $exception) {
            return $this->markFailedAttempt($delivery, $exception);
        }
    }

    public function retryDelivery(NotificationDelivery $delivery): NotificationDelivery
    {
        $delivery->forceFill([
            'status' => NotificationDeliveryStatus::QUEUED,
            'next_retry_at' => null,
            'last_error' => null,
        ])->save();

        return $this->processDelivery($delivery->fresh());
    }

    private function orderRecipients(Order $order, ?int $actorUserId = null): Collection
    {
        $merchantRecipients = $order->merchant?->staffMemberships
            ?->map(fn ($membership) => $membership->user
                ? ['user_id' => $membership->user->id, 'actor' => 'merchant']
                : null)
            ->all() ?? [];

        $recipients = collect([
            $order->customerProfile?->user
                ? ['user_id' => $order->customerProfile->user->id, 'actor' => 'customer']
                : null,
            $order->riderProfile?->user
                ? ['user_id' => $order->riderProfile->user->id, 'actor' => 'rider']
                : null,
            ...$merchantRecipients,
        ])->filter();

        return $recipients
            ->reject(fn (array $recipient) => $actorUserId && $recipient['user_id'] === $actorUserId)
            ->unique(fn (array $recipient) => sprintf('%s:%s', $recipient['actor'], $recipient['user_id']))
            ->values();
    }

    private function markFailedAttempt(NotificationDelivery $delivery, Throwable $exception): NotificationDelivery
    {
        $hasAttemptsRemaining = $delivery->attempt_count < config('notifications.max_attempts', 3);
        $delaySeconds = $this->retryDelayForAttempt($delivery->attempt_count);

        $delivery->forceFill([
            'status' => $hasAttemptsRemaining
                ? NotificationDeliveryStatus::QUEUED
                : NotificationDeliveryStatus::FAILED,
            'last_error' => Str::limit($exception->getMessage(), 1000),
            'next_retry_at' => $hasAttemptsRemaining ? now()->addSeconds($delaySeconds) : null,
        ])->save();

        if ($hasAttemptsRemaining) {
            $this->dispatchProcessingJob($delivery->id, $delaySeconds);
        }

        return $delivery->fresh();
    }

    private function retryDelayForAttempt(int $attemptCount): int
    {
        $delays = config('notifications.retry_backoff_seconds', [60, 300]);

        return (int) ($delays[$attemptCount - 1] ?? last($delays) ?? 300);
    }

    private function providerForChannel(NotificationChannel $channel): string
    {
        return match ($channel) {
            NotificationChannel::IN_APP => 'internal',
            NotificationChannel::EMAIL => config('notifications.channels.email.driver', 'mail'),
            NotificationChannel::PUSH => config('notifications.channels.push.driver', 'log'),
            NotificationChannel::SMS => match (config('notifications.channels.sms.driver', 'log')) {
                'log' => 'sms-log',
                default => config('notifications.channels.sms.driver', 'log'),
            },
        };
    }

    private function dispatchProcessingJob(int $notificationDeliveryId, ?int $delaySeconds = null): void
    {
        if (app()->runningUnitTests() || $delaySeconds === 0) {
            ProcessNotificationDeliveryJob::dispatchSync($notificationDeliveryId);

            return;
        }

        $job = ProcessNotificationDeliveryJob::dispatch($notificationDeliveryId)
            ->onQueue(config('notifications.queue', 'notifications'));

        if ($delaySeconds) {
            $job->delay(now()->addSeconds($delaySeconds));
        }
    }
}
