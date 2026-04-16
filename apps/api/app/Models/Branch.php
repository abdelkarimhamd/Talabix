<?php

namespace App\Models;

use App\Modules\Shared\Concerns\HasPublicUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Branch extends Model
{
    use HasFactory;
    use HasPublicUuid;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'accepts_orders' => 'boolean',
        ];
    }

    public function hours(): HasMany
    {
        return $this->hasMany(BranchHour::class);
    }

    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }

    public function serviceZones(): HasMany
    {
        return $this->hasMany(BranchServiceZone::class);
    }

    public function feeBands(): HasMany
    {
        return $this->hasMany(BranchFeeBand::class);
    }

    public function catalogOverrides(): HasMany
    {
        return $this->hasMany(BranchCatalogOverride::class);
    }
}
