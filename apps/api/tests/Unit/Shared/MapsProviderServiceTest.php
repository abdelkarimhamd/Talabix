<?php

use App\Modules\Shared\Services\MapsProviderService;
use Illuminate\Support\Facades\Http;

it('uses Google Places when production maps credentials are configured', function () {
    config([
        'services.maps.provider' => 'google_maps',
        'services.google_maps.key' => 'test-google-key',
        'services.google_maps.places_endpoint' => 'https://maps.googleapis.test/maps/api/place/findplacefromtext/json',
        'services.google_maps.fallback_to_demo' => true,
    ]);

    Http::fake([
        'maps.googleapis.test/maps/api/place/findplacefromtext/json*' => Http::response([
            'status' => 'OK',
            'candidates' => [
                [
                    'place_id' => 'google-place-1',
                    'name' => 'King Fahd Tower',
                    'formatted_address' => 'King Fahd Road, Riyadh Saudi Arabia',
                    'geometry' => [
                        'location' => [
                            'lat' => 24.716,
                            'lng' => 46.681,
                        ],
                    ],
                ],
            ],
        ]),
    ]);

    $results = app(MapsProviderService::class)->searchPlaces('King Fahd');

    expect($results)->toHaveCount(1)
        ->and($results[0])->toMatchArray([
            'id' => 'google-place-1',
            'title' => 'King Fahd Tower',
            'label' => 'King Fahd Tower',
            'line_1' => 'King Fahd Road, Riyadh Saudi Arabia',
            'city' => 'Riyadh',
            'latitude' => 24.716,
            'longitude' => 46.681,
        ]);
});

it('uses Google Distance Matrix when production maps credentials are configured', function () {
    config([
        'services.maps.provider' => 'google_maps',
        'services.google_maps.key' => 'test-google-key',
        'services.google_maps.distance_matrix_endpoint' => 'https://maps.googleapis.test/maps/api/distancematrix/json',
        'services.google_maps.fallback_to_demo' => true,
    ]);

    Http::fake([
        'maps.googleapis.test/maps/api/distancematrix/json*' => Http::response([
            'status' => 'OK',
            'rows' => [
                [
                    'elements' => [
                        [
                            'status' => 'OK',
                            'distance' => [
                                'text' => '1.2 km',
                                'value' => 1234,
                            ],
                            'duration' => [
                                'text' => '10 mins',
                                'value' => 600,
                            ],
                        ],
                    ],
                ],
            ],
        ]),
    ]);

    $estimate = app(MapsProviderService::class)->distanceEstimate(
        24.716,
        46.681,
        24.7118,
        46.6734,
    );

    expect($estimate)->toMatchArray([
        'mode' => 'driving',
        'distance_meters' => 1234,
        'duration_minutes' => 10,
        'duration_seconds' => 600,
        'distance_text' => '1.2 km',
        'duration_text' => '10 mins',
        'provider' => 'google_maps',
    ]);
});

it('falls back to demo estimates when Google Distance Matrix fails', function () {
    config([
        'services.maps.provider' => 'google_maps',
        'services.google_maps.key' => 'test-google-key',
        'services.google_maps.distance_matrix_endpoint' => 'https://maps.googleapis.test/maps/api/distancematrix/json',
        'services.google_maps.fallback_to_demo' => true,
    ]);

    Http::fake([
        'maps.googleapis.test/maps/api/distancematrix/json*' => Http::response([
            'status' => 'OVER_QUERY_LIMIT',
            'error_message' => 'Quota exceeded.',
        ]),
    ]);

    $estimate = app(MapsProviderService::class)->distanceEstimate(
        24.716,
        46.681,
        24.7118,
        46.6734,
    );

    expect($estimate['provider'])->toBe('demo')
        ->and($estimate['distance_meters'])->toBeGreaterThan(0)
        ->and($estimate['duration_minutes'])->toBeGreaterThan(0);
});
