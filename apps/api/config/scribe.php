<?php

$config = require __DIR__.'/../vendor/knuckleswtf/scribe/config/scribe.php';

$config['title'] = 'Talabix Delivery Marketplace API';
$config['description'] = 'Versioned actor-scoped API for Talabix marketplace clients.';
$config['base_url'] = config('app.url');
$config['auth']['enabled'] = true;
$config['auth']['default'] = true;
$config['auth']['extra_info'] = 'Authenticate with a Sanctum bearer token issued by the actor-specific login endpoints.';
$config['try_it_out']['enabled'] = true;
$config['routes'][0]['match']['prefixes'] = ['api/v1/*'];
$config['groups']['order'] = [
    'Identity',
    'Merchants',
    'Catalog',
    'Orders',
    'Dispatch',
    'Settlements',
    'Support',
];

return $config;
