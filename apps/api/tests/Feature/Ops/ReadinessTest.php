<?php

it('rejects readiness checks when the shared key is missing', function () {
    config(['services.readiness.key' => 'readiness-secret']);

    $this->getJson('/api/v1/readiness')
        ->assertForbidden()
        ->assertJsonPath('message', 'Invalid readiness check key.');
});

it('reports dependency readiness for monitoring', function () {
    config([
        'services.readiness.key' => 'readiness-secret',
        'broadcasting.default' => 'reverb',
        'broadcasting.connections.reverb.app_id' => 'talabix',
        'broadcasting.connections.reverb.key' => 'talabix-key',
        'broadcasting.connections.reverb.secret' => 'talabix-secret',
    ]);

    $this->getJson('/api/v1/readiness', [
        'X-Talabix-Readiness-Key' => 'readiness-secret',
    ])
        ->assertOk()
        ->assertJsonPath('status', 'ready')
        ->assertJsonPath('checks.database.status', 'ok')
        ->assertJsonPath('checks.cache.status', 'ok')
        ->assertJsonPath('checks.queue.status', 'ok')
        ->assertJsonPath('checks.reverb.status', 'ok')
        ->assertJsonStructure([
            'checked_at',
            'status',
            'checks' => [
                'database' => ['status', 'message', 'latency_ms'],
                'cache' => ['status', 'message', 'latency_ms'],
                'queue' => ['status', 'message', 'latency_ms'],
                'reverb' => ['status', 'message', 'latency_ms'],
            ],
        ]);
});
