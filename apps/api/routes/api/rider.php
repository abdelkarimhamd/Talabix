<?php

use App\Modules\Dispatch\Controllers\RiderStatusController;
use App\Modules\Identity\Controllers\AuthController;
use App\Modules\Notifications\Controllers\NotificationController;
use App\Modules\Orders\Controllers\OrderController;
use App\Modules\Shared\Controllers\ReportingController;
use Illuminate\Support\Facades\Route;

Route::prefix('rider')->name('rider.')->group(function () {
    Route::post('auth/login', [AuthController::class, 'riderLogin']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/logout', [AuthController::class, 'logout']);

        Route::post('availability', [RiderStatusController::class, 'updateAvailability']);
        Route::post('location', [RiderStatusController::class, 'updateLocation']);
        Route::get('earnings', [ReportingController::class, 'riderEarnings']);

        Route::get('notifications', [NotificationController::class, 'riderInbox']);
        Route::post('notifications/{notificationDelivery}/read', [NotificationController::class, 'riderMarkRead']);

        Route::get('assignments/current', [OrderController::class, 'riderAssignments']);
        Route::get('orders/{order}', [OrderController::class, 'show']);
        Route::post('orders/{order}/accept-assignment', [OrderController::class, 'riderAcceptAssignment']);
        Route::post('orders/{order}/picked-up', [OrderController::class, 'riderPickup']);
        Route::post('orders/{order}/delivered', [OrderController::class, 'riderDeliver']);
    });
});
