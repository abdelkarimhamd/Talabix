<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('merchants', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('status')->default('active')->index();
            $table->timestamps();
        });

        Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('merchant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('status')->default('active')->index();
            $table->string('city');
            $table->string('address_line');
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->boolean('accepts_orders')->default(true);
            $table->timestamps();
        });

        Schema::create('merchant_staff_memberships', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('merchant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('membership_role');
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('branch_hours', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('day_of_week');
            $table->time('opens_at')->nullable();
            $table->time('closes_at')->nullable();
            $table->boolean('is_closed')->default(false);
        });

        Schema::create('branch_service_zones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('city');
            $table->string('postal_code')->nullable();
            $table->decimal('center_latitude', 10, 7);
            $table->decimal('center_longitude', 10, 7);
            $table->unsignedInteger('radius_meters');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('branch_fee_bands', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('min_distance_meters');
            $table->unsignedInteger('max_distance_meters');
            $table->unsignedInteger('fee_minor');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('branch_fee_bands');
        Schema::dropIfExists('branch_service_zones');
        Schema::dropIfExists('branch_hours');
        Schema::dropIfExists('merchant_staff_memberships');
        Schema::dropIfExists('branches');
        Schema::dropIfExists('merchants');
    }
};
