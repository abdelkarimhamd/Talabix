<?php

namespace App\Modules\Support\Policies;

use App\Models\SupportCase;
use App\Models\User;

class SupportCasePolicy
{
    public function view(User $user, SupportCase $supportCase): bool
    {
        return $user->hasAnyRole(['ops_admin', 'ops_dispatcher', 'ops_support']);
    }

    public function update(User $user, SupportCase $supportCase): bool
    {
        return $this->view($user, $supportCase);
    }
}
