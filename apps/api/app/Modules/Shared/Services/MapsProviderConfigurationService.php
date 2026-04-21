<?php

namespace App\Modules\Shared\Services;

use App\Models\MapsProviderSetting;

class MapsProviderConfigurationService
{
    /**
     * @return array<string, mixed>
     */
    public function publicPayload(): array
    {
        $setting = $this->setting();
        $apiKey = $this->googleMapsApiKey($setting);
        $apiKeySource = $this->googleMapsApiKeySource($setting);
        $provider = $this->provider($setting);
        $ready = $provider === 'google_maps' && $apiKey !== '';

        return [
            'provider' => $provider,
            'google_maps' => [
                'api_key_configured' => $apiKey !== '',
                'api_key_source' => $apiKeySource,
                'api_key_preview' => $apiKey === '' ? null : $this->maskKey($apiKey),
                'region' => $this->googleMapsRegion($setting),
                'location_bias' => $this->googleMapsLocationBias($setting),
                'timeout_seconds' => $this->googleMapsTimeoutSeconds($setting),
                'fallback_to_demo' => $this->googleMapsFallbackToDemo($setting),
            ],
            'runtime' => [
                'ready' => $ready,
                'fallback_active' => ! $ready,
                'message' => $this->runtimeMessage($provider, $ready),
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function update(array $payload, ?int $configuredByUserId = null): MapsProviderSetting
    {
        $setting = $this->setting() ?? new MapsProviderSetting;

        $setting->provider = $this->normalizeProvider($payload['provider'] ?? $setting->provider ?? $this->configuredProvider());
        $setting->google_maps_region = $payload['google_maps_region']
            ?? $setting->google_maps_region
            ?? (string) config('services.google_maps.region', 'sa');
        $setting->google_maps_location_bias = array_key_exists('google_maps_location_bias', $payload)
            ? $payload['google_maps_location_bias']
            : ($setting->google_maps_location_bias ?? config('services.google_maps.location_bias'));
        $setting->google_maps_timeout_seconds = $payload['google_maps_timeout_seconds']
            ?? $setting->google_maps_timeout_seconds
            ?? $this->configuredTimeoutSeconds();
        $setting->google_maps_fallback_to_demo = $payload['google_maps_fallback_to_demo']
            ?? $setting->google_maps_fallback_to_demo
            ?? $this->configuredFallbackToDemo();

        if (($payload['clear_google_maps_api_key'] ?? false) === true) {
            $setting->google_maps_api_key = null;
        } elseif (filled($payload['google_maps_api_key'] ?? null)) {
            $setting->google_maps_api_key = $payload['google_maps_api_key'];
        }

        if ($configuredByUserId !== null) {
            $setting->configured_by_user_id = $configuredByUserId;
        }

        $setting->save();

        return $setting->refresh();
    }

    public function provider(?MapsProviderSetting $setting = null): string
    {
        $setting ??= $this->setting();

        return $this->normalizeProvider($setting instanceof MapsProviderSetting ? $setting->provider : $this->configuredProvider());
    }

    public function googleMapsApiKey(?MapsProviderSetting $setting = null): string
    {
        $setting ??= $this->setting();
        $adminKey = $setting?->google_maps_api_key;

        if (filled($adminKey)) {
            return (string) $adminKey;
        }

        return (string) config('services.google_maps.key', '');
    }

    public function googleMapsRegion(?MapsProviderSetting $setting = null): string
    {
        $setting ??= $this->setting();

        return (string) (($setting instanceof MapsProviderSetting ? $setting->google_maps_region : null) ?: config('services.google_maps.region', 'sa'));
    }

    public function googleMapsLocationBias(?MapsProviderSetting $setting = null): ?string
    {
        $setting ??= $this->setting();
        $locationBias = $setting instanceof MapsProviderSetting
            ? $setting->google_maps_location_bias
            : config('services.google_maps.location_bias');

        return filled($locationBias) ? (string) $locationBias : null;
    }

    public function googleMapsTimeoutSeconds(?MapsProviderSetting $setting = null): float
    {
        $setting ??= $this->setting();

        return max(0.5, (float) ($setting instanceof MapsProviderSetting
            ? $setting->google_maps_timeout_seconds
            : $this->configuredTimeoutSeconds()));
    }

    public function googleMapsFallbackToDemo(?MapsProviderSetting $setting = null): bool
    {
        $setting ??= $this->setting();

        return (bool) ($setting instanceof MapsProviderSetting
            ? $setting->google_maps_fallback_to_demo
            : $this->configuredFallbackToDemo());
    }

    private function setting(): ?MapsProviderSetting
    {
        return MapsProviderSetting::query()->latest('id')->first();
    }

    private function googleMapsApiKeySource(?MapsProviderSetting $setting): string
    {
        if (filled($setting?->google_maps_api_key)) {
            return 'admin';
        }

        if (filled(config('services.google_maps.key'))) {
            return 'env';
        }

        return 'none';
    }

    private function maskKey(string $apiKey): string
    {
        return '••••••••'.mb_substr($apiKey, -4);
    }

    private function runtimeMessage(string $provider, bool $ready): string
    {
        if ($ready) {
            return 'Google Maps is ready for live traffic.';
        }

        if ($provider === 'demo') {
            return 'Demo maps provider is active.';
        }

        return 'Google Maps is selected and will use demo fallback until an API key is configured.';
    }

    private function normalizeProvider(string $provider): string
    {
        $normalized = in_array($provider, ['google', 'google_maps'], true) ? 'google_maps' : $provider;

        return in_array($normalized, ['google_maps', 'demo'], true) ? $normalized : 'demo';
    }

    private function configuredProvider(): string
    {
        return (string) config('services.maps.provider', 'google_maps');
    }

    private function configuredTimeoutSeconds(): float
    {
        return max(0.5, (float) config('services.google_maps.timeout_seconds', 2.5));
    }

    private function configuredFallbackToDemo(): bool
    {
        return (bool) config('services.google_maps.fallback_to_demo', true);
    }
}
