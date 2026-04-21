<?php

namespace App\Models;

use App\Modules\Settlements\Enums\LedgerEntryType;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $order_id
 * @property int $merchant_id
 * @property int|null $rider_profile_id
 * @property LedgerEntryType $entry_type
 * @property int $amount_minor
 * @property string $currency
 * @property string|null $notes
 * @property Carbon|null $occurred_at
 * @property Order $order
 * @property Merchant $merchant
 * @property RiderProfile|null $riderProfile
 */
class LedgerEntry extends Model
{
    /** @use HasFactory<Factory<LedgerEntry>> */
    use HasFactory;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'entry_type' => LedgerEntryType::class,
            'occurred_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /** @return BelongsTo<Merchant, $this> */
    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }

    /** @return BelongsTo<RiderProfile, $this> */
    public function riderProfile(): BelongsTo
    {
        return $this->belongsTo(RiderProfile::class);
    }
}
