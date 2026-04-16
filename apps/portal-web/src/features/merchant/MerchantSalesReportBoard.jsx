import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { startTransition, useDeferredValue, useState } from 'react';
import { useSession } from '../../use-session.js';

function formatMoney(amountMinor) {
  return `${(amountMinor / 100).toFixed(2)} SAR`;
}

export function MerchantSalesReportBoard() {
  const { api } = useSession();
  const [selectedMerchantUuid, setSelectedMerchantUuid] = useState('');
  const [rangeDays, setRangeDays] = useState(7);
  const deferredMerchantUuid = useDeferredValue(selectedMerchantUuid);
  const deferredRangeDays = useDeferredValue(rangeDays);

  const managedMerchantsQuery = useQuery({
    queryKey: ['merchant-managed-merchants'],
    queryFn: () => api.listManagedMerchants(),
  });

  useEffect(() => {
    if (!selectedMerchantUuid && managedMerchantsQuery.data?.length) {
      setSelectedMerchantUuid(managedMerchantsQuery.data[0].uuid);
    }
  }, [managedMerchantsQuery.data, selectedMerchantUuid]);

  const reportQuery = useQuery({
    enabled: Boolean(deferredMerchantUuid),
    queryKey: ['merchant-sales-report', deferredMerchantUuid, deferredRangeDays],
    queryFn: () =>
      api.getMerchantSalesReport({
        merchant_uuid: deferredMerchantUuid,
        range_days: deferredRangeDays,
      }),
  });

  const report = reportQuery.data;

  return (
    <section className="board panel">
      <div className="board-header">
        <div>
          <span className="eyebrow">Merchant reporting</span>
          <h2>Sales, branch performance, and top-selling items</h2>
        </div>
        <span className="status-pill" data-tone="info">
          {report?.summary.total_orders ?? 0} orders in range
        </span>
      </div>

      <div className="toolbar">
        <select
          aria-label="Select merchant sales report merchant"
          onChange={(event) =>
            startTransition(() => setSelectedMerchantUuid(event.target.value))
          }
          value={selectedMerchantUuid}
        >
          {(managedMerchantsQuery.data ?? []).map((merchant) => (
            <option key={merchant.uuid} value={merchant.uuid}>
              {merchant.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Select merchant sales report range"
          onChange={(event) =>
            startTransition(() => setRangeDays(Number(event.target.value)))
          }
          value={rangeDays}
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      <div className="insight-strip">
        <div className="panel">
          <span className="eyebrow">Gross sales</span>
          <strong>{formatMoney(report?.summary.gross_sales_minor ?? 0)}</strong>
          <p>Non-cancelled order subtotal for the selected merchant and date window.</p>
        </div>
        <div className="panel">
          <span className="eyebrow">Completed sales</span>
          <strong>{formatMoney(report?.summary.completed_sales_minor ?? 0)}</strong>
          <p>Delivered order subtotal only, separated from active and cancelled order volume.</p>
        </div>
        <div className="panel">
          <span className="eyebrow">Average order value</span>
          <strong>{formatMoney(report?.summary.average_order_value_minor ?? 0)}</strong>
          <p>Average subtotal across non-cancelled orders in the selected range.</p>
        </div>
      </div>

      {report ? (
        <div className="report-layout">
          <section className="panel">
            <div className="board-header">
              <div>
                <span className="eyebrow">Summary</span>
                <h3>{report.merchant.name}</h3>
              </div>
              <span className="status-pill" data-tone="success">
                {report.summary.delivered_orders} delivered
              </span>
            </div>

            <dl className="report-stats">
              <div>
                <dt>Total orders</dt>
                <dd>{report.summary.total_orders}</dd>
              </div>
              <div>
                <dt>Active orders</dt>
                <dd>{report.summary.active_orders}</dd>
              </div>
              <div>
                <dt>Cancelled orders</dt>
                <dd>{report.summary.cancelled_orders}</dd>
              </div>
              <div>
                <dt>Delivery fees</dt>
                <dd>{formatMoney(report.summary.delivery_fees_minor)}</dd>
              </div>
            </dl>
          </section>

          <section className="panel">
            <div className="board-header">
              <div>
                <span className="eyebrow">Branch breakdown</span>
                <h3>Which branches are carrying sales</h3>
              </div>
            </div>

            <table className="report-table">
              <thead>
                <tr>
                  <th>Branch</th>
                  <th>Orders</th>
                  <th>Delivered</th>
                  <th>Gross sales</th>
                </tr>
              </thead>
              <tbody>
                {report.branch_breakdown.map((branch) => (
                  <tr key={branch.branch_uuid ?? branch.branch_name}>
                    <td>{branch.branch_name}</td>
                    <td>{branch.total_orders}</td>
                    <td>{branch.delivered_orders}</td>
                    <td>{formatMoney(branch.gross_sales_minor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="panel">
            <div className="board-header">
              <div>
                <span className="eyebrow">Top items</span>
                <h3>Most sold menu items</h3>
              </div>
            </div>

            <table className="report-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty sold</th>
                  <th>Gross sales</th>
                </tr>
              </thead>
              <tbody>
                {report.top_items.map((item) => (
                  <tr key={item.item_name}>
                    <td>{item.item_name}</td>
                    <td>{item.quantity_sold}</td>
                    <td>{formatMoney(item.gross_sales_minor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="panel">
            <div className="board-header">
              <div>
                <span className="eyebrow">Daily sales</span>
                <h3>Range trend</h3>
              </div>
            </div>

            <table className="report-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Orders</th>
                  <th>Delivered</th>
                  <th>Gross sales</th>
                </tr>
              </thead>
              <tbody>
                {report.daily_sales.map((day) => (
                  <tr key={day.date}>
                    <td>{day.date}</td>
                    <td>{day.orders_count}</td>
                    <td>{day.delivered_orders}</td>
                    <td>{formatMoney(day.gross_sales_minor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      ) : (
        <div className="empty-state">
          <h3>{reportQuery.isLoading ? 'Loading merchant sales report' : 'Select a merchant'}</h3>
          <p>The report uses the same stable API contract as the backend reporting slice.</p>
        </div>
      )}
    </section>
  );
}
