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
 * @property string $status
 * @property string $city
 * @property string $address_line
 * @property string|float $latitude
 * @property string|float $longitude
 * @property bool $accepts_orders
 * @property bool|null $is_open_now
 * @property array<string, mixed>|null $today_hours
 * @property array<string, mixed>|null $serviceability
 */
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
