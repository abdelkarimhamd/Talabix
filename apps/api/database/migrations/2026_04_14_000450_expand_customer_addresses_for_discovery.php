<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customer_addresses', function (Blueprint $table) {
            $table->string('building')->nullable()->after('line_2');
            $table->string('floor')->nullable()->after('building');
            $table->string('apartment')->nullable()->after('floor');
            $table->string('landmark')->nullable()->after('apartment');
            $table->text('delivery_notes')->nullable()->after('landmark');
        });
    }

    public function down(): void
    {
        Schema::table('customer_addresses', function (Blueprint $table) {
            $table->dropColumn([
                'building',
                'floor',
                'apartment',
                'landmark',
                'delivery_notes',
            ]);
        });
    }
};
