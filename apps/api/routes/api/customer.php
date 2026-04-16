<?php

use App\Modules\Catalog\Controllers\CatalogController;
use App\Modules\Identity\Controllers\AuthController;
use App\Modules\Merchants\Controllers\MerchantController;
use App\Modules\Notifications\Controllers\NotificationController;
use App\Modules\Orders\Controllers\CustomerAddressController;
use App\Modules\Orders\Controllers\OrderController;
use App\Modules\Shared\Controllers\MapsController;
use Illuminate\Support\Facades\Route;

Route::prefix('customer')->name('customer.')->group(function () {
    Route::post('auth/register', [AuthController::class, 'customerRegister'])->middleware('throttle:customer-auth');
    Route::post('auth/login', [AuthController::class, 'customerLogin'])->middleware('throttle:customer-auth');
    Route::post('auth/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:customer-auth');
    Route::post('auth/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:customer-auth');

    Route::get('merchants', [MerchantController::class, 'publicIndex']);
    Route::get('merchants/{merchant}', [MerchantController::class, 'publicShow']);
    Route::get('branches/{branch}/catalog', [CatalogController::class, 'branchCatalog']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::patch('auth/me', [AuthController::class, 'updateCustomerProfile']);
        Route::post('auth/logout', [AuthController::class, 'logout']);

        Route::get('addresses', [CustomerAddressController::class, 'index']);
        Route::post('addresses', [CustomerAddressController::class, 'store']);
        Route::patch('addresses/{address}', [CustomerAddressController::class, 'update']);
        Route::get('maps/places', [MapsController::class, 'customerPlaces']);

        Route::get('notifications', [NotificationController::class, 'customerInbox']);
        Route::post('notifications/{notificationDelivery}/read', [NotificationController::class, 'customerMarkRead']);

        Route::get('orders', [OrderController::class, 'customerIndex']);
        Route::post('orders/checkout', [OrderController::class, 'checkout']);
        Route::get('orders/{order}', [OrderController::class, 'show']);
    });
});
