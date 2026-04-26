<?php

namespace App\Models;

use App\Modules\Shared\Concerns\HasPublicUuid;
use App\Modules\Support\Enums\OrderCancellationReasonCode;
use App\Modules\Support\Enums\SupportCaseStatus;
use App\Modules\Support\Enums\SupportIssueType;
use App\Modules\Support\Enums\SupportResolutionType;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property SupportCaseStatus $status
 * @property SupportIssueType $issue_type
 * @property OrderCancellationReasonCode|null $cancellation_reason_code
 * @property SupportResolutionType|null $resolution_type
 * @property Carbon|null $opened_at
 * @property Carbon|null $resolved_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class SupportCase extends Model
{
    /** @use HasFactory<Factory<SupportCase>> */
    use HasFactory;

    use HasPublicUuid;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'status' => SupportCaseStatus::class,
            'issue_type' => SupportIssueType::class,
            'cancellation_reason_code' => OrderCancellationReasonCode::class,
            'resolution_type' => SupportResolutionType::class,
            'opened_at' => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /** @return BelongsTo<User, $this> */
    public function openedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'opened_by_user_id');
    }

    /** @return BelongsTo<User, $this> */
    public function resolvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by_user_id');
    }
}
