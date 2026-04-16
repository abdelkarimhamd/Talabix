import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { startTransition, useDeferredValue, useState } from 'react';
import { useSession } from '../../use-session.js';

function formatMoney(amountMinor) {
  return `${(amountMinor / 100).toFixed(2)} SAR`;
}

export function SettlementBoard() {
  const { api, session } = useSession();
  const queryClient = useQueryClient();
  const [entryType, setEntryType] = useState('all');
  const [direction, setDirection] = useState('all');
  const [orderUuid, setOrderUuid] = useState('');
  const [selectedOrderUuid, setSelectedOrderUuid] = useState('b0d8f6a0-1540-42f6-97a7-06f4a1d7c111');
  const [adjustmentAmount, setAdjustmentAmount] = useState('-250');
  const [adjustmentNotes, setAdjustmentNotes] = useState('Delivery recovery adjustment.');
  const [feedback, setFeedback] = useState();
  const deferredOrderUuid = useDeferredValue(orderUuid);
  const canAdjustSettlements = session.permissions.includes('ops:settlements.manage');

  const query = {
    entry_type: entryType === 'all' ? undefined : entryType,
    direction: direction === 'all' ? undefined : direction,
    order_uuid: deferredOrderUuid.trim() || undefined,
  };

  const { data } = useQuery({
    queryKey: ['ops-settlements', query.entry_type ?? 'all', query.direction ?? 'all', query.order_uuid ?? ''],
    queryFn: () => api.listSettlementLedger(query),
  });

  const adjustmentMutation = useMutation({
    mutationFn: () =>
      api.createSettlementAdjustment(selectedOrderUuid, {
        amount_minor: Number(adjustmentAmount),
        notes: adjustmentNotes,
      }),
    onSuccess: (entry) => {
      queryClient.invalidateQueries({ queryKey: ['ops-settlements'] });
      setFeedback(
        `Adjustment ${formatMoney(entry.amount_minor)} recorded for ${entry.order_uuid.slice(0, 8).toUpperCase()}.`
      );
    },
    onError: (error) => {
      setFeedback(error.message ?? 'Adjustment could not be recorded.');
    },
  });

  const exportMutation = useMutation({
    mutationFn: () => api.exportSettlementLedger(query),
    onSuccess: (result) => {
      setFeedback(`${result.filename} prepared with ${result.rowCount} rows.`);
    },
  });

  const entries = data?.data ?? [];
  const meta = data?.meta ?? {
    total_entries: 0,
    total_amount_minor: 0,
    entry_type_totals: {},
  };
  const uniqueOrderUuids = Array.from(new Set(entries.map((entry) => entry.order_uuid).filter(Boolean)));

  return (
    <section className="board panel">
      <div className="board-header">
        <div>
          <span className="eyebrow">Ops settlements</span>
          <h2>Ledger-based reconciliation and manual adjustments</h2>
        </div>
        <span className="status-pill" data-tone="success">
          {meta.total_entries} ledger rows
        </span>
      </div>

      <div className="insight-strip">
        <div className="panel">
          <span className="eyebrow">Filtered total</span>
          <strong>{formatMoney(meta.total_amount_minor)}</strong>
          <p>Review what the current ledger slice adds up to before exporting or adjusting.</p>
        </div>
        <div className="panel">
          <span className="eyebrow">Adjustments</span>
          <strong>{formatMoney(meta.entry_type_totals.adjustment ?? 0)}</strong>
          <p>Manual finance corrections stay additive, audited, and separate from lifecycle events.</p>
        </div>
      </div>

      <div className="toolbar">
        <select
          aria-label="Filter settlement ledger by entry type"
          onChange={(event) => startTransition(() => setEntryType(event.target.value))}
          value={entryType}
        >
          <option value="all">all entry types</option>
          <option value="merchant_receivable">merchant receivable</option>
          <option value="platform_commission">platform commission</option>
          <option value="rider_earning">rider earning</option>
          <option value="adjustment">adjustment</option>
        </select>
        <select
          aria-label="Filter settlement ledger by direction"
          onChange={(event) => startTransition(() => setDirection(event.target.value))}
          value={direction}
        >
          <option value="all">all directions</option>
          <option value="positive">positive only</option>
          <option value="negative">negative only</option>
        </select>
        <input
          aria-label="Filter settlement ledger by order uuid"
          onChange={(event) => startTransition(() => setOrderUuid(event.target.value))}
          placeholder="filter by order uuid"
          value={orderUuid}
        />
        <button onClick={() => exportMutation.mutate()} type="button">
          Export ledger CSV
        </button>
      </div>

      <div className="board-grid">
        {entries.map((entry) => (
          <article className="board-card" key={entry.id} data-testid={`settlement-entry-${entry.id}`}>
            <header>
              <div>
                <span className="eyebrow">{entry.entry_type.replaceAll('_', ' ')}</span>
                <h3>{formatMoney(entry.amount_minor)}</h3>
              </div>
              <span
                className="status-pill"
                data-tone={entry.amount_minor >= 0 ? 'success' : 'alert'}
              >
                {entry.amount_minor >= 0 ? 'credit' : 'debit'}
              </span>
            </header>

            <dl>
              <div>
                <dt>Order</dt>
                <dd>{entry.order_uuid.slice(0, 8).toUpperCase()}</dd>
              </div>
              <div>
                <dt>Merchant</dt>
                <dd>{entry.merchant_name}</dd>
              </div>
              <div>
                <dt>Rider</dt>
                <dd>{entry.rider_name ?? 'n/a'}</dd>
              </div>
            </dl>

            <p>{entry.notes}</p>

            {canAdjustSettlements ? (
              <footer className="card-actions">
                <button
                  className="action-button secondary"
                  onClick={() => setSelectedOrderUuid(entry.order_uuid)}
                  type="button"
                >
                  Target this order
                </button>
              </footer>
            ) : null}
          </article>
        ))}
      </div>

      {canAdjustSettlements ? (
        <section className="panel">
          <div className="board-header">
            <div>
              <span className="eyebrow">Manual adjustment</span>
              <h3>Record an audited finance correction</h3>
            </div>
            <span className="status-pill">Audit required</span>
          </div>

          <div className="toolbar">
            <select
              aria-label="Select order for settlement adjustment"
              onChange={(event) => setSelectedOrderUuid(event.target.value)}
              value={selectedOrderUuid}
            >
              {uniqueOrderUuids.map((uuid) => (
                <option key={uuid} value={uuid}>
                  {uuid.slice(0, 8).toUpperCase()}
                </option>
              ))}
            </select>
            <input
              aria-label="Settlement adjustment amount"
              onChange={(event) => setAdjustmentAmount(event.target.value)}
              value={adjustmentAmount}
            />
            <input
              aria-label="Settlement adjustment notes"
              onChange={(event) => setAdjustmentNotes(event.target.value)}
              value={adjustmentNotes}
            />
            <button
              className="action-button"
              onClick={() => adjustmentMutation.mutate()}
              type="button"
            >
              Issue settlement adjustment
            </button>
          </div>
        </section>
      ) : null}

      {feedback ? <p>{feedback}</p> : null}
    </section>
  );
}
