<?php

use App\Modules\Catalog\Controllers\CatalogController;
use App\Modules\Dispatch\Controllers\DispatchController;
use App\Modules\Identity\Controllers\AuthController;
use App\Modules\Identity\Controllers\OpsUserController;
use App\Modules\Merchants\Controllers\MerchantConfigurationController;
use App\Modules\Merchants\Controllers\MerchantController;
use App\Modules\Notifications\Controllers\NotificationController;
use App\Modules\Offers\Controllers\PromotionOfferController;
use App\Modules\Orders\Controllers\OrderController;
use App\Modules\Settlements\Controllers\SettlementController;
use App\Modules\Shared\Controllers\MapsProviderConfigurationController;
use App\Modules\Shared\Controllers\ReportingController;
use App\Modules\Support\Controllers\SupportController;
use Illuminate\Support\Facades\Route;

Route::prefix('ops')->name('ops.')->group(function () {
    Route::post('auth/login', [AuthController::class, 'opsLogin']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::patch('auth/password', [AuthController::class, 'changePassword']);
        Route::get('dashboard/overview', [ReportingController::class, 'opsOverview']);

        Route::get('users', [OpsUserController::class, 'index']);
        Route::post('users', [OpsUserController::class, 'store']);
        Route::patch('users/{user}', [OpsUserController::class, 'update']);

        Route::get('merchants', [MerchantController::class, 'indexForOps']);
        Route::post('merchants', [MerchantController::class, 'store']);
        Route::get('catalog/items', [CatalogController::class, 'index']);
        Route::post('catalog/items', [CatalogController::class, 'store']);
        Route::patch('catalog/items/{catalogItem}', [CatalogController::class, 'update']);
        Route::post('catalog/items/{catalogItem}/modifier-groups', [CatalogController::class, 'storeModifierGroup']);
        Route::patch(
            'catalog/items/{catalogItem}/modifier-groups/{modifierGroup}',
            [CatalogController::class, 'updateModifierGroup']
        );
        Route::post('branches/{branch}/catalog-overrides/{catalogItem}', [CatalogController::class, 'upsertBranchOverride']);
        Route::get('configuration/maps-provider', [MapsProviderConfigurationController::class, 'show']);
        Route::patch('configuration/maps-provider', [MapsProviderConfigurationController::class, 'update']);
        Route::get('configuration/merchants', [MerchantConfigurationController::class, 'index']);
        Route::get('configuration/merchants/{merchant}', [MerchantConfigurationController::class, 'show']);
        Route::patch('configuration/merchants/{merchant}', [MerchantConfigurationController::class, 'updateMerchant']);
        Route::patch('configuration/branches/{branch}', [MerchantConfigurationController::class, 'updateBranch']);
        Route::post('configuration/branches/{branch}/service-zones', [MerchantConfigurationController::class, 'storeServiceZone']);
        Route::patch('configuration/service-zones/{serviceZone}', [MerchantConfigurationController::class, 'updateServiceZone']);
        Route::post('configuration/branches/{branch}/fee-bands', [MerchantConfigurationController::class, 'storeFeeBand']);
        Route::patch('configuration/fee-bands/{feeBand}', [MerchantConfigurationController::class, 'updateFeeBand']);

        Route::get('promotion-offers', [PromotionOfferController::class, 'opsIndex']);
        Route::post('promotion-offers', [PromotionOfferController::class, 'opsStore']);
        Route::patch('promotion-offers/{promotionOffer}', [PromotionOfferController::class, 'update']);
        Route::delete('promotion-offers/{promotionOffer}', [PromotionOfferController::class, 'destroy']);

        Route::get('dispatch/orders', [DispatchController::class, 'board']);
        Route::get('dispatch/assignments', [DispatchController::class, 'assignments']);
        Route::post('dispatch/orders/{order}/reassign', [DispatchController::class, 'reassign']);

        Route::get('settlements/ledger', [SettlementController::class, 'index']);
        Route::get('settlements/export', [SettlementController::class, 'export']);
        Route::post('settlements/orders/{order}/adjustments', [SettlementController::class, 'storeAdjustment']);

        Route::get('notifications', [NotificationController::class, 'index']);
        Route::post('notifications/{notificationDelivery}/retry', [NotificationController::class, 'retry']);
        Route::get('support/orders/search', [SupportController::class, 'searchOrders']);
        Route::post('support/orders/{order}/cases', [SupportController::class, 'storeCase']);
        Route::patch('support/cases/{supportCase}', [SupportController::class, 'updateCase']);
        Route::post('support/orders/{order}/cancel', [SupportController::class, 'cancelOrder']);
        Route::post('support/orders/{order}/notes', [SupportController::class, 'storeNote']);

        Route::get('orders/{order}', [OrderController::class, 'show']);
    });
});
