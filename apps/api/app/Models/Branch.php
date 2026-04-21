<?php

namespace App\Models;

use App\Modules\Shared\Concerns\HasPublicUuid;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Branch extends Model
{
    /** @use HasFactory<Factory<Branch>> */
    use HasFactory;

    use HasPublicUuid;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'accepts_orders' => 'boolean',
        ];
    }

    /** @return HasMany<BranchHour, $this> */
    public function hours(): HasMany
    {
        return $this->hasMany(BranchHour::class);
    }

    /** @return BelongsTo<Merchant, $this> */
    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }

    /** @return HasMany<BranchServiceZone, $this> */
    public function serviceZones(): HasMany
    {
        return $this->hasMany(BranchServiceZone::class);
    }

    /** @return HasMany<BranchFeeBand, $this> */
    public function feeBands(): HasMany
    {
        return $this->hasMany(BranchFeeBand::class);
    }

    /** @return HasMany<BranchCatalogOverride, $this> */
    public function catalogOverrides(): HasMany
    {
        return $this->hasMany(BranchCatalogOverride::class);
    }
}
