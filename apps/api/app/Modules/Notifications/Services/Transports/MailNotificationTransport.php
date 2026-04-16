<?php

namespace App\Modules\Notifications\Services\Transports;

use App\Models\NotificationDelivery;
use App\Modules\Notifications\Contracts\NotificationChannelTransport;
use App\Modules\Notifications\Mail\NotificationDeliveryMail;
use Illuminate\Support\Facades\Mail;
use RuntimeException;

class MailNotificationTransport implements NotificationChannelTransport
{
    public function driverName(): string
    {
        return 'mail';
    }

    public function send(NotificationDelivery $delivery): ?string
    {
        $recipientEmail = $delivery->recipientUser?->email;

        if (! $recipientEmail) {
            throw new RuntimeException('The notification recipient does not have an email address.');
        }

        Mail::mailer(config('notifications.channels.email.mailer'))
            ->to($recipientEmail)
            ->send(new NotificationDeliveryMail($delivery->loadMissing('recipientUser')));

        return sprintf('mail:%s', $delivery->id);
    }
}
