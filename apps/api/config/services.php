<?php

return [
    'readiness' => [
        'key' => env('READINESS_CHECK_KEY'),
    ],

    'maps' => [
        'provider' => env('MAPS_PROVIDER', 'google_maps'),
        'average_driving_speed_kph' => (float) env('MAPS_AVERAGE_DRIVING_SPEED_KPH', 28),
    ],

    'dispatch' => [
        'pickup_sla_minutes' => (int) env('DISPATCH_PICKUP_SLA_MINUTES', 30),
        'pickup_sla_warning_minutes' => (int) env('DISPATCH_PICKUP_SLA_WARNING_MINUTES', 10),
        'delivery_exception_response_sla_minutes' => (int) env('DELIVERY_EXCEPTION_RESPONSE_SLA_MINUTES', 10),
        'delivery_exception_response_warning_minutes' => (int) env('DELIVERY_EXCEPTION_RESPONSE_WARNING_MINUTES', 3),
        'sla_alert_threshold' => (int) env('DISPATCH_SLA_ALERT_THRESHOLD', 1),
    ],

    'google_maps' => [
        'key' => env('GOOGLE_MAPS_API_KEY'),
        'places_endpoint' => env(
            'GOOGLE_MAPS_PLACES_ENDPOINT',
            'https://maps.googleapis.com/maps/api/place/findplacefromtext/json'
        ),
        'distance_matrix_endpoint' => env(
            'GOOGLE_MAPS_DISTANCE_MATRIX_ENDPOINT',
            'https://maps.googleapis.com/maps/api/distancematrix/json'
        ),
        'location_bias' => env('GOOGLE_MAPS_LOCATION_BIAS', 'circle:50000@24.7136,46.6753'),
        'region' => env('GOOGLE_MAPS_REGION', 'sa'),
        'timeout_seconds' => (float) env('GOOGLE_MAPS_TIMEOUT_SECONDS', 2.5),
        'fallback_to_demo' => (bool) env('GOOGLE_MAPS_FALLBACK_TO_DEMO', true),
    ],
];
