<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promotion_offers', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('catalog_item_id')->nullable()->constrained()->nullOnDelete();
            $table->string('code')->nullable()->index();
            $table->string('title');
            $table->string('discount_label');
            $table->string('discount_type')->index();
            $table->unsignedInteger('percent')->nullable();
            $table->unsignedInteger('amount_minor')->nullable();
            $table->unsignedInteger('min_spend_minor')->default(0);
            $table->boolean('requires_promo_code')->default(false)->index();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->json('applied_offer_ids')->nullable()->after('pricing_snapshot');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('applied_offer_ids');
        });

        Schema::dropIfExists('promotion_offers');
    }
};
