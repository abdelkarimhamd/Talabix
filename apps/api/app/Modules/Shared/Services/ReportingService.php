<?php

namespace App\Modules\Shared\Services;

use App\Models\Branch;
use App\Models\LedgerEntry;
use App\Models\Merchant;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\RiderProfile;
use App\Modules\Dispatch\Enums\RiderAvailability;
use App\Modules\Orders\Enums\OrderStatus;
use App\Modules\Settlements\Enums\LedgerEntryType;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class ReportingService
{
    /**
     * @return array<string, mixed>
     */
    public function merchantSales(Merchant $merchant, int $rangeDays = 7): array
    {
        [$startsAt, $endsAt] = $this->resolveRange($rangeDays);

        $orders = Order::query()
            ->with(['branch', 'items'])
            ->where('merchant_id', $merchant->id)
            ->whereBetween('placed_at', [$startsAt, $endsAt])
            ->orderBy('placed_at')
            ->get();

        $nonCancelledOrders = $orders->reject(
            fn (Order $order) => $this->orderStatus($order) === OrderStatus::CANCELLED->value
        );
        $deliveredOrders = $orders->filter(
            fn (Order $order) => $this->orderStatus($order) === OrderStatus::DELIVERED->value
        );
        $cancelledOrders = $orders->filter(
            fn (Order $order) => $this->orderStatus($order) === OrderStatus::CANCELLED->value
        );
        $activeOrders = $orders->filter(
            fn (Order $order) => ! in_array(
                $this->orderStatus($order),
                [OrderStatus::DELIVERED->value, OrderStatus::CANCELLED->value],
                true
            )
        );

        $dailySales = $this->seedDateBuckets($startsAt, $endsAt, [
            'orders_count' => 0,
            'delivered_orders' => 0,
            'gross_sales_minor' => 0,
            'completed_sales_minor' => 0,
        ]);

        foreach ($orders as $order) {
            $date = $order->placed_at?->toDateString();

            if (! $date || ! isset($dailySales[$date])) {
                continue;
            }

            $dailySales[$date]['orders_count']++;

            if ($this->orderStatus($order) === OrderStatus::DELIVERED->value) {
                $dailySales[$date]['delivered_orders']++;
                $dailySales[$date]['completed_sales_minor'] += $order->subtotal_minor;
            }

            if ($this->orderStatus($order) !== OrderStatus::CANCELLED->value) {
                $dailySales[$date]['gross_sales_minor'] += $order->subtotal_minor;
            }
        }

        $branchBreakdown = $orders
            ->groupBy('branch_id')
            ->map(function (Collection $branchOrders) {
                /** @var Order $firstOrder */
                $firstOrder = $branchOrders->first();

                return [
                    'branch_uuid' => data_get($firstOrder->branch, 'uuid'),
                    'branch_name' => data_get($firstOrder->branch, 'name', 'Unknown branch'),
                    'total_orders' => $branchOrders->count(),
                    'delivered_orders' => $branchOrders
                        ->filter(fn (Order $order) => $this->orderStatus($order) === OrderStatus::DELIVERED->value)
                        ->count(),
                    'cancelled_orders' => $branchOrders
                        ->filter(fn (Order $order) => $this->orderStatus($order) === OrderStatus::CANCELLED->value)
                        ->count(),
                    'gross_sales_minor' => $branchOrders
                        ->reject(fn (Order $order) => $this->orderStatus($order) === OrderStatus::CANCELLED->value)
                        ->sum('subtotal_minor'),
                    'completed_sales_minor' => $branchOrders
                        ->filter(fn (Order $order) => $this->orderStatus($order) === OrderStatus::DELIVERED->value)
                        ->sum('subtotal_minor'),
                ];
            })
            ->sortByDesc('gross_sales_minor')
            ->values()
            ->all();

        $topItems = $nonCancelledOrders
            ->flatMap(fn (Order $order) => $order->items)
            ->groupBy(fn (OrderItem $item) => (string) data_get($item->item_snapshot, 'name', 'Unknown item'))
            ->map(function (Collection $items, string $itemName) {
                return [
                    'item_name' => $itemName,
                    'quantity_sold' => $items->sum('quantity'),
                    'gross_sales_minor' => $items->sum('line_total_minor'),
                ];
            })
            ->sortByDesc('quantity_sold')
            ->take(5)
            ->values()
            ->all();

        return [
            'merchant' => [
                'uuid' => $merchant->uuid,
                'name' => $merchant->name,
                'slug' => $merchant->slug,
                'status' => $merchant->status,
            ],
            'range' => $this->rangeMeta($startsAt, $endsAt, $rangeDays),
            'summary' => [
                'total_orders' => $orders->count(),
                'active_orders' => $activeOrders->count(),
                'delivered_orders' => $deliveredOrders->count(),
                'cancelled_orders' => $cancelledOrders->count(),
                'gross_sales_minor' => $nonCancelledOrders->sum('subtotal_minor'),
                'completed_sales_minor' => $deliveredOrders->sum('subtotal_minor'),
                'delivery_fees_minor' => $nonCancelledOrders->sum('delivery_fee_minor'),
                'average_order_value_minor' => $nonCancelledOrders->count() > 0
                    ? (int) round($nonCancelledOrders->avg('subtotal_minor'))
                    : 0,
                'currency' => data_get($orders->first(), 'currency', 'SAR'),
            ],
            'daily_sales' => array_values($dailySales),
            'branch_breakdown' => $branchBreakdown,
            'top_items' => $topItems,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function opsOverview(int $rangeDays = 7): array
    {
        [$startsAt, $endsAt] = $this->resolveRange($rangeDays);

        $orders = Order::query()
            ->with(['merchant', 'branch', 'items'])
            ->whereBetween('placed_at', [$startsAt, $endsAt])
            ->orderBy('placed_at')
            ->get();

        $ledgerEntries = LedgerEntry::query()
            ->with(['merchant', 'riderProfile.user'])
            ->whereBetween('occurred_at', [$startsAt, $endsAt])
            ->orderBy('occurred_at')
            ->get();

        $dailyOrders = $this->seedDateBuckets($startsAt, $endsAt, [
            'total_orders' => 0,
            'delivered_orders' => 0,
            'cancelled_orders' => 0,
            'gross_sales_minor' => 0,
            'completed_sales_minor' => 0,
        ]);

        foreach ($orders as $order) {
            $date = $order->placed_at?->toDateString();

            if (! $date || ! isset($dailyOrders[$date])) {
                continue;
            }

            $dailyOrders[$date]['total_orders']++;

            if ($this->orderStatus($order) === OrderStatus::DELIVERED->value) {
                $dailyOrders[$date]['delivered_orders']++;
                $dailyOrders[$date]['completed_sales_minor'] += $order->subtotal_minor;
            }

            if ($this->orderStatus($order) === OrderStatus::CANCELLED->value) {
                $dailyOrders[$date]['cancelled_orders']++;
            }

            if ($this->orderStatus($order) !== OrderStatus::CANCELLED->value) {
                $dailyOrders[$date]['gross_sales_minor'] += $order->subtotal_minor;
            }
        }

        $merchantSales = $orders
            ->groupBy('merchant_id')
            ->map(function (Collection $merchantOrders) {
                /** @var Order $firstOrder */
                $firstOrder = $merchantOrders->first();

                return [
                    'merchant_uuid' => data_get($firstOrder->merchant, 'uuid'),
                    'merchant_name' => data_get($firstOrder->merchant, 'name', 'Unknown merchant'),
                    'total_orders' => $merchantOrders->count(),
                    'delivered_orders' => $merchantOrders
                        ->filter(fn (Order $order) => $this->orderStatus($order) === OrderStatus::DELIVERED->value)
                        ->count(),
                    'gross_sales_minor' => $merchantOrders
                        ->reject(fn (Order $order) => $this->orderStatus($order) === OrderStatus::CANCELLED->value)
                        ->sum('subtotal_minor'),
                    'completed_sales_minor' => $merchantOrders
                        ->filter(fn (Order $order) => $this->orderStatus($order) === OrderStatus::DELIVERED->value)
                        ->sum('subtotal_minor'),
                ];
            })
            ->sortByDesc('gross_sales_minor')
            ->values()
            ->all();

        $riderEarningRows = $ledgerEntries
            ->filter(fn (LedgerEntry $entry) => $this->ledgerEntryType($entry) === LedgerEntryType::RIDER_EARNING->value)
            ->groupBy('rider_profile_id')
            ->map(function (Collection $entries) {
                /** @var LedgerEntry $firstEntry */
                $firstEntry = $entries->first();
                $deliveriesCount = $entries->pluck('order_id')->filter()->unique()->count();
                $earningsMinor = $entries->sum('amount_minor');

                return [
                    'rider_uuid' => data_get($firstEntry->riderProfile, 'uuid'),
                    'rider_name' => data_get($firstEntry->riderProfile, 'user.name', 'Unknown rider'),
                    'deliveries_count' => $deliveriesCount,
                    'earnings_minor' => $earningsMinor,
                    'average_per_delivery_minor' => $deliveriesCount > 0
                        ? (int) round($earningsMinor / $deliveriesCount)
                        : 0,
                ];
            })
            ->sortByDesc('earnings_minor')
            ->values();

        $orderStatusBreakdown = collect(OrderStatus::cases())
            ->map(fn (OrderStatus $status) => [
                'status' => $status->value,
                'count' => $orders->filter(fn (Order $order) => $this->orderStatus($order) === $status->value)->count(),
            ])
            ->values()
            ->all();

        $financialsByType = $ledgerEntries
            ->groupBy(fn (LedgerEntry $entry) => $this->ledgerEntryType($entry))
            ->map(fn (Collection $entries) => $entries->sum('amount_minor'));

        return [
            'range' => $this->rangeMeta($startsAt, $endsAt, $rangeDays),
            'kpis' => [
                'total_orders' => $orders->count(),
                'active_orders' => $orders
                    ->filter(fn (Order $order) => ! in_array(
                        $this->orderStatus($order),
                        [OrderStatus::DELIVERED->value, OrderStatus::CANCELLED->value],
                        true
                    ))
                    ->count(),
                'delivered_orders' => $orders
                    ->filter(fn (Order $order) => $this->orderStatus($order) === OrderStatus::DELIVERED->value)
                    ->count(),
                'cancelled_orders' => $orders
                    ->filter(fn (Order $order) => $this->orderStatus($order) === OrderStatus::CANCELLED->value)
                    ->count(),
                'gross_sales_minor' => $orders
                    ->reject(fn (Order $order) => $this->orderStatus($order) === OrderStatus::CANCELLED->value)
                    ->sum('subtotal_minor'),
                'completed_sales_minor' => $orders
                    ->filter(fn (Order $order) => $this->orderStatus($order) === OrderStatus::DELIVERED->value)
                    ->sum('subtotal_minor'),
                'delivery_fees_minor' => $orders
                    ->reject(fn (Order $order) => $this->orderStatus($order) === OrderStatus::CANCELLED->value)
                    ->sum('delivery_fee_minor'),
                'active_merchants' => Merchant::query()->where('status', 'active')->count(),
                'accepting_branches' => Branch::query()
                    ->where('status', 'active')
                    ->where('accepts_orders', true)
                    ->count(),
                'available_riders' => RiderProfile::query()
                    ->where('availability', RiderAvailability::AVAILABLE->value)
                    ->count(),
                'busy_riders' => RiderProfile::query()
                    ->where('availability', RiderAvailability::BUSY->value)
                    ->count(),
                'offline_riders' => RiderProfile::query()
                    ->whereIn('availability', [
                        RiderAvailability::OFFLINE->value,
                        RiderAvailability::PAUSED->value,
                    ])
                    ->count(),
            ],
            'financials' => [
                'merchant_receivable_minor' => $financialsByType->get(LedgerEntryType::MERCHANT_RECEIVABLE->value, 0),
                'platform_commission_minor' => $financialsByType->get(LedgerEntryType::PLATFORM_COMMISSION->value, 0),
                'rider_earning_minor' => $financialsByType->get(LedgerEntryType::RIDER_EARNING->value, 0),
                'adjustment_minor' => $financialsByType->get(LedgerEntryType::ADJUSTMENT->value, 0),
                'net_platform_minor' => $financialsByType->get(LedgerEntryType::PLATFORM_COMMISSION->value, 0)
                    + $financialsByType->get(LedgerEntryType::ADJUSTMENT->value, 0),
                'currency' => data_get($ledgerEntries->first(), 'currency', data_get($orders->first(), 'currency', 'SAR')),
            ],
            'order_status_breakdown' => $orderStatusBreakdown,
            'daily_orders' => array_values($dailyOrders),
            'merchant_sales' => $merchantSales,
            'rider_earnings' => [
                'total_earnings_minor' => $riderEarningRows->sum('earnings_minor'),
                'total_deliveries' => $riderEarningRows->sum('deliveries_count'),
                'average_per_delivery_minor' => $riderEarningRows->sum('deliveries_count') > 0
                    ? (int) round($riderEarningRows->sum('earnings_minor') / $riderEarningRows->sum('deliveries_count'))
                    : 0,
                'riders' => $riderEarningRows->all(),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function riderEarnings(RiderProfile $riderProfile, int $rangeDays = 7): array
    {
        [$startsAt, $endsAt] = $this->resolveRange($rangeDays);

        $entries = LedgerEntry::query()
            ->with(['order.merchant', 'order.branch'])
            ->where('rider_profile_id', $riderProfile->id)
            ->where('entry_type', LedgerEntryType::RIDER_EARNING->value)
            ->whereBetween('occurred_at', [$startsAt, $endsAt])
            ->orderByDesc('occurred_at')
            ->orderByDesc('id')
            ->get();

        $dailyEarnings = $this->seedDateBuckets($startsAt, $endsAt, [
            'deliveries_count' => 0,
            'earnings_minor' => 0,
        ]);

        foreach ($entries as $entry) {
            $date = $entry->occurred_at?->toDateString();

            if (! $date || ! isset($dailyEarnings[$date])) {
                continue;
            }

            $dailyEarnings[$date]['earnings_minor'] += $entry->amount_minor;

            if ($entry->order_id) {
                $dailyEarnings[$date]['deliveries_count']++;
            }
        }

        $deliveriesCount = $entries->pluck('order_id')->filter()->unique()->count();
        $earningsMinor = $entries->sum('amount_minor');

        return [
            'rider' => [
                'uuid' => $riderProfile->uuid,
                'name' => data_get($riderProfile->user, 'name', 'Unknown rider'),
                'availability' => $riderProfile->availability->value,
            ],
            'range' => $this->rangeMeta($startsAt, $endsAt, $rangeDays),
            'summary' => [
                'deliveries_count' => $deliveriesCount,
                'earnings_minor' => $earningsMinor,
                'average_per_delivery_minor' => $deliveriesCount > 0
                    ? (int) round($earningsMinor / $deliveriesCount)
                    : 0,
                'currency' => data_get($entries->first(), 'currency', 'SAR'),
            ],
            'daily_earnings' => array_values($dailyEarnings),
            'orders' => $entries
                ->map(fn (LedgerEntry $entry) => [
                    'order_uuid' => $entry->order->uuid,
                    'merchant_name' => data_get($entry->order, 'merchant.name', 'Unknown merchant'),
                    'branch_name' => data_get($entry->order, 'branch.name', 'Unknown branch'),
                    'delivered_at' => $entry->order->delivered_at?->toIso8601String(),
                    'occurred_at' => $entry->occurred_at?->toIso8601String(),
                    'earning_minor' => $entry->amount_minor,
                    'currency' => $entry->currency,
                ])
                ->values()
                ->all(),
        ];
    }

    /**
     * @return array{0: CarbonImmutable, 1: CarbonImmutable}
     */
    private function resolveRange(int $rangeDays): array
    {
        $endsAt = CarbonImmutable::now()->endOfDay();
        $startsAt = $endsAt->subDays($rangeDays - 1)->startOfDay();

        return [$startsAt, $endsAt];
    }

    /**
     * @return array<string, mixed>
     */
    private function rangeMeta(CarbonImmutable $startsAt, CarbonImmutable $endsAt, int $rangeDays): array
    {
        return [
            'range_days' => $rangeDays,
            'starts_at' => $startsAt->toIso8601String(),
            'ends_at' => $endsAt->toIso8601String(),
        ];
    }

    /**
     * @param  array<string, mixed>  $template
     * @return array<string, array<string, mixed>>
     */
    private function seedDateBuckets(CarbonImmutable $startsAt, CarbonImmutable $endsAt, array $template): array
    {
        $bucket = [];

        for ($cursor = $startsAt; $cursor->lte($endsAt); $cursor = $cursor->addDay()) {
            $bucket[$cursor->toDateString()] = array_merge(
                ['date' => $cursor->toDateString()],
                $template
            );
        }

        return $bucket;
    }

    private function orderStatus(Order $order): string
    {
        return $order->status->value;
    }

    private function ledgerEntryType(LedgerEntry $entry): string
    {
        return $entry->entry_type->value;
    }
}
