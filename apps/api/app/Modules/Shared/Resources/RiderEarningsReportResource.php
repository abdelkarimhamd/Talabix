<?php

namespace App\Modules\Shared\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RiderEarningsReportResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'rider' => $this['rider'],
            'range' => $this['range'],
            'summary' => $this['summary'],
            'daily_earnings' => $this['daily_earnings'],
            'orders' => $this['orders'],
        ];
    }
}
