<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('branch_service_zones')
            ->whereNull('uuid')
            ->orderBy('id')
            ->get(['id'])
            ->each(fn ($zone) => DB::table('branch_service_zones')
                ->where('id', $zone->id)
                ->update(['uuid' => (string) Str::uuid()]));

        DB::table('branch_fee_bands')
            ->whereNull('uuid')
            ->orderBy('id')
            ->get(['id'])
            ->each(fn ($band) => DB::table('branch_fee_bands')
                ->where('id', $band->id)
                ->update(['uuid' => (string) Str::uuid()]));
    }

    public function down(): void
    {
        // Public UUID backfills are intentionally irreversible.
    }
};
