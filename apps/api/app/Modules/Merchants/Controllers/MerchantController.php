<?php

namespace App\Modules\Merchants\Controllers;

use App\Http\Controllers\Controller;
use App\Models\CustomerAddress;
use App\Models\Merchant;
use App\Models\MerchantStaffMembership;
use App\Modules\Merchants\Actions\CreateMerchantAction;
use App\Modules\Merchants\Requests\CustomerMerchantDiscoveryRequest;
use App\Modules\Merchants\Requests\StoreMerchantRequest;
use App\Modules\Merchants\Resources\MerchantResource;
use App\Modules\Merchants\Services\CustomerMerchantDiscoveryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class MerchantController extends Controller
{
    public function __construct(
        private readonly CreateMerchantAction $createMerchantAction,
        private readonly CustomerMerchantDiscoveryService $customerMerchantDiscoveryService,
    ) {}

    public function indexForOps(Request $request): JsonResponse
    {
        $this->ensureAbility($request, 'ops:merchants.manage');

        return response()->json([
            'data' => MerchantResource::collection(Merchant::query()->with('branches')->latest()->get()),
        ]);
    }

    public function store(StoreMerchantRequest $request): JsonResponse
    {
        $this->ensureAbility($request, 'ops:merchants.manage');

        $merchant = $this->createMerchantAction->execute($request->validated(), $request->user());

        return response()->json([
            'data' => new MerchantResource($merchant->load('branches')),
        ], 201);
    }

    public function mine(Request $request): JsonResponse
    {
        $this->ensureAbility($request, 'merchant:dashboard.read');

        $merchantIds = MerchantStaffMembership::query()
            ->where('user_id', $request->user()->id)
            ->where('status', 'active')
            ->pluck('merchant_id');

        return response()->json([
            'data' => MerchantResource::collection(
                Merchant::query()->whereIn('id', $merchantIds)->with('branches')->get()
            ),
        ]);
    }

    public function publicIndex(CustomerMerchantDiscoveryRequest $request): JsonResponse
    {
        $address = $this->resolveCustomerAddress($request);

        return response()->json([
            'data' => MerchantResource::collection(
                $this->customerMerchantDiscoveryService->list(
                    $address,
                    $request->string('search')->toString(),
                    $request->boolean('open_now')
                )
            ),
        ]);
    }

    public function publicShow(CustomerMerchantDiscoveryRequest $request, Merchant $merchant): JsonResponse
    {
        $address = $this->resolveCustomerAddress($request);

        return response()->json([
            'data' => new MerchantResource(
                $this->customerMerchantDiscoveryService->detail($merchant, $address)
            ),
        ]);
    }

    private function resolveCustomerAddress(Request $request): ?CustomerAddress
    {
        if (! $request->filled('address_uuid')) {
            return null;
        }

        $user = auth('sanctum')->user();

        if (! $user?->customerProfile) {
            throw ValidationException::withMessages([
                'address_uuid' => 'A signed-in customer is required to filter merchants by address.',
            ]);
        }

        $address = $user->customerProfile->addresses()
            ->where('uuid', $request->string('address_uuid'))
            ->first();

        if (! $address) {
            throw ValidationException::withMessages([
                'address_uuid' => 'The selected address is not available for this customer.',
            ]);
        }

        return $address;
    }
}
