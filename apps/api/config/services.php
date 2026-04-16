<?php

return [
    'maps' => [
        'provider' => env('MAPS_PROVIDER', 'demo'),
        'average_driving_speed_kph' => (float) env('MAPS_AVERAGE_DRIVING_SPEED_KPH', 28),
    ],

    'dispatch' => [
        'pickup_sla_minutes' => (int) env('DISPATCH_PICKUP_SLA_MINUTES', 30),
        'pickup_sla_warning_minutes' => (int) env('DISPATCH_PICKUP_SLA_WARNING_MINUTES', 10),
    ],

    'google_maps' => [
        'key' => env('GOOGLE_MAPS_API_KEY'),
    ],
];
