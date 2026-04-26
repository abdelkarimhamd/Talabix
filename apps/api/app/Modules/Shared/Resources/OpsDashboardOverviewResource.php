<?php

namespace App\Modules\Shared\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OpsDashboardOverviewResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'range' => $this['range'],
            'kpis' => $this['kpis'],
            'financials' => $this['financials'],
            'order_status_breakdown' => $this['order_status_breakdown'],
            'daily_orders' => $this['daily_orders'],
            'merchant_sales' => $this['merchant_sales'],
            'rider_earnings' => $this['rider_earnings'],
        ];
    }
}
