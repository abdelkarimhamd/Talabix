<?php

namespace App\Modules\Shared\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Shared\Services\ReadinessCheckService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReadinessController extends Controller
{
    public function __invoke(Request $request, ReadinessCheckService $readiness): JsonResponse
    {
        $configuredKey = (string) config('services.readiness.key', '');

        if ($configuredKey !== '' && ! hash_equals($configuredKey, (string) $request->header('X-Talabix-Readiness-Key', ''))) {
            return response()->json([
                'message' => 'Invalid readiness check key.',
            ], 403);
        }

        if (app()->environment('production') && $configuredKey === '') {
            return response()->json([
                'checked_at' => now()->toISOString(),
                'status' => 'degraded',
                'checks' => [
                    'authorization' => [
                        'status' => 'fail',
                        'message' => 'READINESS_CHECK_KEY must be configured in production.',
                        'latency_ms' => 0.0,
                    ],
                ],
            ], 503);
        }

        $report = $readiness->report();

        return response()->json($report, $report['status'] === 'ready' ? 200 : 503);
    }
}
