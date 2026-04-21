<?php

namespace App\Models;

use App\Modules\Dispatch\Enums\RiderAvailability;
use App\Modules\Shared\Concerns\HasPublicUuid;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property RiderAvailability $availability
 */
class RiderProfile extends Model
{
    /** @use HasFactory<Factory<RiderProfile>> */
    use HasFactory;

    use HasPublicUuid;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'availability' => RiderAvailability::class,
        ];
    }

    /** @return HasMany<RiderLocation, $this> */
    public function locations(): HasMany
    {
        return $this->hasMany(RiderLocation::class);
    }

    /** @return HasMany<DeliveryAssignment, $this> */
    public function assignments(): HasMany
    {
        return $this->hasMany(DeliveryAssignment::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
