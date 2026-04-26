<?php

namespace App\Modules\Catalog\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\BranchCatalogOverride;
use App\Models\CatalogCategory;
use App\Models\CatalogItem;
use App\Models\CatalogItemModifierGroup;
use App\Models\Merchant;
use App\Modules\Catalog\Requests\MerchantCatalogIndexRequest;
use App\Modules\Catalog\Requests\StoreBranchOverrideRequest;
use App\Modules\Catalog\Requests\StoreCatalogCategoryRequest;
use App\Modules\Catalog\Requests\StoreCatalogItemRequest;
use App\Modules\Catalog\Requests\StoreModifierGroupRequest;
use App\Modules\Catalog\Resources\CatalogCategoryResource;
use App\Modules\Catalog\Resources\CatalogItemResource;
use App\Modules\Catalog\Resources\CatalogModifierGroupResource;
use App\Modules\Shared\Actions\RecordAuditLogAction;
use App\Modules\Shared\Enums\AuditActionType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CatalogController extends Controller
{
    public function __construct(private readonly RecordAuditLogAction $recordAuditLogAction) {}

    public function categories(MerchantCatalogIndexRequest $request): JsonResponse
    {
        $this->ensureCatalogAbility($request, 'merchant:catalog.read');

        $merchant = Merchant::query()
            ->where('uuid', $request->string('merchant_uuid'))
            ->firstOrFail();

        $this->authorize('view', $merchant);
        $this->syncCategoriesFromItems($merchant);

        $categories = CatalogCategory::query()
            ->where('merchant_id', $merchant->id)
            ->with('merchant')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $itemCounts = CatalogItem::query()
            ->where('merchant_id', $merchant->id)
            ->whereNotNull('category_name')
            ->select('category_name', DB::raw('count(*) as aggregate'))
            ->groupBy('category_name')
            ->pluck('aggregate', 'category_name');

        $categories->each(function (CatalogCategory $category) use ($itemCounts): void {
            $category->setAttribute('item_count', (int) ($itemCounts[$category->name] ?? 0));
        });

        return response()->json([
            'data' => CatalogCategoryResource::collection($categories),
        ]);
    }

    public function storeCategory(StoreCatalogCategoryRequest $request): JsonResponse
    {
        $this->ensureCatalogAbility($request, 'merchant:catalog.write');

        $merchant = Merchant::query()
            ->where('uuid', $request->string('merchant_uuid'))
            ->firstOrFail();
        $this->authorize('update', $merchant);

        $name = trim($request->string('name')->toString());
        $this->ensureCategoryNameIsNotBlank($name);
        $this->ensureCategoryNameIsAvailable($merchant, $name);

        $category = CatalogCategory::query()->create([
            'uuid' => (string) Str::uuid(),
            'merchant_id' => $merchant->id,
            'name' => $name,
            'description' => $request->input('description'),
            'is_active' => $request->boolean('is_active', true),
            'sort_order' => (int) ($request->input('sort_order') ?? 0),
        ]);

        $this->recordAuditLogAction->execute(
            AuditActionType::CATALOG_UPDATED,
            $request->user(),
            $merchant,
            'Catalog category created.',
            ['catalog_category_uuid' => $category->uuid]
        );

        return response()->json([
            'data' => new CatalogCategoryResource($category->load('merchant')),
        ], 201);
    }

    public function updateCategory(
        StoreCatalogCategoryRequest $request,
        CatalogCategory $catalogCategory
    ): JsonResponse {
        $this->ensureCatalogAbility($request, 'merchant:catalog.write');
        $merchant = $catalogCategory->merchant()->firstOrFail();
        $this->authorize('update', $merchant);

        abort_unless(
            $merchant->uuid === $request->string('merchant_uuid')->toString(),
            404
        );

        $name = trim($request->string('name')->toString());
        $this->ensureCategoryNameIsNotBlank($name);
        $this->ensureCategoryNameIsAvailable($merchant, $name, $catalogCategory);
        $oldName = $catalogCategory->name;

        $catalogCategory = DB::transaction(function () use (
            $catalogCategory,
            $name,
            $oldName,
            $request
        ) {
            $catalogCategory->update([
                'name' => $name,
                'description' => $request->input('description'),
                'is_active' => $request->boolean('is_active', true),
                'sort_order' => (int) ($request->input('sort_order') ?? 0),
            ]);

            if ($oldName !== $name) {
                CatalogItem::query()
                    ->where('merchant_id', $catalogCategory->merchant_id)
                    ->where('category_name', $oldName)
                    ->update(['category_name' => $name]);
            }

            $catalogCategory->refresh();
            $catalogCategory->load('merchant');

            return $catalogCategory;
        });

        $this->recordAuditLogAction->execute(
            AuditActionType::CATALOG_UPDATED,
            $request->user(),
            $merchant,
            'Catalog category updated.',
            ['catalog_category_uuid' => $catalogCategory->uuid]
        );

        return response()->json([
            'data' => new CatalogCategoryResource($catalogCategory),
        ]);
    }

    public function destroyCategory(
        Request $request,
        CatalogCategory $catalogCategory
    ): JsonResponse {
        $this->ensureCatalogAbility($request, 'merchant:catalog.write');
        $merchant = $catalogCategory->merchant()->firstOrFail();
        $this->authorize('update', $merchant);

        $categoryUuid = $catalogCategory->uuid;

        DB::transaction(function () use ($catalogCategory): void {
            CatalogItem::query()
                ->where('merchant_id', $catalogCategory->merchant_id)
                ->where('category_name', $catalogCategory->name)
                ->update(['category_name' => null]);

            $catalogCategory->delete();
        });

        $this->recordAuditLogAction->execute(
            AuditActionType::CATALOG_UPDATED,
            $request->user(),
            $merchant,
            'Catalog category deleted.',
            ['catalog_category_uuid' => $categoryUuid]
        );

        return response()->json([
            'data' => ['uuid' => $categoryUuid],
        ]);
    }

    public function index(MerchantCatalogIndexRequest $request): JsonResponse
    {
        $this->ensureCatalogAbility($request, 'merchant:catalog.read');

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
                $override = $catalogItem->branchOverrides->first();

                $catalogItem->setAttribute('effective_branch_uuid', $branch->uuid);
                $catalogItem->setAttribute(
                    'effective_price_minor',
                    data_get($override, 'price_minor') ?? $catalogItem->base_price_minor
                );
                $catalogItem->setAttribute(
                    'effective_stock_quantity',
                    data_get($override, 'stock_quantity') ?? $catalogItem->base_stock
                );
                $catalogItem->setAttribute(
                    'effective_is_available',
                    data_get($override, 'is_available') ?? $catalogItem->is_active
                );
            });

        return response()->json([
            'data' => CatalogItemResource::collection($items),
        ]);
    }

    public function store(StoreCatalogItemRequest $request): JsonResponse
    {
        $this->ensureCatalogAbility($request, 'merchant:catalog.write');

        $merchant = Merchant::query()->where('uuid', $request->string('merchant_uuid'))->firstOrFail();
        $this->authorize('update', $merchant);

        $catalogItem = CatalogItem::query()->create([
            'uuid' => (string) Str::uuid(),
            'merchant_id' => $merchant->id,
            ...$request->safe()->except('merchant_uuid'),
        ]);
        $this->ensureCategoryExists($merchant, $catalogItem->category_name);

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
        $this->ensureCatalogAbility($request, 'merchant:catalog.write');
        $this->authorize('update', $catalogItem);

        $catalogItem->update($request->safe()->except('merchant_uuid'));
        $this->ensureCategoryExists(
            $catalogItem->merchant()->firstOrFail(),
            $catalogItem->category_name
        );

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
        $this->ensureCatalogAbility($request, 'merchant:catalog.write');
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
        $this->ensureCatalogAbility($request, 'merchant:catalog.write');
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
        $this->ensureCatalogAbility($request, 'merchant:catalog.write');
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

    private function ensureCatalogAbility(Request $request, string $merchantAbility): void
    {
        if ($request->is('api/v1/ops/*')) {
            $this->ensureAbility($request, 'ops:merchants.manage');

            return;
        }

        $this->ensureAbility($request, $merchantAbility);
    }

    private function ensureCategoryNameIsAvailable(
        Merchant $merchant,
        string $name,
        ?CatalogCategory $exceptCategory = null
    ): void {
        $query = CatalogCategory::query()
            ->where('merchant_id', $merchant->id)
            ->where('name', $name);

        if ($exceptCategory) {
            $query->whereKeyNot($exceptCategory->id);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'name' => 'Category name already exists for this merchant.',
            ]);
        }
    }

    private function ensureCategoryNameIsNotBlank(string $name): void
    {
        if ($name !== '') {
            return;
        }

        throw ValidationException::withMessages([
            'name' => 'Category name is required.',
        ]);
    }

    private function syncCategoriesFromItems(Merchant $merchant): void
    {
        CatalogItem::query()
            ->where('merchant_id', $merchant->id)
            ->whereNotNull('category_name')
            ->where('category_name', '<>', '')
            ->select('category_name')
            ->distinct()
            ->pluck('category_name')
            ->each(fn (string $categoryName) => $this->ensureCategoryExists(
                $merchant,
                $categoryName
            ));
    }

    private function ensureCategoryExists(
        Merchant $merchant,
        ?string $categoryName
    ): void {
        $name = trim((string) $categoryName);

        if ($name === '') {
            return;
        }

        CatalogCategory::query()->firstOrCreate(
            [
                'merchant_id' => $merchant->id,
                'name' => $name,
            ],
            [
                'uuid' => (string) Str::uuid(),
                'description' => null,
                'is_active' => true,
                'sort_order' => 0,
            ]
        );
    }
}
