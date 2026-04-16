<?php

namespace App\Modules\Support\Policies;

use App\Models\SupportNote;
use App\Models\User;

class SupportNotePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['ops_admin', 'ops_dispatcher', 'ops_support']);
    }

    public function create(User $user): bool
    {
        return $this->viewAny($user);
    }
}
