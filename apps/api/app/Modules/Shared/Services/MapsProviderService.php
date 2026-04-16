<?php

namespace App\Modules\Shared\Services;

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
        return (string) config('services.maps.provider', 'demo');
    }

    public function searchPlaces(string $query): array
    {
        $normalizedQuery = str($query)->lower()->trim()->toString();

        if (mb_strlen($normalizedQuery) < 2) {
            return [];
        }

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
        $distanceMeters = $this->distanceMeters($fromLat, $fromLng, $toLat, $toLng);
        $averageKph = max(1, (float) config('services.maps.average_driving_speed_kph', 28));
        $metersPerMinute = ($averageKph * 1000) / 60;

        return [
            'mode' => $mode,
            'distance_meters' => $distanceMeters,
            'duration_minutes' => max(1, (int) ceil($distanceMeters / $metersPerMinute)),
            'provider' => $this->provider(),
        ];
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
