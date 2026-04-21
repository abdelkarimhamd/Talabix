<?php

namespace App\Modules\Catalog\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\BranchCatalogOverride;
use App\Models\CatalogItem;
use App\Models\CatalogItemModifierGroup;
use App\Models\Merchant;
use App\Modules\Catalog\Requests\MerchantCatalogIndexRequest;
use App\Modules\Catalog\Requests\StoreBranchOverrideRequest;
use App\Modules\Catalog\Requests\StoreCatalogItemRequest;
use App\Modules\Catalog\Requests\StoreModifierGroupRequest;
use App\Modules\Catalog\Resources\CatalogItemResource;
use App\Modules\Catalog\Resources\CatalogModifierGroupResource;
use App\Modules\Shared\Actions\RecordAuditLogAction;
use App\Modules\Shared\Enums\AuditActionType;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CatalogController extends Controller
{
    public function __construct(private readonly RecordAuditLogAction $recordAuditLogAction) {}

    public function index(MerchantCatalogIndexRequest $request): JsonResponse
    {
        $this->ensureAbility($request, 'merchant:catalog.read');

        $merchant = Merchant::query()
            ->with('branches')
            ->where('uuid', $request->string('merchant_uuid'))
            ->firstOrFail();

        $this->authorize('view', $merchant);

        $items = CatalogItem::query()
            ->where('merchant_id', $merchant->id)
            ->with([
                'merchant',
                'branchOverrides.branch',
                'modifierGroups.options',
            ])
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => CatalogItemResource::collection($items),
        ]);
    }

    public function branchCatalog(Branch $branch): JsonResponse
    {
        $items = CatalogItem::query()
            ->where('merchant_id', $branch->merchant_id)
            ->where('is_active', true)
            ->with([
                'merchant',
                'modifierGroups' => fn ($query) => $query
                    ->where('is_active', true)
                    ->with(['options' => fn ($optionQuery) => $optionQuery
                        ->where('is_active', true)
                        ->orderBy('sort_order')
                        ->orderBy('name')]),
                'branchOverrides' => fn ($query) => $query
                    ->where('branch_id', $branch->id)
                    ->with('branch'),
            ])
            ->orderBy('name')
            ->get()
            ->each(function (CatalogItem $catalogItem) use ($branch) {
                /** @var BranchCatalogOverride|null $override */
                $override = $catalogItem->branchOverrides->first();

                $catalogItem->setAttribute('effective_branch_uuid', $branch->uuid);
                $catalogItem->setAttribute(
                    'effective_price_minor',
                    $override?->price_minor ?? $catalogItem->base_price_minor
                );
                $catalogItem->setAttribute(
                    'effective_stock_quantity',
                    $override?->stock_quantity ?? $catalogItem->base_stock
                );
                $catalogItem->setAttribute(
                    'effective_is_available',
                    $override?->is_available ?? $catalogItem->is_active
                );
            });

        return response()->json([
            'data' => CatalogItemResource::collection($items),
        ]);
    }

    public function store(StoreCatalogItemRequest $request): JsonResponse
    {
        $this->ensureAbility($request, 'merchant:catalog.write');

        $merchant = Merchant::query()->where('uuid', $request->string('merchant_uuid'))->firstOrFail();
        $this->authorize('update', $merchant);

        $catalogItem = CatalogItem::query()->create([
            'uuid' => (string) Str::uuid(),
            'merchant_id' => $merchant->id,
            ...$request->safe()->except('merchant_uuid'),
        ]);

        $this->recordAuditLogAction->execute(
            AuditActionType::CATALOG_UPDATED,
            $request->user(),
            $catalogItem,
            'Catalog item created.',
            ['catalog_item_uuid' => $catalogItem->uuid]
        );

        return response()->json([
            'data' => new CatalogItemResource($catalogItem->load([
                'merchant',
                'branchOverrides.branch',
                'modifierGroups.options',
            ])),
        ], 201);
    }

    public function update(StoreCatalogItemRequest $request, CatalogItem $catalogItem): JsonResponse
    {
        $this->ensureAbility($request, 'merchant:catalog.write');
        $this->authorize('update', $catalogItem);

        $catalogItem->update($request->safe()->except('merchant_uuid'));

        $this->recordAuditLogAction->execute(
            AuditActionType::CATALOG_UPDATED,
            $request->user(),
            $catalogItem,
            'Catalog item updated.',
            ['catalog_item_uuid' => $catalogItem->uuid]
        );

        return response()->json([
            'data' => new CatalogItemResource($catalogItem->fresh()->load([
                'merchant',
                'branchOverrides.branch',
                'modifierGroups.options',
            ])),
        ]);
    }

    public function storeModifierGroup(
        StoreModifierGroupRequest $request,
        CatalogItem $catalogItem
    ): JsonResponse {
        $this->ensureAbility($request, 'merchant:catalog.write');
        $this->authorize('update', $catalogItem);

        $modifierGroup = DB::transaction(function () use ($request, $catalogItem) {
            $modifierGroup = $catalogItem->modifierGroups()->create([
                'uuid' => (string) Str::uuid(),
                'name' => $request->string('name')->toString(),
                'description' => $request->input('description'),
                'selection_type' => $request->string('selection_type')->toString(),
                'min_selected' => (int) ($request->input('min_selected') ?? 0),
                'max_selected' => $request->input('max_selected'),
                'is_active' => $request->boolean('is_active', true),
                'sort_order' => (int) ($request->input('sort_order') ?? 0),
            ]);

            foreach ($request->validated('options') as $optionPayload) {
                $modifierGroup->options()->create([
                    'uuid' => (string) Str::uuid(),
                    'name' => $optionPayload['name'],
                    'description' => $optionPayload['description'] ?? null,
                    'price_delta_minor' => $optionPayload['price_delta_minor'],
                    'is_default' => (bool) ($optionPayload['is_default'] ?? false),
                    'is_active' => (bool) ($optionPayload['is_active'] ?? true),
                    'sort_order' => (int) ($optionPayload['sort_order'] ?? 0),
                ]);
            }

            return $modifierGroup->load('options');
        });

        $this->recordAuditLogAction->execute(
            AuditActionType::CATALOG_UPDATED,
            $request->user(),
            $catalogItem,
            'Catalog modifier group created.',
            [
                'catalog_item_uuid' => $catalogItem->uuid,
                'modifier_group_uuid' => $modifierGroup->uuid,
            ]
        );

        return response()->json([
            'data' => new CatalogModifierGroupResource($modifierGroup),
        ], 201);
    }

    public function updateModifierGroup(
        StoreModifierGroupRequest $request,
        CatalogItem $catalogItem,
        CatalogItemModifierGroup $modifierGroup
    ): JsonResponse {
        $this->ensureAbility($request, 'merchant:catalog.write');
        $this->authorize('update', $catalogItem);
        abort_unless($modifierGroup->catalog_item_id === $catalogItem->id, 404);

        $modifierGroup = DB::transaction(function () use ($request, $modifierGroup) {
            $modifierGroup->update([
                'name' => $request->string('name')->toString(),
                'description' => $request->input('description'),
                'selection_type' => $request->string('selection_type')->toString(),
                'min_selected' => (int) ($request->input('min_selected') ?? 0),
                'max_selected' => $request->input('max_selected'),
                'is_active' => $request->boolean('is_active', true),
                'sort_order' => (int) ($request->input('sort_order') ?? 0),
            ]);

            $existingOptions = $modifierGroup->options()->get()->keyBy('uuid');
            $keptOptionIds = [];

            foreach ($request->validated('options') as $optionPayload) {
                $optionUuid = $optionPayload['uuid'] ?? null;
                $option = $optionUuid
                    ? $existingOptions->get($optionUuid)
                    : null;

                if ($option) {
                    $option->update([
                        'name' => $optionPayload['name'],
                        'description' => $optionPayload['description'] ?? null,
                        'price_delta_minor' => $optionPayload['price_delta_minor'],
                        'is_default' => (bool) ($optionPayload['is_default'] ?? false),
                        'is_active' => (bool) ($optionPayload['is_active'] ?? true),
                        'sort_order' => (int) ($optionPayload['sort_order'] ?? 0),
                    ]);
                    $keptOptionIds[] = $option->id;

                    continue;
                }

                $createdOption = $modifierGroup->options()->create([
                    'uuid' => $optionUuid ?: (string) Str::uuid(),
                    'name' => $optionPayload['name'],
                    'description' => $optionPayload['description'] ?? null,
                    'price_delta_minor' => $optionPayload['price_delta_minor'],
                    'is_default' => (bool) ($optionPayload['is_default'] ?? false),
                    'is_active' => (bool) ($optionPayload['is_active'] ?? true),
                    'sort_order' => (int) ($optionPayload['sort_order'] ?? 0),
                ]);
                $keptOptionIds[] = $createdOption->id;
            }

            $modifierGroup->options()
                ->whereNotIn('id', $keptOptionIds)
                ->delete();

            return $modifierGroup->fresh()->load('options');
        });

        $this->recordAuditLogAction->execute(
            AuditActionType::CATALOG_UPDATED,
            $request->user(),
            $catalogItem,
            'Catalog modifier group updated.',
            [
                'catalog_item_uuid' => $catalogItem->uuid,
                'modifier_group_uuid' => $modifierGroup->uuid,
            ]
        );

        return response()->json([
            'data' => new CatalogModifierGroupResource($modifierGroup),
        ]);
    }

    public function upsertBranchOverride(
        StoreBranchOverrideRequest $request,
        Branch $branch,
        CatalogItem $catalogItem
    ): JsonResponse {
        $this->ensureAbility($request, 'merchant:catalog.write');
        $this->authorize('update', $catalogItem);

        $override = BranchCatalogOverride::query()->updateOrCreate(
            [
                'branch_id' => $branch->id,
                'catalog_item_id' => $catalogItem->id,
            ],
            $request->validated()
        );

        $this->recordAuditLogAction->execute(
            AuditActionType::CATALOG_UPDATED,
            $request->user(),
            $catalogItem,
            'Branch catalog override updated.',
            ['branch_uuid' => $branch->uuid]
        );

        return response()->json([
            'data' => [
                'branch_uuid' => $branch->uuid,
                'catalog_item_uuid' => $catalogItem->uuid,
                'override' => [
                    'branch_uuid' => $branch->uuid,
                    'branch_name' => $branch->name,
                    'price_minor' => $override->price_minor,
                    'stock_quantity' => $override->stock_quantity,
                    'is_available' => (bool) $override->is_available,
                ],
            ],
        ]);
    }
}
