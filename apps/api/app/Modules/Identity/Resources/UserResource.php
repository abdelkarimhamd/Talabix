<?php

namespace App\Modules\Identity\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'account_status' => $this->account_status?->value ?? $this->account_status,
            'roles' => $this->getRoleNames()->values()->all(),
            'abilities' => $request->user()?->currentAccessToken()?->abilities ?? [],
        ];
    }
}
