<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notification_deliveries', function (Blueprint $table) {
            $table->string('provider', 40)->nullable()->after('channel');
            $table->string('provider_reference', 160)->nullable()->after('provider');
            $table->unsignedSmallInteger('attempt_count')->default(0)->after('provider_reference');
            $table->timestamp('last_attempted_at')->nullable()->after('attempt_count');
            $table->timestamp('next_retry_at')->nullable()->after('last_attempted_at');
            $table->text('last_error')->nullable()->after('next_retry_at');

            $table->index(['status', 'next_retry_at']);
        });
    }

    public function down(): void
    {
        Schema::table('notification_deliveries', function (Blueprint $table) {
            $table->dropIndex(['status', 'next_retry_at']);
            $table->dropColumn([
                'provider',
                'provider_reference',
                'attempt_count',
                'last_attempted_at',
                'next_retry_at',
                'last_error',
            ]);
        });
    }
};
