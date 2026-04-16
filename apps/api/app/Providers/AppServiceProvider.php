<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Horizon\Horizon;
use Laravel\Sanctum\PersonalAccessToken;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Model::shouldBeStrict(! $this->app->isProduction());
        JsonResource::withoutWrapping();

        RateLimiter::for('customer-auth', function (Request $request) {
            return Limit::perMinute(5)->by(
                sprintf(
                    '%s|%s',
                    $request->ip(),
                    (string) $request->input('email', $request->input('phone', 'guest'))
                )
            );
        });

        Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);
        Gate::define('viewHorizon', fn ($user) => $user->hasAnyRole(['ops_admin', 'ops_support']));
        Horizon::auth(fn ($request) => $request->user()?->hasAnyRole(['ops_admin', 'ops_support']) ?? false);
    }
}
