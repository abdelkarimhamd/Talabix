<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property string $provider
 * @property string|null $google_maps_api_key
 * @property string|null $google_maps_region
 * @property string|null $google_maps_location_bias
 * @property float|null $google_maps_timeout_seconds
 * @property bool|null $google_maps_fallback_to_demo
 * @property int|null $configured_by_user_id
 */
class MapsProviderSetting extends Model
{
    /** @use HasFactory<Factory<MapsProviderSetting>> */
    use HasFactory;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'google_maps_api_key' => 'encrypted',
            'google_maps_timeout_seconds' => 'float',
            'google_maps_fallback_to_demo' => 'boolean',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function configuredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'configured_by_user_id');
    }
}
