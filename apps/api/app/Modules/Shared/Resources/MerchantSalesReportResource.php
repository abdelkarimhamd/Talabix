<?php

namespace App\Modules\Shared\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MerchantSalesReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'merchant' => $this['merchant'],
            'range' => $this['range'],
            'summary' => $this['summary'],
            'daily_sales' => $this['daily_sales'],
            'branch_breakdown' => $this['branch_breakdown'],
            'top_items' => $this['top_items'],
        ];
    }
}
