<?php

$config = require __DIR__.'/../vendor/laravel/reverb/config/reverb.php';

$config['apps']['apps'][0]['allowed_origins'] = [
    'http://localhost:5173',
    'http://localhost:8081',
    'exp://127.0.0.1:8081',
];

return $config;
