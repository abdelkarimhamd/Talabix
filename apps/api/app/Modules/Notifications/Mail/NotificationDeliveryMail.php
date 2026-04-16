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

    public function __construct(public readonly NotificationDelivery $delivery)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->delivery->title,
        );
    }

    public function content(): Content
    {
        $html = new HtmlString(sprintf(
            '<div style="font-family:Arial,sans-serif;line-height:1.6;"><h1 style="font-size:20px;">%s</h1><p>%s</p><p style="color:#617181;font-size:12px;">Order: %s</p></div>',
            e($this->delivery->title),
            nl2br(e($this->delivery->body)),
            e(strtoupper(substr((string) data_get($this->delivery->payload, 'order_uuid', ''), 0, 8)))
        ));

        return new Content(
            htmlString: $html,
        );
    }
}
