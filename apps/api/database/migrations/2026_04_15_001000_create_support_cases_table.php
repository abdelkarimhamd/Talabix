<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('support_cases', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete()->unique();
            $table->string('status');
            $table->string('issue_type');
            $table->string('summary');
            $table->string('cancellation_reason_code')->nullable();
            $table->string('resolution_type')->nullable();
            $table->text('resolution_notes')->nullable();
            $table->foreignId('opened_by_user_id')->constrained('users');
            $table->foreignId('resolved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('opened_at');
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('support_cases');
    }
};
