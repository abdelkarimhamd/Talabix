<?php

namespace App\Providers;

use App\Models\CatalogItem;
use App\Models\Merchant;
use App\Models\Order;
use App\Models\SupportNote;
use App\Modules\Catalog\Policies\CatalogItemPolicy;
use App\Modules\Merchants\Policies\MerchantPolicy;
use App\Modules\Orders\Policies\OrderPolicy;
use App\Modules\Support\Policies\SupportNotePolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        CatalogItem::class => CatalogItemPolicy::class,
        Merchant::class => MerchantPolicy::class,
        Order::class => OrderPolicy::class,
        SupportNote::class => SupportNotePolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();
    }
}
