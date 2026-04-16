<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Http\Request;

abstract class Controller
{
    use AuthorizesRequests;
    use ValidatesRequests;

    protected function ensureAbility(Request $request, string $ability): void
    {
        abort_unless($request->user()?->tokenCan($ability) ?? false, 403, sprintf(
            'Missing required token ability [%s].',
            $ability
        ));
    }
}
