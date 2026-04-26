<?php

namespace App\Modules\Shared\Requests;

class MerchantSalesReportRequest extends ReportRangeRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'merchant_uuid' => ['required', 'uuid'],
        ]);
    }
}
