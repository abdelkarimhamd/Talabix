<?php

namespace App\Modules\Shared\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Throwable;

class ReadinessCheckService
{
    /**
     * @return array<string, mixed>
     */
    public function report(): array
    {
        $checks = [
            'database' => $this->measure(fn () => $this->checkDatabase()),
            'cache' => $this->measure(fn () => $this->checkCache()),
            'queue' => $this->measure(fn () => $this->checkQueue()),
            'reverb' => $this->measure(fn () => $this->checkReverb()),
        ];

        return [
            'checked_at' => now()->toISOString(),
            'status' => collect($checks)->every(fn (array $check) => $check['status'] !== 'fail')
                ? 'ready'
                : 'degraded',
            'checks' => $checks,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function measure(callable $callback): array
    {
        $startedAt = microtime(true);

        try {
            $result = $callback();
        } catch (Throwable $exception) {
            $result = [
                'status' => 'fail',
                'message' => $exception->getMessage(),
            ];
        }

        return [
            'status' => $result['status'],
            'message' => $result['message'],
            'latency_ms' => round((microtime(true) - $startedAt) * 1000, 2),
            ...($result['metadata'] ?? []),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function checkDatabase(): array
    {
        DB::select('select 1');

        return [
            'status' => 'ok',
            'message' => 'Database connection accepted a simple query.',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function checkCache(): array
    {
        $key = 'readiness:'.bin2hex(random_bytes(6));

        Cache::put($key, 'ok', now()->addMinute());
        $value = Cache::get($key);
        Cache::forget($key);

        if ($value !== 'ok') {
            return [
                'status' => 'fail',
                'message' => 'Cache store did not return the readiness probe value.',
            ];
        }

        return [
            'status' => 'ok',
            'message' => 'Cache store accepted a write/read/delete probe.',
            'metadata' => [
                'store' => config('cache.default'),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function checkQueue(): array
    {
        $queueConnection = (string) config('queue.default', 'sync');

        if ($queueConnection === 'redis') {
            $redisConnection = (string) config('queue.connections.redis.connection', 'default');
            Redis::connection($redisConnection)->ping();
        }

        if ($queueConnection === 'database') {
            DB::table((string) config('queue.connections.database.table', 'jobs'))->limit(1)->count();
        }

        return [
            'status' => 'ok',
            'message' => 'Queue backend is reachable for the configured driver.',
            'metadata' => [
                'connection' => $queueConnection,
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function checkReverb(): array
    {
        if (config('broadcasting.default') !== 'reverb') {
            return [
                'status' => 'skip',
                'message' => 'Reverb is not the active broadcast connection.',
            ];
        }

        $config = config('broadcasting.connections.reverb', []);
        $missing = collect(['app_id', 'key', 'secret'])
            ->filter(fn (string $key) => blank($config[$key] ?? null))
            ->values();

        if ($missing->isNotEmpty()) {
            return [
                'status' => 'fail',
                'message' => 'Reverb configuration is missing required credentials: '.$missing->implode(', '),
            ];
        }

        return [
            'status' => 'ok',
            'message' => 'Reverb broadcast credentials are configured.',
            'metadata' => [
                'host' => $config['options']['host'] ?? null,
                'port' => $config['options']['port'] ?? null,
                'scheme' => $config['options']['scheme'] ?? null,
            ],
        ];
    }
}
