<?php

namespace App\Modules\Shared\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Shared\Requests\PlaceSearchRequest;
use App\Modules\Shared\Resources\PlaceSuggestionResource;
use App\Modules\Shared\Services\MapsProviderService;
use Illuminate\Http\JsonResponse;

class MapsController extends Controller
{
    public function __construct(private readonly MapsProviderService $mapsProviderService) {}

    public function customerPlaces(PlaceSearchRequest $request): JsonResponse
    {
        $this->ensureAbility($request, 'customer:addresses.write');

        return response()->json([
            'data' => PlaceSuggestionResource::collection(
                $this->mapsProviderService->searchPlaces($request->string('query')->toString())
            ),
            'meta' => [
                'provider' => $this->mapsProviderService->provider(),
            ],
        ]);
    }
}
