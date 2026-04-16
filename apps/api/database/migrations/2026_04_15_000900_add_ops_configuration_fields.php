<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('merchants', function (Blueprint $table) {
            $table->unsignedInteger('platform_commission_bps')->default(1200)->after('status');
        });

        Schema::table('branch_service_zones', function (Blueprint $table) {
            $table->uuid('uuid')->nullable()->after('id');
        });

        DB::table('branch_service_zones')
            ->whereNull('uuid')
            ->orderBy('id')
            ->get()
            ->each(fn ($zone) => DB::table('branch_service_zones')
                ->where('id', $zone->id)
                ->update(['uuid' => (string) Str::uuid()]));

        Schema::table('branch_service_zones', function (Blueprint $table) {
            $table->unique('uuid');
        });

        Schema::table('branch_fee_bands', function (Blueprint $table) {
            $table->uuid('uuid')->nullable()->after('id');
        });

        DB::table('branch_fee_bands')
            ->whereNull('uuid')
            ->orderBy('id')
            ->get()
            ->each(fn ($band) => DB::table('branch_fee_bands')
                ->where('id', $band->id)
                ->update(['uuid' => (string) Str::uuid()]));

        Schema::table('branch_fee_bands', function (Blueprint $table) {
            $table->unique('uuid');
        });
    }

    public function down(): void
    {
        Schema::table('branch_fee_bands', function (Blueprint $table) {
            $table->dropUnique(['uuid']);
            $table->dropColumn('uuid');
        });

        Schema::table('branch_service_zones', function (Blueprint $table) {
            $table->dropUnique(['uuid']);
            $table->dropColumn('uuid');
        });

        Schema::table('merchants', function (Blueprint $table) {
            $table->dropColumn('platform_commission_bps');
        });
    }
};
