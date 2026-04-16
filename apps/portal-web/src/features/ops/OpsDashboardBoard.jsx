import React from 'react';
// i18n-audit: strict
import { useQuery } from '@tanstack/react-query';
import { startTransition, useDeferredValue, useState } from 'react';
import { useI18n } from '../../use-i18n.js';
import { useSession } from '../../use-session.js';

export function OpsDashboardBoard() {
  const { api } = useSession();
  const { formatCurrency, labelForEnum, t } = useI18n();
  const [rangeDays, setRangeDays] = useState(7);
  const deferredRangeDays = useDeferredValue(rangeDays);
  const { data } = useQuery({
    queryKey: ['ops-dashboard-overview', deferredRangeDays],
    queryFn: () =>
      api.getOpsDashboardOverview({
        range_days: deferredRangeDays,
      }),
  });

  const dashboard = data;

  return (
    <section className="board panel">
      <div className="board-header">
        <div>
          <span className="eyebrow">{t('ops.dashboard.eyebrow')}</span>
          <h2>{t('ops.dashboard.title')}</h2>
        </div>
        <span className="status-pill" data-tone="alert">
          {t('ops.dashboard.activeOrders', {
            count: dashboard?.kpis.active_orders ?? 0,
          })}
        </span>
      </div>

      <div className="toolbar">
        <select
          aria-label={t('ops.dashboard.rangeLabel')}
          onChange={(event) =>
            startTransition(() => setRangeDays(Number(event.target.value)))
          }
          value={rangeDays}
        >
          <option value={7}>{t('ops.dashboard.last7Days')}</option>
          <option value={30}>{t('ops.dashboard.last30Days')}</option>
        </select>
      </div>

      <div className="insight-strip">
        <div className="panel">
          <span className="eyebrow">{t('ops.dashboard.grossSales')}</span>
          <strong>{formatCurrency(dashboard?.kpis.gross_sales_minor ?? 0)}</strong>
          <p>{t('ops.dashboard.grossSalesDescription')}</p>
        </div>
        <div className="panel">
          <span className="eyebrow">{t('ops.dashboard.platformNet')}</span>
          <strong>{formatCurrency(dashboard?.financials.net_platform_minor ?? 0)}</strong>
          <p>{t('ops.dashboard.platformNetDescription')}</p>
        </div>
        <div className="panel">
          <span className="eyebrow">{t('ops.dashboard.riderEarnings')}</span>
          <strong>{formatCurrency(dashboard?.rider_earnings.total_earnings_minor ?? 0)}</strong>
          <p>{t('ops.dashboard.riderEarningsDescription')}</p>
        </div>
      </div>

      {dashboard ? (
        <div className="report-layout">
          <section className="panel">
            <div className="board-header">
              <div>
                <span className="eyebrow">{t('ops.dashboard.kpiSummary')}</span>
                <h3>{t('ops.dashboard.orderFleetHealth')}</h3>
              </div>
            </div>

            <dl className="report-stats">
              <div>
                <dt>{t('ops.dashboard.totalOrders')}</dt>
                <dd>{dashboard.kpis.total_orders}</dd>
              </div>
              <div>
                <dt>{t('ops.dashboard.delivered')}</dt>
                <dd>{dashboard.kpis.delivered_orders}</dd>
              </div>
              <div>
                <dt>{t('ops.dashboard.cancelled')}</dt>
                <dd>{dashboard.kpis.cancelled_orders}</dd>
              </div>
              <div>
                <dt>{t('ops.dashboard.activeMerchants')}</dt>
                <dd>{dashboard.kpis.active_merchants}</dd>
              </div>
              <div>
                <dt>{t('ops.dashboard.acceptingBranches')}</dt>
                <dd>{dashboard.kpis.accepting_branches}</dd>
              </div>
              <div>
                <dt>{t('ops.dashboard.availableRiders')}</dt>
                <dd>{dashboard.kpis.available_riders}</dd>
              </div>
            </dl>
          </section>

          <section className="panel">
            <div className="board-header">
              <div>
                <span className="eyebrow">{t('ops.dashboard.statusBreakdown')}</span>
                <h3>{t('ops.dashboard.orderStateMix')}</h3>
              </div>
            </div>

            <table className="report-table">
              <thead>
                <tr>
                  <th>{t('ops.dashboard.status')}</th>
                  <th>{t('ops.dashboard.count')}</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.order_status_breakdown.map((status) => (
                  <tr key={status.status}>
                    <td>{labelForEnum('orderStatus', status.status)}</td>
                    <td>{status.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="panel">
            <div className="board-header">
              <div>
                <span className="eyebrow">{t('ops.dashboard.merchantSales')}</span>
                <h3>{t('ops.dashboard.merchantRanking')}</h3>
              </div>
            </div>

            <table className="report-table">
              <thead>
                <tr>
                  <th>{t('ops.dashboard.merchant')}</th>
                  <th>{t('ops.dashboard.orders')}</th>
                  <th>{t('ops.dashboard.delivered')}</th>
                  <th>{t('ops.dashboard.grossSales')}</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.merchant_sales.map((merchant) => (
                  <tr key={merchant.merchant_uuid ?? merchant.merchant_name}>
                    <td>{merchant.merchant_name}</td>
                    <td>{merchant.total_orders}</td>
                    <td>{merchant.delivered_orders}</td>
                    <td>{formatCurrency(merchant.gross_sales_minor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="panel">
            <div className="board-header">
              <div>
                <span className="eyebrow">{t('ops.dashboard.riderEarnings')}</span>
                <h3>{t('ops.dashboard.payoutExposure')}</h3>
              </div>
            </div>

            <table className="report-table">
              <thead>
                <tr>
                  <th>{t('ops.dashboard.rider')}</th>
                  <th>{t('ops.dashboard.deliveries')}</th>
                  <th>{t('ops.dashboard.earnings')}</th>
                  <th>{t('ops.dashboard.averageDelivery')}</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.rider_earnings.riders.map((rider) => (
                  <tr key={rider.rider_uuid ?? rider.rider_name}>
                    <td>{rider.rider_name}</td>
                    <td>{rider.deliveries_count}</td>
                    <td>{formatCurrency(rider.earnings_minor)}</td>
                    <td>{formatCurrency(rider.average_per_delivery_minor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="panel">
            <div className="board-header">
              <div>
                <span className="eyebrow">{t('ops.dashboard.dailyTrend')}</span>
                <h3>{t('ops.dashboard.orderVolumeByDay')}</h3>
              </div>
            </div>

            <table className="report-table">
              <thead>
                <tr>
                  <th>{t('ops.dashboard.date')}</th>
                  <th>{t('ops.dashboard.orders')}</th>
                  <th>{t('ops.dashboard.delivered')}</th>
                  <th>{t('ops.dashboard.grossSales')}</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.daily_orders.map((day) => (
                  <tr key={day.date}>
                    <td>{day.date}</td>
                    <td>{day.total_orders}</td>
                    <td>{day.delivered_orders}</td>
                    <td>{formatCurrency(day.gross_sales_minor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      ) : (
        <div className="empty-state">
          <h3>{t('ops.dashboard.loadingTitle')}</h3>
          <p>{t('ops.dashboard.loadingDescription')}</p>
        </div>
      )}
    </section>
  );
}
