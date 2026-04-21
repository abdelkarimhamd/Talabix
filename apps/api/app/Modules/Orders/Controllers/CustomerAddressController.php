<?php

namespace App\Modules\Orders\Controllers;

use App\Http\Controllers\Controller;
use App\Models\CustomerAddress;
use App\Models\CustomerProfile;
use App\Modules\Orders\Requests\StoreAddressRequest;
use App\Modules\Orders\Resources\AddressResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CustomerAddressController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->ensureAbility($request, 'customer:profile.read');

        return response()->json([
            'data' => AddressResource::collection(
                $request->user()->customerProfile->addresses()->latest()->get()
            ),
        ]);
    }

    public function store(StoreAddressRequest $request): JsonResponse
    {
        $this->ensureAbility($request, 'customer:addresses.write');

        $profile = $request->user()->customerProfile;
        $validated = $request->validated();
        $makeDefault = ($validated['is_default'] ?? false) || ! $profile->addresses()->exists();

        if ($makeDefault) {
            $profile->addresses()->update(['is_default' => false]);
        }

        $address = $profile->addresses()->create([
            'uuid' => (string) Str::uuid(),
            ...$validated,
            'is_default' => $makeDefault,
        ]);

        return response()->json([
            'data' => new AddressResource($address),
        ], 201);
    }

    public function update(StoreAddressRequest $request, CustomerAddress $address): JsonResponse
    {
        $this->ensureAbility($request, 'customer:addresses.write');
        abort_unless($address->customerProfile->user_id === $request->user()->id, 403);

        $validated = $request->validated();

        if (($validated['is_default'] ?? false) === true) {
            $address->customerProfile->addresses()->update(['is_default' => false]);
        }

        $address->update($validated);
        $this->ensureDefaultAddressExists($address->customerProfile);

        return response()->json([
            'data' => new AddressResource($address->fresh()),
        ]);
    }

    private function ensureDefaultAddressExists(CustomerProfile $profile): void
    {
        if ($profile->addresses()->where('is_default', true)->exists()) {
            return;
        }

        $profile->addresses()->oldest('id')->first()?->update(['is_default' => true]);
    }
}
