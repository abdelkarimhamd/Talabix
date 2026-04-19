<?php

namespace App\Modules\Shared\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class MapsProviderService
{
    private const DEMO_PLACES = [
        [
            'id' => 'place-home-olaya',
            'title' => 'King Fahd Tower Lobby',
            'label' => 'Home',
            'line_1' => 'King Fahd Road',
            'line_2' => null,
            'building' => 'Tower A',
            'landmark' => 'North gate lobby desk',
            'city' => 'Riyadh',
            'latitude' => 24.716,
            'longitude' => 46.681,
        ],
        [
            'id' => 'place-office-olaya',
            'title' => 'Olaya Office Hub',
            'label' => 'Office',
            'line_1' => 'Olaya Street',
            'line_2' => 'Gate 3',
            'building' => 'Business Plaza',
            'landmark' => 'Reception elevator bank',
            'city' => 'Riyadh',
            'latitude' => 24.7118,
            'longitude' => 46.6734,
        ],
        [
            'id' => 'place-dq-villa',
            'title' => 'Diplomatic Quarter Villa',
            'label' => 'Parents',
            'line_1' => 'DQ Plaza',
            'line_2' => null,
            'building' => 'Villa 12',
            'landmark' => 'Palm court entrance',
            'city' => 'Riyadh',
            'latitude' => 24.6841,
            'longitude' => 46.6297,
        ],
    ];

    public function provider(): string
    {
        $provider = (string) config('services.maps.provider', 'demo');

        return in_array($provider, ['google', 'google_maps'], true) ? 'google_maps' : $provider;
    }

    public function searchPlaces(string $query): array
    {
        $normalizedQuery = str($query)->lower()->trim()->toString();

        if (mb_strlen($normalizedQuery) < 2) {
            return [];
        }

        if ($this->usesGoogleMaps()) {
            try {
                return $this->searchGooglePlaces($query);
            } catch (Throwable $exception) {
                if (! $this->shouldFallbackToDemo()) {
                    throw $exception;
                }

                $this->logGoogleMapsFallback('places_search', $exception);
            }
        }

        return $this->searchDemoPlaces($normalizedQuery);
    }

    private function searchDemoPlaces(string $normalizedQuery): array
    {
        return collect(self::DEMO_PLACES)
            ->filter(function (array $place) use ($normalizedQuery) {
                return str(implode(' ', array_filter([
                    $place['title'],
                    $place['label'],
                    $place['line_1'],
                    $place['line_2'],
                    $place['building'],
                    $place['landmark'],
                    $place['city'],
                ])))->lower()->contains($normalizedQuery);
            })
            ->values()
            ->all();
    }

    public function distanceMeters(float $fromLat, float $fromLng, float $toLat, float $toLng): int
    {
        $earthRadius = 6371000;
        $latDelta = deg2rad($toLat - $fromLat);
        $lngDelta = deg2rad($toLng - $fromLng);
        $angle = sin($latDelta / 2) ** 2
            + cos(deg2rad($fromLat)) * cos(deg2rad($toLat)) * sin($lngDelta / 2) ** 2;

        return (int) round(2 * $earthRadius * asin(sqrt($angle)));
    }

    public function distanceEstimate(
        float $fromLat,
        float $fromLng,
        float $toLat,
        float $toLng,
        string $mode = 'driving'
    ): array {
        if ($this->usesGoogleMaps()) {
            try {
                return $this->googleDistanceEstimate($fromLat, $fromLng, $toLat, $toLng, $mode);
            } catch (Throwable $exception) {
                if (! $this->shouldFallbackToDemo()) {
                    throw $exception;
                }

                $this->logGoogleMapsFallback('distance_matrix', $exception);
            }
        }

        return $this->demoDistanceEstimate($fromLat, $fromLng, $toLat, $toLng, $mode);
    }

    private function demoDistanceEstimate(
        float $fromLat,
        float $fromLng,
        float $toLat,
        float $toLng,
        string $mode = 'driving'
    ): array {
        $distanceMeters = $this->distanceMeters($fromLat, $fromLng, $toLat, $toLng);
        $averageKph = max(1, (float) config('services.maps.average_driving_speed_kph', 28));
        $metersPerMinute = ($averageKph * 1000) / 60;

        return [
            'mode' => $mode,
            'distance_meters' => $distanceMeters,
            'duration_minutes' => max(1, (int) ceil($distanceMeters / $metersPerMinute)),
            'duration_seconds' => max(60, (int) ceil(($distanceMeters / $metersPerMinute) * 60)),
            'distance_text' => $this->distanceText($distanceMeters),
            'duration_text' => trans_choice(
                'messages.maps.duration_minutes',
                max(1, (int) ceil($distanceMeters / $metersPerMinute)),
                ['minutes' => max(1, (int) ceil($distanceMeters / $metersPerMinute))]
            ),
            'provider' => 'demo',
        ];
    }

