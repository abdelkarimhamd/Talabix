<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('delivery_assignments', function (Blueprint $table) {
            $table->json('proof_metadata')->nullable()->after('delivered_at');
            $table->timestamp('proof_captured_at')->nullable()->after('proof_metadata');
        });
    }

    public function down(): void
    {
        Schema::table('delivery_assignments', function (Blueprint $table) {
            $table->dropColumn(['proof_metadata', 'proof_captured_at']);
        });
    }
};
