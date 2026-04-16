<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('catalog_items', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('merchant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('sku')->nullable();
            $table->text('description')->nullable();
            $table->unsignedInteger('base_price_minor');
            $table->unsignedInteger('base_stock')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('branch_catalog_overrides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('catalog_item_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('price_minor')->nullable();
            $table->unsignedInteger('stock_quantity')->nullable();
            $table->boolean('is_available')->default(true);
            $table->timestamps();
            $table->unique(['branch_id', 'catalog_item_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('branch_catalog_overrides');
        Schema::dropIfExists('catalog_items');
    }
};