    private function searchGooglePlaces(string $query): array
    {
        $params = [
            'input' => $query,
            'inputtype' => 'textquery',
            'fields' => 'formatted_address,name,geometry,place_id',
            'key' => $this->googleMapsKey(),
            'region' => config('services.google_maps.region'),
        ];

        if (filled(config('services.google_maps.location_bias'))) {
            $params['locationbias'] = config('services.google_maps.location_bias');
        }

        $response = Http::timeout($this->googleMapsTimeoutSeconds())
            ->get((string) config('services.google_maps.places_endpoint'), $params);

        if (! $response->successful()) {
            throw new \RuntimeException('Google Places request failed with HTTP '.$response->status().'.');
        }

        $payload = $response->json();
        $status = $payload['status'] ?? 'UNKNOWN';

        if ($status === 'ZERO_RESULTS') {
            return [];
        }

        if ($status !== 'OK') {
            throw new \RuntimeException($payload['error_message'] ?? 'Google Places returned '.$status.'.');
        }

        return collect($payload['candidates'] ?? [])
            ->map(fn (array $candidate) => $this->mapGooglePlaceCandidate($candidate))
            ->filter()
            ->values()
            ->all();
    }

    private function googleDistanceEstimate(
        float $fromLat,
        float $fromLng,
        float $toLat,
        float $toLng,
        string $mode
    ): array {
        $response = Http::timeout($this->googleMapsTimeoutSeconds())
            ->get((string) config('services.google_maps.distance_matrix_endpoint'), [
                'origins' => $fromLat.','.$fromLng,
                'destinations' => $toLat.','.$toLng,
                'mode' => $mode,
                'units' => 'metric',
                'key' => $this->googleMapsKey(),
            ]);

        if (! $response->successful()) {
            throw new \RuntimeException('Google Distance Matrix request failed with HTTP '.$response->status().'.');
        }

        $payload = $response->json();
        $status = $payload['status'] ?? 'UNKNOWN';
        $element = $payload['rows'][0]['elements'][0] ?? null;
        $elementStatus = $element['status'] ?? 'UNKNOWN';

        if ($status !== 'OK' || $elementStatus !== 'OK') {
            throw new \RuntimeException($payload['error_message'] ?? 'Google Distance Matrix returned '.$status.'/'.$elementStatus.'.');
        }

        $distanceMeters = (int) ($element['distance']['value'] ?? 0);
        $durationSeconds = max(60, (int) ($element['duration']['value'] ?? 0));

        return [
            'mode' => $mode,
            'distance_meters' => $distanceMeters,
            'duration_minutes' => max(1, (int) ceil($durationSeconds / 60)),
            'duration_seconds' => $durationSeconds,
            'distance_text' => $element['distance']['text'] ?? $this->distanceText($distanceMeters),
            'duration_text' => $element['duration']['text'] ?? trans_choice(
                'messages.maps.duration_minutes',
                max(1, (int) ceil($durationSeconds / 60)),
                ['minutes' => max(1, (int) ceil($durationSeconds / 60))]
            ),
            'provider' => 'google_maps',
        ];
    }

    private function mapGooglePlaceCandidate(array $candidate): ?array
    {
        $location = $candidate['geometry']['location'] ?? null;

        if (! isset($candidate['place_id'], $candidate['name'], $candidate['formatted_address'], $location['lat'], $location['lng'])) {
            return null;
        }

        return [
            'id' => (string) $candidate['place_id'],
            'title' => (string) $candidate['name'],
            'label' => (string) $candidate['name'],
            'line_1' => (string) $candidate['formatted_address'],
            'line_2' => null,
            'building' => null,
            'landmark' => null,
            'city' => $this->guessCity((string) $candidate['formatted_address']),
            'latitude' => (float) $location['lat'],
            'longitude' => (float) $location['lng'],
        ];
    }

    private function guessCity(string $formattedAddress): string
    {
        foreach (['Riyadh', 'Jeddah', 'Dammam', 'Makkah', 'Medina'] as $city) {
            if (str($formattedAddress)->lower()->contains(str($city)->lower()->toString())) {
                return $city;
            }
        }

        return 'Riyadh';
    }

    private function usesGoogleMaps(): bool
    {
        return $this->provider() === 'google_maps' && $this->googleMapsKey() !== '';
    }

    private function googleMapsKey(): string
    {
        return (string) config('services.google_maps.key', '');
    }

    private function googleMapsTimeoutSeconds(): float
    {
        return max(0.5, (float) config('services.google_maps.timeout_seconds', 2.5));
    }

    private function shouldFallbackToDemo(): bool
    {
        return (bool) config('services.google_maps.fallback_to_demo', true);
    }

    private function logGoogleMapsFallback(string $operation, Throwable $exception): void
    {
        Log::warning('Google Maps provider fallback activated.', [
            'operation' => $operation,
            'error' => $exception->getMessage(),
        ]);
    }

    private function distanceText(int $distanceMeters): string
    {
        if ($distanceMeters < 1000) {
            return __('messages.maps.distance_meters', ['meters' => $distanceMeters]);
        }

        return __('messages.maps.distance_kilometers', [
            'kilometers' => number_format($distanceMeters / 1000, 1),
        ]);
    }

    public function directionsUrl(
        float $destinationLat,
        float $destinationLng,
        ?float $originLat = null,
        ?float $originLng = null,
        string $mode = 'driving'
    ): string {
        $params = [
            'api' => '1',
            'destination' => $destinationLat.','.$destinationLng,
            'travelmode' => $mode,
        ];

        if ($originLat !== null && $originLng !== null) {
            $params['origin'] = $originLat.','.$originLng;
        }

        return 'https://www.google.com/maps/dir/?'.http_build_query($params);
    }
}
