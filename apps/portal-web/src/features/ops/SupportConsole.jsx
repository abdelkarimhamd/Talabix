import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  supportCancellationReasonCodes,
  supportCaseStatuses,
  supportIssueTypes,
  supportResolutionTypes,
} from '@talabix/shared/contracts/enums';
import { startTransition, useDeferredValue, useEffect, useState } from 'react';
import { useI18n } from '../../use-i18n.js';
import { useSession } from '../../use-session.js';

export function SupportConsole() {
  const { api } = useSession();
  const { labelForEnum } = useI18n();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [selectedOrderUuid, setSelectedOrderUuid] = useState('');
  const [caseSummary, setCaseSummary] = useState('');
  const [caseIssueType, setCaseIssueType] = useState('customer_request');
  const [caseStatus, setCaseStatus] = useState('open');
  const [resolutionType, setResolutionType] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [cancelReasonCode, setCancelReasonCode] = useState('customer_request');
  const [cancelReasonNote, setCancelReasonNote] = useState('');
  const [noteBody, setNoteBody] = useState(
    'Please call the customer before arrival.'
  );
  const [feedback, setFeedback] = useState();
  const deferredQuery = useDeferredValue(query);

  const { data: orders = [] } = useQuery({
    queryKey: ['ops-support-orders', deferredQuery],
    queryFn: () =>
      api.searchSupportOrders({ q: deferredQuery.trim() || undefined }),
  });

  const activeOrder =
    orders.find((order) => order.uuid === selectedOrderUuid) ??
    orders[0] ??
    null;

  useEffect(() => {
    if (!activeOrder) {
      return;
    }

    setCaseSummary(
      activeOrder.support_case?.summary ??
        `Support follow-up for order ${activeOrder.uuid.slice(0, 8).toUpperCase()}.`
    );
    setCaseIssueType(
      activeOrder.support_case?.issue_type ?? 'customer_request'
    );
    setCaseStatus(activeOrder.support_case?.status ?? 'open');
    setResolutionType(activeOrder.support_case?.resolution_type ?? '');
    setResolutionNotes(activeOrder.support_case?.resolution_notes ?? '');
    setCancelReasonCode(
      activeOrder.support_case?.cancellation_reason_code ?? 'customer_request'
    );
    setCancelReasonNote('');
  }, [activeOrder]);

  const { data: notifications } = useQuery({
    queryKey: ['ops-notifications', activeOrder?.uuid ?? 'all'],
    queryFn: () => api.listNotifications({ order_uuid: activeOrder?.uuid }),
  });

  const caseMutation = useMutation({
    mutationFn: () => {
      const payload = {
        summary: caseSummary,
        issue_type: caseIssueType,
        status: caseStatus,
        resolution_type: resolutionType || null,
        resolution_notes: resolutionNotes || null,
      };

      if (activeOrder.support_case?.uuid) {
        return api.updateSupportCase(activeOrder.support_case.uuid, payload);
      }

      return api.createOrUpdateSupportCase(activeOrder.uuid, payload);
    },
    onSuccess: (supportCase) => {
      queryClient.invalidateQueries({ queryKey: ['ops-support-orders'] });
      setFeedback(
        `Support case ${supportCase.uuid.slice(0, 8).toUpperCase()} saved as ${labelForEnum('supportCaseStatus', supportCase.status)}.`
      );
    },
    onError: (error) => {
      setFeedback(error.message ?? 'Support case could not be saved.');
    },
  });

  const noteMutation = useMutation({
    mutationFn: () =>
      api.createSupportNote(activeOrder.uuid, { body: noteBody }),
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: ['ops-support-orders'] });
      queryClient.invalidateQueries({ queryKey: ['ops-notifications'] });
      setFeedback(
        `Support note added for ${note.order_uuid.slice(0, 8).toUpperCase()}.`
      );
      setNoteBody('Customer notified and internal teams updated.');
    },
    onError: (error) => {
      setFeedback(error.message ?? 'Support note could not be saved.');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () =>
      api.cancelSupportOrder(activeOrder.uuid, {
        summary: caseSummary,
        issue_type: caseIssueType,
        reason_code: cancelReasonCode,
        reason_note: cancelReasonNote || null,
      }),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['ops-support-orders'] });
      queryClient.invalidateQueries({ queryKey: ['ops-notifications'] });
      setFeedback(
        `Support cancelled order ${order.uuid.slice(0, 8).toUpperCase()} with ${labelForEnum('supportCancellationReasonCode', cancelReasonCode)}.`
      );
    },
    onError: (error) => {
      setFeedback(error.message ?? 'Order could not be cancelled.');
    },
  });

  const retryMutation = useMutation({
    mutationFn: (notificationDeliveryId) =>
      api.retryNotification(notificationDeliveryId),
    onSuccess: (delivery) => {
      queryClient.invalidateQueries({ queryKey: ['ops-notifications'] });
      setFeedback(
        `Notification retry completed for ${delivery.order_uuid.slice(0, 8).toUpperCase()} via ${delivery.provider}.`
      );
    },
    onError: (error) => {
      setFeedback(
        error.message ?? 'Notification retry could not be scheduled.'
      );
    },
  });

  const notificationEntries = notifications?.data ?? [];

  return (
    <section className="board panel">
      <div className="board-header">
        <div>
          <span className="eyebrow">Support + notifications</span>
          <h2>Search orders, add notes, and watch outbound comms</h2>
        </div>
        <span className="status-pill">Audit required</span>
      </div>

      <div className="insight-strip">
        <div className="panel">
          <span className="eyebrow">Case search</span>
          <strong>{orders.length} matching orders</strong>
          <p>
            Support works from the same order resource the rest of the platform
            uses, with notes attached in-place.
          </p>
        </div>
        <div className="panel">
          <span className="eyebrow">Notification queue</span>
          <strong>{notifications?.meta?.total ?? 0} queued or sent</strong>
          <p>
            Support-facing communication history stays visible next to the case
            so ops can verify what left the system.
          </p>
        </div>
      </div>

      <div className="toolbar">
        <input
          aria-label="Search support orders"
          onChange={(event) =>
            startTransition(() => setQuery(event.target.value))
          }
          placeholder="search by order, customer, or merchant"
          value={query}
        />
      </div>

      <div className="board-grid">
        {orders.map((order) => (
          <article
            className="board-card"
            data-testid={`support-order-${order.uuid}`}
            key={order.uuid}
          >
            <header>
              <div>
                <span className="eyebrow">{order.merchant_name}</span>
                <h3>{order.customer_name}</h3>
              </div>
              <span className="status-pill">
                {labelForEnum('orderStatus', order.status)}
              </span>
            </header>

            <dl>
              <div>
                <dt>Order</dt>
                <dd>{order.uuid.slice(0, 8).toUpperCase()}</dd>
              </div>
              <div>
                <dt>Branch</dt>
                <dd>{order.branch_name}</dd>
              </div>
              <div>
                <dt>Support notes</dt>
                <dd>{order.support_notes.length}</dd>
              </div>
              <div>
                <dt>Case status</dt>
                <dd>
                  {order.support_case
                    ? labelForEnum(
                        'supportCaseStatus',
                        order.support_case.status
                      )
                    : 'none'}
                </dd>
              </div>
            </dl>

            <p>{order.notes ?? 'No customer notes captured.'}</p>

            <footer className="card-actions">
              <button
                className="action-button secondary"
                onClick={() => setSelectedOrderUuid(order.uuid)}
                type="button"
              >
                Focus case
              </button>
            </footer>
          </article>
        ))}
      </div>

      {activeOrder ? (
        <section className="panel">
          <div className="board-header">
            <div>
              <span className="eyebrow">Focused case</span>
              <h3>
                {activeOrder.customer_name} -{' '}
                {activeOrder.uuid.slice(0, 8).toUpperCase()}
              </h3>
            </div>
            <span
              className="status-pill"
              data-tone={
                activeOrder.status === 'cancelled' ? 'alert' : 'success'
              }
            >
              {labelForEnum('orderStatus', activeOrder.status)}
            </span>
          </div>

          <div className="insight-strip">
            <div className="panel">
              <span className="eyebrow">Case summary</span>
              <strong>
                {activeOrder.support_case?.summary ?? 'No structured case yet'}
              </strong>
              <p>
                Ticket shape is tracked on the order itself, not in a separate
                support-only silo.
              </p>
            </div>
            <div className="panel">
              <span className="eyebrow">Resolution</span>
              <strong>
                {activeOrder.support_case?.resolution_type
                  ? labelForEnum(
                      'supportResolutionType',
                      activeOrder.support_case.resolution_type
                    )
                  : 'Pending outcome'}
              </strong>
              <p>
                Cancellation reasons and final outcomes stay typed for later
                reporting and audits.
              </p>
            </div>
          </div>

          <div className="toolbar">
            <input
              aria-label="Support case summary"
              onChange={(event) => setCaseSummary(event.target.value)}
              value={caseSummary}
            />
            <select
              aria-label="Support case issue type"
              onChange={(event) => setCaseIssueType(event.target.value)}
              value={caseIssueType}
            >
              {supportIssueTypes.map((issueType) => (
                <option key={issueType} value={issueType}>
                  {labelForEnum('supportIssueType', issueType)}
                </option>
              ))}
            </select>
            <select
              aria-label="Support case status"
              onChange={(event) => setCaseStatus(event.target.value)}
              value={caseStatus}
            >
              {supportCaseStatuses.map((status) => (
                <option key={status} value={status}>
                  {labelForEnum('supportCaseStatus', status)}
                </option>
              ))}
            </select>
            <select
              aria-label="Support case resolution type"
              onChange={(event) => setResolutionType(event.target.value)}
              value={resolutionType}
            >
              <option value="">no resolution</option>
              {supportResolutionTypes.map((resolution) => (
                <option key={resolution} value={resolution}>
                  {labelForEnum('supportResolutionType', resolution)}
                </option>
              ))}
            </select>
          </div>

          <div className="toolbar">
            <textarea
              aria-label="Support case resolution notes"
              onChange={(event) => setResolutionNotes(event.target.value)}
              rows={2}
              value={resolutionNotes}
            />
          </div>

          <div className="card-actions">
            <button
              className="action-button secondary"
              onClick={() => caseMutation.mutate()}
              type="button"
            >
              Save support case
            </button>
          </div>

          <div className="timeline">
            {activeOrder.support_notes.map((note) => (
              <article className="timeline-entry" key={note.id}>
                <strong>{note.author_name}</strong>
                <span>{note.body}</span>
                <small>{note.created_at}</small>
              </article>
            ))}
          </div>

          <div className="toolbar">
            <textarea
              aria-label="Support note body"
              onChange={(event) => setNoteBody(event.target.value)}
              rows={3}
              value={noteBody}
            />
          </div>

          <div className="card-actions">
            <button
              className="action-button"
              onClick={() => noteMutation.mutate()}
              type="button"
            >
              Add support note
            </button>
          </div>

          <div className="toolbar">
            <select
              aria-label="Support cancellation reason"
              onChange={(event) => setCancelReasonCode(event.target.value)}
              value={cancelReasonCode}
            >
              {supportCancellationReasonCodes.map((reasonCode) => (
                <option key={reasonCode} value={reasonCode}>
                  {labelForEnum('supportCancellationReasonCode', reasonCode)}
                </option>
              ))}
            </select>
            <textarea
              aria-label="Support cancellation note"
              onChange={(event) => setCancelReasonNote(event.target.value)}
              rows={2}
              value={cancelReasonNote}
            />
          </div>

          <div className="card-actions">
            <button
              className="action-button secondary"
              disabled={['cancelled', 'delivered'].includes(activeOrder.status)}
              onClick={() => cancelMutation.mutate()}
              type="button"
            >
              Cancel order
            </button>
          </div>
        </section>
      ) : null}

      <section className="panel">
        <div className="board-header">
          <div>
            <span className="eyebrow">Outbound queue</span>
            <h3>Recent notification deliveries</h3>
          </div>
          <span className="status-pill">
            {notificationEntries.length} visible
          </span>
        </div>

        <div className="timeline">
          {notificationEntries.map((entry) => (
            <article className="timeline-entry" key={entry.id}>
              <strong>
                {entry.title} -{' '}
                {labelForEnum('notificationChannel', entry.channel)}
              </strong>
              <span>
                {labelForEnum('actorRole', entry.recipient_actor)} -{' '}
                {entry.recipient_name}
              </span>
              <small>
                {labelForEnum('notificationDeliveryStatus', entry.status)} via{' '}
                {entry.provider} - attempt {entry.attempt_count} -{' '}
                {entry.order_uuid.slice(0, 8).toUpperCase()}
              </small>
              {entry.last_error ? <span>{entry.last_error}</span> : null}
              {entry.status === 'failed' ? (
                <button
                  className="action-button secondary"
                  onClick={() => retryMutation.mutate(entry.id)}
                  type="button"
                >
                  Retry notification
                </button>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      {feedback ? <p>{feedback}</p> : null}
    </section>
  );
}
