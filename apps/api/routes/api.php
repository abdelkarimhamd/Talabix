<?php

use App\Modules\Shared\Controllers\ReadinessController;
use Illuminate\Support\Facades\Route;

Route::get('readiness', ReadinessController::class)->name('readiness');

require __DIR__.'/api/customer.php';
require __DIR__.'/api/merchant.php';
require __DIR__.'/api/rider.php';
require __DIR__.'/api/ops.php';
