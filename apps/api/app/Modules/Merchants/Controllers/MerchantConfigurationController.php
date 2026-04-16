<?php

namespace App\Modules\Merchants\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\BranchFeeBand;
use App\Models\BranchServiceZone;
use App\Models\Merchant;
use App\Modules\Merchants\Requests\UpdateBranchConfigurationRequest;
use App\Modules\Merchants\Requests\UpdateMerchantConfigurationRequest;
use App\Modules\Merchants\Requests\UpsertBranchFeeBandRequest;
use App\Modules\Merchants\Requests\UpsertBranchServiceZoneRequest;
use App\Modules\Merchants\Resources\BranchFeeBandResource;
use App\Modules\Merchants\Resources\BranchServiceZoneResource;
use App\Modules\Merchants\Resources\MerchantConfigurationResource;
use App\Modules\Merchants\Resources\OpsBranchConfigurationResource;
use App\Modules\Shared\Actions\RecordAuditLogAction;
use App\Modules\Shared\Enums\AuditActionType;
use Illuminate\Http\JsonResponse;

class MerchantConfigurationController extends Controller
{
    public function __construct(private readonly RecordAuditLogAction $recordAuditLogAction)
    {
    }

    public function index(\Illuminate\Http\Request $request): JsonResponse
    {
        $this->ensureAbility($request, 'ops:merchants.manage');

        $merchants = Merchant::query()
            ->with([
                'branches' => fn ($branchQuery) => $branchQuery
                    ->orderBy('name')
                    ->with([
                        'serviceZones' => fn ($zoneQuery) => $zoneQuery->orderBy('name'),
                        'feeBands' => fn ($bandQuery) => $bandQuery->orderBy('min_distance_meters'),
                    ]),
            ])
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => MerchantConfigurationResource::collection($merchants),
        ]);
    }

    public function show(\Illuminate\Http\Request $request, Merchant $merchant): JsonResponse
    {
        $this->ensureAbility($request, 'ops:merchants.manage');
        $this->authorize('view', $merchant);

        return response()->json([
            'data' => new MerchantConfigurationResource(
                $merchant->load([
                    'branches' => fn ($branchQuery) => $branchQuery
                        ->orderBy('name')
                        ->with([
                            'serviceZones' => fn ($zoneQuery) => $zoneQuery->orderBy('name'),
                            'feeBands' => fn ($bandQuery) => $bandQuery->orderBy('min_distance_meters'),
                        ]),
                ])
            ),
        ]);
    }

    public function updateMerchant(
        UpdateMerchantConfigurationRequest $request,
        Merchant $merchant
    ): JsonResponse {
        $this->ensureAbility($request, 'ops:merchants.manage');
        $this->authorize('update', $merchant);

        $merchant->update($request->validated());

        $this->recordAuditLogAction->execute(
            AuditActionType::BRANCH_UPDATED,
            $request->user(),
            $merchant,
            'Merchant configuration updated.',
            [
                'merchant_uuid' => $merchant->uuid,
                'scope' => 'merchant_configuration',
                'changes' => $request->validated(),
            ]
        );

        return response()->json([
            'data' => new MerchantConfigurationResource(
                $merchant->fresh()->load([
                    'branches' => fn ($branchQuery) => $branchQuery
                        ->orderBy('name')
                        ->with([
                            'serviceZones' => fn ($zoneQuery) => $zoneQuery->orderBy('name'),
                            'feeBands' => fn ($bandQuery) => $bandQuery->orderBy('min_distance_meters'),
                        ]),
                ])
            ),
        ]);
    }

    public function updateBranch(
        UpdateBranchConfigurationRequest $request,
        Branch $branch
    ): JsonResponse {
        $this->ensureAbility($request, 'ops:merchants.manage');
        $this->authorize('update', $branch->merchant);

        $branch->update($request->validated());

        $this->recordAuditLogAction->execute(
            AuditActionType::BRANCH_UPDATED,
            $request->user(),
            $branch,
            'Branch configuration updated.',
            [
                'branch_uuid' => $branch->uuid,
                'scope' => 'branch_configuration',
                'changes' => $request->validated(),
            ]
        );

        return response()->json([
            'data' => new OpsBranchConfigurationResource(
                $branch->fresh()->load([
                    'serviceZones' => fn ($zoneQuery) => $zoneQuery->orderBy('name'),
                    'feeBands' => fn ($bandQuery) => $bandQuery->orderBy('min_distance_meters'),
                ])
            ),
        ]);
    }

    public function storeServiceZone(
        UpsertBranchServiceZoneRequest $request,
        Branch $branch
    ): JsonResponse {
        $this->ensureAbility($request, 'ops:merchants.manage');
        $this->authorize('update', $branch->merchant);

        $serviceZone = $branch->serviceZones()->create($request->validated());

        $this->recordAuditLogAction->execute(
            AuditActionType::BRANCH_UPDATED,
            $request->user(),
            $branch,
            'Branch service zone created.',
            [
                'branch_uuid' => $branch->uuid,
                'service_zone_uuid' => $serviceZone->uuid,
                'scope' => 'service_zone',
            ]
        );

        return response()->json([
            'data' => new BranchServiceZoneResource($serviceZone),
        ], 201);
    }

    public function updateServiceZone(
        UpsertBranchServiceZoneRequest $request,
        BranchServiceZone $serviceZone
    ): JsonResponse {
        $this->ensureAbility($request, 'ops:merchants.manage');
        $this->authorize('update', $serviceZone->branch->merchant);

        $serviceZone->update($request->validated());

        $this->recordAuditLogAction->execute(
            AuditActionType::BRANCH_UPDATED,
            $request->user(),
            $serviceZone->branch,
            'Branch service zone updated.',
            [
                'branch_uuid' => $serviceZone->branch->uuid,
                'service_zone_uuid' => $serviceZone->uuid,
                'scope' => 'service_zone',
            ]
        );

        return response()->json([
            'data' => new BranchServiceZoneResource($serviceZone->fresh()),
        ]);
    }

    public function storeFeeBand(
        UpsertBranchFeeBandRequest $request,
        Branch $branch
    ): JsonResponse {
        $this->ensureAbility($request, 'ops:merchants.manage');
        $this->authorize('update', $branch->merchant);

        $feeBand = $branch->feeBands()->create($request->validated());

        $this->recordAuditLogAction->execute(
            AuditActionType::BRANCH_UPDATED,
            $request->user(),
            $branch,
            'Branch fee band created.',
            [
                'branch_uuid' => $branch->uuid,
                'fee_band_uuid' => $feeBand->uuid,
                'scope' => 'fee_band',
            ]
        );

        return response()->json([
            'data' => new BranchFeeBandResource($feeBand),
        ], 201);
    }

    public function updateFeeBand(
        UpsertBranchFeeBandRequest $request,
        BranchFeeBand $feeBand
    ): JsonResponse {
        $this->ensureAbility($request, 'ops:merchants.manage');
        $this->authorize('update', $feeBand->branch->merchant);

        $feeBand->update($request->validated());

        $this->recordAuditLogAction->execute(
            AuditActionType::BRANCH_UPDATED,
            $request->user(),
            $feeBand->branch,
            'Branch fee band updated.',
            [
                'branch_uuid' => $feeBand->branch->uuid,
                'fee_band_uuid' => $feeBand->uuid,
                'scope' => 'fee_band',
            ]
        );

        return response()->json([
            'data' => new BranchFeeBandResource($feeBand->fresh()),
        ]);
    }
}
