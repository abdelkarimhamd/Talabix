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
        Schema::create('catalog_categories', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('merchant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->unique(['merchant_id', 'name']);
        });

        $now = now();

        DB::table('catalog_items')
            ->whereNotNull('category_name')
            ->where('category_name', '<>', '')
            ->select('merchant_id', 'category_name')
            ->distinct()
            ->orderBy('merchant_id')
            ->orderBy('category_name')
            ->get()
            ->each(function (object $category) use ($now): void {
                DB::table('catalog_categories')->insertOrIgnore([
                    'uuid' => (string) Str::uuid(),
                    'merchant_id' => (int) data_get($category, 'merchant_id'),
                    'name' => (string) data_get($category, 'category_name'),
                    'description' => null,
                    'is_active' => true,
                    'sort_order' => 0,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('catalog_categories');
    }
};
