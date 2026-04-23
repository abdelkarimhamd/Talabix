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
 * @property string $name
 * @property string $slug
 * @property string $status
 * @property int $platform_commission_bps
 * @property bool|null $is_open_now
 * @property bool|null $is_serviceable
 * @property int|null $serviceable_branch_count
 */
class Merchant extends Model
{
    /** @use HasFactory<Factory<Merchant>> */
    use HasFactory;

    use HasPublicUuid;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'platform_commission_bps' => 'integer',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    /** @return HasMany<Branch, $this> */
    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }

    /** @return HasMany<MerchantStaffMembership, $this> */
    public function staffMemberships(): HasMany
    {
        return $this->hasMany(MerchantStaffMembership::class);
    }

    /** @return HasMany<CatalogItem, $this> */
    public function catalogItems(): HasMany
    {
        return $this->hasMany(CatalogItem::class);
    }

    /** @return HasMany<CatalogCategory, $this> */
    public function catalogCategories(): HasMany
    {
        return $this->hasMany(CatalogCategory::class);
    }
}
