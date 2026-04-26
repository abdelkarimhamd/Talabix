<?php

namespace App\Models;

use App\Modules\Shared\Concerns\HasPublicUuid;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $uuid
 * @property int $merchant_id
 * @property string $name
 * @property bool $is_active
 */
class CatalogItem extends Model
{
    /** @use HasFactory<Factory<CatalogItem>> */
    use HasFactory;

    use HasPublicUuid;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /** @return HasMany<BranchCatalogOverride, $this> */
    public function branchOverrides(): HasMany
    {
        return $this->hasMany(BranchCatalogOverride::class);
    }

    /** @return BelongsTo<Merchant, $this> */
    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }

    /** @return HasMany<CatalogItemModifierGroup, $this> */
    public function modifierGroups(): HasMany
    {
        return $this->hasMany(CatalogItemModifierGroup::class)->orderBy('sort_order')->orderBy('name');
    }
}
