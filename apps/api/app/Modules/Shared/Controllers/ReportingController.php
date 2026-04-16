<?php

namespace App\Modules\Shared\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Merchant;
use App\Models\RiderProfile;
use App\Modules\Shared\Requests\MerchantSalesReportRequest;
use App\Modules\Shared\Requests\OpsDashboardOverviewRequest;
use App\Modules\Shared\Requests\RiderEarningsReportRequest;
use App\Modules\Shared\Resources\MerchantSalesReportResource;
use App\Modules\Shared\Resources\OpsDashboardOverviewResource;
use App\Modules\Shared\Resources\RiderEarningsReportResource;
use App\Modules\Shared\Services\ReportingService;
use Illuminate\Http\JsonResponse;

class ReportingController extends Controller
{
    public function __construct(
        private readonly ReportingService $reportingService,
    ) {
    }

    public function merchantSales(MerchantSalesReportRequest $request): JsonResponse
    {
        $this->ensureAbility($request, 'merchant:dashboard.read');

        $merchant = Merchant::query()
            ->where('uuid', $request->string('merchant_uuid')->toString())
            ->firstOrFail();

        abort_unless($request->user()->can('view', $merchant), 403);

        $report = $this->reportingService->merchantSales(
            $merchant,
            $request->integer('range_days', 7)
        );

        return response()->json([
            'data' => new MerchantSalesReportResource($report),
        ]);
    }

    public function opsOverview(OpsDashboardOverviewRequest $request): JsonResponse
    {
        $this->ensureAbility($request, 'ops:dashboard.read');

        $overview = $this->reportingService->opsOverview(
            $request->integer('range_days', 7)
        );

        return response()->json([
            'data' => new OpsDashboardOverviewResource($overview),
        ]);
    }

    public function riderEarnings(RiderEarningsReportRequest $request): JsonResponse
    {
        $this->ensureAbility($request, 'rider:earnings.read');

        $riderProfile = RiderProfile::query()
            ->with('user')
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $report = $this->reportingService->riderEarnings(
            $riderProfile,
            $request->integer('range_days', 7)
        );

        return response()->json([
            'data' => new RiderEarningsReportResource($report),
        ]);
    }
}
