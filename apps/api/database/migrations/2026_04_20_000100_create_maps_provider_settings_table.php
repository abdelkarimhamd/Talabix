<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('maps_provider_settings', function (Blueprint $table) {
            $table->id();
            $table->string('provider')->default('google_maps');
            $table->text('google_maps_api_key')->nullable();
            $table->string('google_maps_region')->default('sa');
            $table->string('google_maps_location_bias')->nullable()->default('circle:50000@24.7136,46.6753');
            $table->decimal('google_maps_timeout_seconds', 5, 2)->default(2.50);
            $table->boolean('google_maps_fallback_to_demo')->default(true);
            $table->foreignId('configured_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maps_provider_settings');
    }
};
