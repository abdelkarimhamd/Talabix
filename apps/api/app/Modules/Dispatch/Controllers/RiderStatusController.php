<?php

namespace App\Modules\Dispatch\Controllers;

use App\Http\Controllers\Controller;
use App\Models\RiderLocation;
use App\Modules\Dispatch\Events\OpsDispatchBoardUpdated;
use App\Modules\Dispatch\Requests\UpdateRiderAvailabilityRequest;
use App\Modules\Dispatch\Requests\UpdateRiderLocationRequest;
use Illuminate\Http\JsonResponse;

class RiderStatusController extends Controller
{
    public function updateAvailability(UpdateRiderAvailabilityRequest $request): JsonResponse
    {
        $this->ensureAbility($request, 'rider:availability.update');

        $riderProfile = $request->user()->riderProfile;
        $riderProfile->update($request->validated());

        event(new OpsDispatchBoardUpdated(
            reason: 'rider_availability_updated',
            payload: [
                'rider_uuid' => $riderProfile->uuid,
                'availability' => $riderProfile->availability->value,
            ],
        ));

        return response()->json([
            'data' => [
                'rider_uuid' => $riderProfile->uuid,
                'availability' => $riderProfile->availability,
            ],
        ]);
    }

    public function updateLocation(UpdateRiderLocationRequest $request): JsonResponse
    {
        $this->ensureAbility($request, 'rider:location.update');

        $riderProfile = $request->user()->riderProfile;

        RiderLocation::query()->create([
            'rider_profile_id' => $riderProfile->id,
            'latitude' => $request->validated('latitude'),
            'longitude' => $request->validated('longitude'),
            'recorded_at' => now(),
        ]);

        event(new OpsDispatchBoardUpdated(
            reason: 'rider_location_updated',
            payload: [
                'rider_uuid' => $riderProfile->uuid,
                'latitude' => $request->validated('latitude'),
                'longitude' => $request->validated('longitude'),
            ],
        ));

        return response()->json([
            'message' => 'Rider location updated.',
        ]);
    }
}
