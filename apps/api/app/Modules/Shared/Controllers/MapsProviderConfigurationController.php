<?php

namespace App\Modules\Shared\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Shared\Actions\RecordAuditLogAction;
use App\Modules\Shared\Enums\AuditActionType;
use App\Modules\Shared\Requests\UpdateMapsProviderConfigurationRequest;
use App\Modules\Shared\Services\MapsProviderConfigurationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MapsProviderConfigurationController extends Controller
{
    public function __construct(
        private readonly MapsProviderConfigurationService $configurationService,
        private readonly RecordAuditLogAction $recordAuditLogAction
    ) {}

    public function show(Request $request): JsonResponse
    {
        $this->ensureAbility($request, 'ops:merchants.manage');

        return response()->json([
            'data' => $this->configurationService->publicPayload(),
        ]);
    }

    public function update(UpdateMapsProviderConfigurationRequest $request): JsonResponse
    {
        $this->ensureAbility($request, 'ops:merchants.manage');

        $validated = $request->validated();
        $setting = $this->configurationService->update($validated, $request->user()?->id);

        $this->recordAuditLogAction->execute(
            AuditActionType::MAPS_CONFIGURATION_UPDATED,
            $request->user(),
            $setting,
            'Maps provider configuration updated.',
            [
                'provider' => $setting->provider,
                'google_maps_region' => $setting->google_maps_region,
                'google_maps_fallback_to_demo' => $setting->google_maps_fallback_to_demo,
                'api_key_updated' => filled($validated['google_maps_api_key'] ?? null),
                'api_key_cleared' => (bool) ($validated['clear_google_maps_api_key'] ?? false),
            ]
        );

        return response()->json([
            'data' => $this->configurationService->publicPayload(),
        ]);
    }
}
