<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $day_of_week
 * @property string|null $opens_at
 * @property string|null $closes_at
 * @property bool $is_closed
 */
class BranchHour extends Model
{
    /** @use HasFactory<Factory<BranchHour>> */
    use HasFactory;

    protected $guarded = [];

    public $timestamps = false;
}
