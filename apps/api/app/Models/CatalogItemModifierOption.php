<?php

namespace App\Models;

use App\Modules\Shared\Concerns\HasPublicUuid;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CatalogItemModifierOption extends Model
{
    /** @use HasFactory<Factory<CatalogItemModifierOption>> */
    use HasFactory;

    use HasPublicUuid;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_default' => 'boolean',
        ];
    }

    /** @return BelongsTo<CatalogItemModifierGroup, $this> */
    public function modifierGroup(): BelongsTo
    {
        return $this->belongsTo(CatalogItemModifierGroup::class, 'modifier_group_id');
    }
}
