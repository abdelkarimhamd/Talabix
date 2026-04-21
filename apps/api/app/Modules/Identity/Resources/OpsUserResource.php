<?php

namespace App\Modules\Identity\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
class OpsUserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'account_status' => $this->account_status->value,
            'roles' => $this->getRoleNames()->values()->all(),
            'created_at' => $this->created_at?->toISOString(),
            'last_login_at' => $this->last_login_at?->toISOString(),
        ];
    }
}
