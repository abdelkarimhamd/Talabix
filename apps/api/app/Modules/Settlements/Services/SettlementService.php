<?php

namespace App\Modules\Settlements\Services;

use App\Models\LedgerEntry;
use App\Models\Order;
use App\Modules\Orders\Enums\OrderStatus;
use App\Modules\Settlements\Enums\LedgerEntryType;

class SettlementService
{
    public function createEntriesForOrder(Order $order): void
    {
        if ($order->status !== OrderStatus::DELIVERED) {
            return;
        }

        if (LedgerEntry::query()->where('order_id', $order->id)->exists()) {
            return;
        }

        $entries = [
            [
                'entry_type' => LedgerEntryType::MERCHANT_RECEIVABLE,
                'amount_minor' => $order->subtotal_minor + $order->delivery_fee_minor - $order->platform_commission_minor - $order->rider_earning_minor,
            ],
            [
                'entry_type' => LedgerEntryType::PLATFORM_COMMISSION,
                'amount_minor' => $order->platform_commission_minor,
            ],
            [
                'entry_type' => LedgerEntryType::RIDER_EARNING,
                'amount_minor' => $order->rider_earning_minor,
            ],
        ];

        foreach ($entries as $entry) {
            LedgerEntry::query()->create([
                'order_id' => $order->id,
                'merchant_id' => $order->merchant_id,
                'rider_profile_id' => $order->rider_profile_id,
                'entry_type' => $entry['entry_type'],
                'amount_minor' => $entry['amount_minor'],
                'currency' => $order->currency,
                'occurred_at' => now(),
                'notes' => 'Generated from delivered order.',
            ]);
        }
    }

    public function createAdjustment(Order $order, int $amountMinor, string $notes): LedgerEntry
    {
        return LedgerEntry::query()->create([
            'order_id' => $order->id,
            'merchant_id' => $order->merchant_id,
            'rider_profile_id' => $order->rider_profile_id,
            'entry_type' => LedgerEntryType::ADJUSTMENT,
            'amount_minor' => $amountMinor,
            'currency' => $order->currency,
            'occurred_at' => now(),
            'notes' => $notes,
        ]);
    }
}
