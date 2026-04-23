<?php

use App\Modules\Catalog\Controllers\CatalogController;
use App\Modules\Identity\Controllers\AuthController;
use App\Modules\Merchants\Controllers\MerchantController;
use App\Modules\Notifications\Controllers\NotificationController;
use App\Modules\Offers\Controllers\PromotionOfferController;
use App\Modules\Orders\Controllers\OrderController;
use App\Modules\Shared\Controllers\ReportingController;
use Illuminate\Support\Facades\Route;

Route::prefix('merchant')->name('merchant.')->group(function () {
    Route::post('auth/login', [AuthController::class, 'merchantLogin']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/logout', [AuthController::class, 'logout']);

        Route::get('me/merchants', [MerchantController::class, 'mine']);
        Route::get('notifications', [NotificationController::class, 'merchantInbox']);
        Route::post('notifications/{notificationDelivery}/read', [NotificationController::class, 'merchantMarkRead']);
        Route::get('reports/sales', [ReportingController::class, 'merchantSales']);

        Route::get('catalog/categories', [CatalogController::class, 'categories']);
        Route::post('catalog/categories', [CatalogController::class, 'storeCategory']);
        Route::patch('catalog/categories/{catalogCategory}', [CatalogController::class, 'updateCategory']);
        Route::delete('catalog/categories/{catalogCategory}', [CatalogController::class, 'destroyCategory']);
        Route::get('catalog/items', [CatalogController::class, 'index']);
        Route::post('catalog/items', [CatalogController::class, 'store']);
        Route::patch('catalog/items/{catalogItem}', [CatalogController::class, 'update']);
        Route::post('catalog/items/{catalogItem}/modifier-groups', [CatalogController::class, 'storeModifierGroup']);
        Route::patch(
            'catalog/items/{catalogItem}/modifier-groups/{modifierGroup}',
            [CatalogController::class, 'updateModifierGroup']
        );
        Route::post('branches/{branch}/catalog-overrides/{catalogItem}', [CatalogController::class, 'upsertBranchOverride']);

        Route::get('promotion-offers', [PromotionOfferController::class, 'merchantIndex']);
        Route::post('promotion-offers', [PromotionOfferController::class, 'merchantStore']);
        Route::patch('promotion-offers/{promotionOffer}', [PromotionOfferController::class, 'update']);
        Route::delete('promotion-offers/{promotionOffer}', [PromotionOfferController::class, 'destroy']);

        Route::get('branches/{branch}/orders', [OrderController::class, 'merchantBoard']);
        Route::post('orders/{order}/accept', [OrderController::class, 'merchantAccept']);
        Route::post('orders/{order}/reject', [OrderController::class, 'merchantReject']);
        Route::post('orders/{order}/start-preparing', [OrderController::class, 'merchantStartPreparing']);
        Route::post('orders/{order}/ready-for-pickup', [OrderController::class, 'merchantReadyForPickup']);
        Route::get('orders/{order}', [OrderController::class, 'show']);
    });
});
