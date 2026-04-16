<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('catalog_items', function (Blueprint $table) {
            $table->string('category_name')->nullable()->after('merchant_id');
            $table->text('image_url')->nullable()->after('description');
        });

        Schema::create('catalog_item_modifier_groups', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('catalog_item_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('selection_type')->default('single');
            $table->unsignedInteger('min_selected')->default(0);
            $table->unsignedInteger('max_selected')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('catalog_item_modifier_options', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('modifier_group_id')->constrained('catalog_item_modifier_groups')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedInteger('price_delta_minor')->default(0);
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('catalog_item_modifier_options');
        Schema::dropIfExists('catalog_item_modifier_groups');

        Schema::table('catalog_items', function (Blueprint $table) {
            $table->dropColumn(['category_name', 'image_url']);
        });
    }
};
