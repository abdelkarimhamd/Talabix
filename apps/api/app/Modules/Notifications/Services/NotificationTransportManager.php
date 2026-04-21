<?php

namespace App\Modules\Notifications\Services;

use App\Models\NotificationDelivery;
use App\Modules\Notifications\Contracts\NotificationChannelTransport;
use App\Modules\Notifications\Enums\NotificationChannel;
use App\Modules\Notifications\Services\Transports\FailingNotificationTransport;
use App\Modules\Notifications\Services\Transports\LogPushNotificationTransport;
use App\Modules\Notifications\Services\Transports\LogSmsNotificationTransport;
use App\Modules\Notifications\Services\Transports\MailNotificationTransport;
use InvalidArgumentException;

class NotificationTransportManager
{
    public function __construct(
        private readonly MailNotificationTransport $mailNotificationTransport,
        private readonly LogPushNotificationTransport $logPushNotificationTransport,
        private readonly LogSmsNotificationTransport $logSmsNotificationTransport,
        private readonly FailingNotificationTransport $failingNotificationTransport,
    ) {}

    public function forDelivery(NotificationDelivery $delivery): NotificationChannelTransport
    {
        $channel = $delivery->channel;

        return match ($channel) {
            NotificationChannel::EMAIL => $this->emailTransport(),
            NotificationChannel::PUSH => $this->pushTransport(),
            NotificationChannel::SMS => $this->smsTransport(),
            default => throw new InvalidArgumentException(sprintf(
                'Channel [%s] is not processed through the queued transport manager.',
                $channel->value
            )),
        };
    }

    private function emailTransport(): NotificationChannelTransport
    {
        return match (config('notifications.channels.email.driver', 'mail')) {
            'mail' => $this->mailNotificationTransport,
            'failing' => $this->failingNotificationTransport,
            default => throw new InvalidArgumentException('Unsupported email notification driver.'),
        };
    }

    private function pushTransport(): NotificationChannelTransport
    {
        return match (config('notifications.channels.push.driver', 'log')) {
            'log' => $this->logPushNotificationTransport,
            'failing' => $this->failingNotificationTransport,
            default => throw new InvalidArgumentException('Unsupported push notification driver.'),
        };
    }

    private function smsTransport(): NotificationChannelTransport
    {
        return match (config('notifications.channels.sms.driver', 'log')) {
            'log' => $this->logSmsNotificationTransport,
            'failing' => $this->failingNotificationTransport,
            default => throw new InvalidArgumentException('Unsupported sms notification driver.'),
        };
    }
}
