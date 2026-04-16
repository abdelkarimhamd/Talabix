<?php

namespace App\Models;

use App\Modules\Identity\Enums\UserAccountStatus;
use App\Modules\Shared\Concerns\HasPublicUuid;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens;

    use HasFactory;
    use HasPublicUuid;
    use HasRoles;
    use Notifiable;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'account_status' => UserAccountStatus::class,
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function customerProfile(): HasOne
    {
        return $this->hasOne(CustomerProfile::class);
    }

    public function riderProfile(): HasOne
    {
        return $this->hasOne(RiderProfile::class);
    }

    public function merchantMemberships(): HasMany
    {
        return $this->hasMany(MerchantStaffMembership::class);
    }

    public function notificationDeliveries(): HasMany
    {
        return $this->hasMany(NotificationDelivery::class, 'recipient_user_id');
    }

    public function openedSupportCases(): HasMany
    {
        return $this->hasMany(SupportCase::class, 'opened_by_user_id');
    }

    public function resolvedSupportCases(): HasMany
    {
        return $this->hasMany(SupportCase::class, 'resolved_by_user_id');
    }
}
