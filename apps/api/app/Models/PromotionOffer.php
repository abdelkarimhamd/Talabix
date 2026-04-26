<?php

namespace App\Models;

use App\Modules\Shared\Concerns\HasPublicUuid;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $uuid
 * @property int $branch_id
 * @property int|null $catalog_item_id
 * @property string|null $code
 * @property string $title
 * @property string $discount_label
 * @property string $discount_type
 * @property int|null $percent
 * @property int|null $amount_minor
 * @property int $min_spend_minor
 * @property bool $requires_promo_code
 * @property bool $is_active
 * @property Carbon|null $starts_at
 * @property Carbon|null $expires_at
 * @property Branch $branch
 * @property CatalogItem|null $catalogItem
 */
class PromotionOffer extends Model
{
    /** @use HasFactory<Factory<PromotionOffer>> */
    use HasFactory;

    use HasPublicUuid;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'requires_promo_code' => 'boolean',
            'is_active' => 'boolean',
            'starts_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Branch, $this> */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /** @return BelongsTo<CatalogItem, $this> */
    public function catalogItem(): BelongsTo
    {
        return $this->belongsTo(CatalogItem::class);
    }
}
