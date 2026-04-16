<?php

$config = require __DIR__.'/../vendor/spatie/laravel-permission/config/permission.php';

$config['enable_wildcard_permission'] = false;
$config['cache']['key'] = 'talabix.permission.cache';

return $config;
