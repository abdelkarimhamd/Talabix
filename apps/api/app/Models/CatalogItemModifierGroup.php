<?php

namespace App\Models;

use App\Modules\Shared\Concerns\HasPublicUuid;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CatalogItemModifierGroup extends Model
{
    /** @use HasFactory<Factory<CatalogItemModifierGroup>> */
    use HasFactory;

    use HasPublicUuid;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /** @return BelongsTo<CatalogItem, $this> */
    public function catalogItem(): BelongsTo
    {
        return $this->belongsTo(CatalogItem::class);
    }

    /** @return HasMany<CatalogItemModifierOption, $this> */
    public function options(): HasMany
    {
        return $this->hasMany(CatalogItemModifierOption::class, 'modifier_group_id')
            ->orderBy('sort_order')
            ->orderBy('name');
    }
}
