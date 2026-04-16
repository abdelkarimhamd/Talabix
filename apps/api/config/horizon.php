<?php

$config = require __DIR__.'/../vendor/laravel/horizon/config/horizon.php';

$config['name'] = env('HORIZON_NAME', 'talabix-horizon');
$config['path'] = env('HORIZON_PATH', 'ops/horizon');
$config['middleware'] = ['web'];
$config['defaults']['supervisor-1']['queue'] = ['default', 'notifications', 'dispatch'];
$config['defaults']['supervisor-1']['tries'] = 1;
$config['defaults']['supervisor-1']['timeout'] = 120;
$config['environments']['local']['supervisor-1']['maxProcesses'] = 2;

return $config;
