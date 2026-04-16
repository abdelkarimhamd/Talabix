<?php

namespace App\Models;

use Spatie\Activitylog\Models\Activity;

class AuditLog extends Activity
{
    protected $table = 'audit_logs';

    public $guarded = [];
}
