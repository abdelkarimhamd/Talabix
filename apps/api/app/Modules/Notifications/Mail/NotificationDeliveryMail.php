<?php

namespace App\Modules\Notifications\Mail;

use App\Models\NotificationDelivery;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\HtmlString;

class NotificationDeliveryMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly NotificationDelivery $delivery) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->delivery->title,
        );
    }

    public function content(): Content
    {
        $locale = app()->getLocale();
        $dir = $locale === 'ar' ? 'rtl' : 'ltr';
        $textAlign = $locale === 'ar' ? 'right' : 'left';

        $html = new HtmlString(sprintf(
            '<div lang="%s" dir="%s" style="font-family:Arial,sans-serif;line-height:1.6;text-align:%s;"><h1 style="font-size:20px;">%s</h1><p>%s</p><p style="color:#617181;font-size:12px;">%s %s</p></div>',
            e($locale),
            e($dir),
            e($textAlign),
            e($this->delivery->title),
            nl2br(e($this->delivery->body)),
            e(__('messages.mail.order_label')),
            e(strtoupper(substr((string) data_get($this->delivery->payload, 'order_uuid', ''), 0, 8)))
        ));

        return new Content(
            htmlString: $html,
        );
    }
}
