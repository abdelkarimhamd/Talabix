<?php

use App\Models\MapsProviderSetting;
use App\Modules\Shared\Services\MapsProviderService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

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

it('uses the admin stored Google Maps key before environment fallback config', function () {
    MapsProviderSetting::query()->create([
        'provider' => 'google_maps',
        'google_maps_api_key' => 'admin-google-key',
        'google_maps_region' => 'sa',
        'google_maps_location_bias' => 'circle:50000@24.7136,46.6753',
        'google_maps_timeout_seconds' => 2.5,
        'google_maps_fallback_to_demo' => true,
    ]);
    config([
        'services.maps.provider' => 'demo',
        'services.google_maps.key' => 'env-google-key',
        'services.google_maps.places_endpoint' => 'https://maps.googleapis.test/maps/api/place/findplacefromtext/json',
    ]);

    Http::fake([
        'maps.googleapis.test/maps/api/place/findplacefromtext/json*' => Http::response([
            'status' => 'OK',
            'candidates' => [],
        ]),
    ]);

    app(MapsProviderService::class)->searchPlaces('King Fahd');

    Http::assertSent(fn ($request) => $request['key'] === 'admin-google-key'
        && $request['region'] === 'sa'
        && $request['locationbias'] === 'circle:50000@24.7136,46.6753');
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
    Log::spy();

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

    Log::shouldHaveReceived('warning')
        ->once()
        ->with(
            'Google Maps provider fallback activated.',
            Mockery::on(
                fn (array $context) => ($context['event'] ?? null) === 'google_maps_provider_fallback_activated'
                    && ($context['provider'] ?? null) === 'google_maps'
                    && ($context['fallback_provider'] ?? null) === 'demo'
                    && ($context['operation'] ?? null) === 'distance_matrix'
                    && str_contains((string) ($context['error'] ?? ''), 'Quota exceeded')
            )
        );
});
