<?php

return [
    'queue' => env('NOTIFICATIONS_QUEUE', 'notifications'),
    'max_attempts' => (int) env('NOTIFICATIONS_MAX_ATTEMPTS', 3),
    'retry_backoff_seconds' => array_map(
        fn (string $seconds) => (int) trim($seconds),
        array_filter(explode(',', (string) env('NOTIFICATIONS_RETRY_BACKOFF_SECONDS', '60,300')))
    ),
    'channels' => [
        'email' => [
            'driver' => env('NOTIFICATIONS_EMAIL_DRIVER', 'mail'),
            'mailer' => env('NOTIFICATIONS_EMAIL_MAILER', env('MAIL_MAILER', 'smtp')),
        ],
        'push' => [
            'driver' => env('NOTIFICATIONS_PUSH_DRIVER', 'log'),
        ],
        'sms' => [
            'driver' => env('NOTIFICATIONS_SMS_DRIVER', 'log'),
        ],
    ],
];
