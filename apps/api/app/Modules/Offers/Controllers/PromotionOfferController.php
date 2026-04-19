<?php

namespace App\Modules\Offers\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\CatalogItem;
use App\Models\PromotionOffer;
use App\Modules\Offers\Requests\StorePromotionOfferRequest;
use App\Modules\Offers\Resources\PromotionOfferResource;
use App\Modules\Shared\Actions\RecordAuditLogAction;
use App\Modules\Shared\Enums\AuditActionType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PromotionOfferController extends Controller
{
    public function __construct(private readonly RecordAuditLogAction $recordAuditLogAction) {}

    public function opsIndex(Request $request): JsonResponse
    {
        $this->ensureAbility($request, 'ops:merchants.manage');

        return response()->json([
            'data' => PromotionOfferResource::collection(
                PromotionOffer::query()
                    ->with(['branch.merchant', 'catalogItem'])
                    ->latest()
                    ->get()
            ),
        ]);
    }

    public function merchantIndex(Request $request): JsonResponse
    {
        $this->ensureAbility($request, 'merchant:catalog.read');

        $merchantIds = $request->user()
            ->merchantMemberships()
            ->where('status', 'active')
            ->pluck('merchant_id');

        return response()->json([
            'data' => PromotionOfferResource::collection(
                PromotionOffer::query()
                    ->with(['branch.merchant', 'catalogItem'])
                    ->whereHas('branch', fn ($query) => $query->whereIn('merchant_id', $merchantIds))
                    ->latest()
                    ->get()
            ),
        ]);
    }

    public function opsStore(StorePromotionOfferRequest $request): JsonResponse
    {
        $this->ensureAbility($request, 'ops:merchants.manage');

        return $this->storeOffer($request);
    }

    public function merchantStore(StorePromotionOfferRequest $request): JsonResponse
    {
        $this->ensureAbility($request, 'merchant:catalog.write');

        $branch = Branch::query()->where('uuid', $request->string('branch_uuid'))->firstOrFail();
        $this->authorize('update', $branch->merchant);

        return $this->storeOffer($request, $branch);
    }

    public function update(StorePromotionOfferRequest $request, PromotionOffer $promotionOffer): JsonResponse
    {
        $this->ensureWriteAccess($request, $promotionOffer);
        $branch = Branch::query()->where('uuid', $request->string('branch_uuid'))->firstOrFail();

        if (! $request->is('api/v1/ops/*')) {
            $this->authorize('update', $branch->merchant);
        }

        $payload = $this->payloadForOffer($request, $branch);

        $promotionOffer->update($payload);
        $this->recordAudit($request, $promotionOffer->fresh(), 'Promotion offer updated.');

        return response()->json([
            'data' => new PromotionOfferResource(
                $promotionOffer->fresh()->load(['branch.merchant', 'catalogItem'])
            ),
        ]);
    }

    public function destroy(Request $request, PromotionOffer $promotionOffer): JsonResponse
    {
        $this->ensureWriteAccess($request, $promotionOffer);
        $this->recordAudit($request, $promotionOffer, 'Promotion offer deleted.');
        $promotionOffer->delete();

        return response()->json(null, 204);
    }

    private function storeOffer(StorePromotionOfferRequest $request, ?Branch $branch = null): JsonResponse
    {
        $branch ??= Branch::query()->where('uuid', $request->string('branch_uuid'))->firstOrFail();
        $promotionOffer = PromotionOffer::query()->create($this->payloadForOffer($request, $branch));
        $this->recordAudit($request, $promotionOffer, 'Promotion offer created.');

        return response()->json([
            'data' => new PromotionOfferResource(
                $promotionOffer->load(['branch.merchant', 'catalogItem'])
            ),
        ], 201);
    }

    private function payloadForOffer(StorePromotionOfferRequest $request, Branch $branch): array
    {
        $catalogItem = $request->filled('catalog_item_uuid')
            ? CatalogItem::query()->where('uuid', $request->string('catalog_item_uuid'))->firstOrFail()
            : null;

        if ($catalogItem && $catalogItem->merchant_id !== $branch->merchant_id) {
            throw ValidationException::withMessages([
                'catalog_item_uuid' => 'The selected catalog item does not belong to the branch merchant.',
            ]);
        }

        $discountType = $request->string('discount_type')->toString();
        $requiresPromoCode = $request->boolean('requires_promo_code');

        return [
            'branch_id' => $branch->id,
            'catalog_item_id' => $catalogItem?->id,
            'code' => $requiresPromoCode ? $request->string('code')->trim()->upper()->toString() : null,
            'title' => $request->string('title')->toString(),
            'discount_label' => $request->string('discount_label')->toString(),
            'discount_type' => $discountType,
            'percent' => $discountType === 'item_percent' ? (int) $request->input('percent') : null,
            'amount_minor' => $discountType === 'item_fixed' ? (int) $request->input('amount_minor') : null,
            'min_spend_minor' => (int) ($request->input('min_spend_minor') ?? 0),
            'requires_promo_code' => $requiresPromoCode,
            'is_active' => $request->boolean('is_active', true),
            'starts_at' => $request->input('starts_at'),
            'expires_at' => $request->input('expires_at'),
        ];
    }

    private function ensureWriteAccess(Request $request, PromotionOffer $promotionOffer): void
    {
        $promotionOffer->loadMissing('branch.merchant');

        if ($request->is('api/v1/ops/*')) {
            $this->ensureAbility($request, 'ops:merchants.manage');

            return;
        }

        $this->ensureAbility($request, 'merchant:catalog.write');
        $this->authorize('update', $promotionOffer->branch->merchant);
    }

    private function recordAudit(Request $request, PromotionOffer $promotionOffer, string $message): void
    {
        $promotionOffer->loadMissing('branch');

        $this->recordAuditLogAction->execute(
            AuditActionType::CATALOG_UPDATED,
            $request->user(),
            $promotionOffer,
            $message,
            [
                'promotion_offer_uuid' => $promotionOffer->uuid,
                'branch_uuid' => $promotionOffer->branch?->uuid,
                'discount_type' => $promotionOffer->discount_type,
            ]
        );
    }
}
