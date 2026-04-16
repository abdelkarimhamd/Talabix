import React, { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orderStatuses } from '@talabix/shared/contracts/enums';
import { startTransition, useDeferredValue, useState } from 'react';
import { useSession } from '../../use-session.js';

const filterOptions = ['all', ...orderStatuses];

const laneDefinitions = [
  {
    status: 'placed',
    title: 'New orders',
    description: 'Accept or reject before kitchen execution starts.',
  },
  {
    status: 'accepted',
    title: 'Accepted',
    description: 'Orders are committed and ready to move into prep.',
  },
  {
    status: 'preparing',
    title: 'Preparing',
    description: 'Kitchen work is active and should finish into ready-for-pickup.',
  },
  {
    status: 'ready_for_pickup',
    title: 'Ready for pickup',
    description: 'Orders are staged for dispatch handoff.',
  },
  {
    status: 'assigned',
    title: 'With rider',
    description: 'Merchant action is complete while delivery is in motion.',
  },
];

const merchantActionLabels = {
  accept: 'Accept order',
  reject: 'Reject order',
  start_preparing: 'Start preparing',
  mark_ready: 'Mark ready',
};

function humanize(value) {
  return value.replaceAll('_', ' ');
}

function toneForStatus(status) {
  switch (status) {
    case 'placed':
      return 'alert';
    case 'accepted':
    case 'preparing':
      return 'warm';
    case 'ready_for_pickup':
      return 'success';
    case 'assigned':
    case 'picked_up':
      return 'info';
    case 'cancelled':
      return 'muted';
    default:
      return 'success';
  }
}

function timelineTitle(event) {
  if (event.to_status) {
    return humanize(event.to_status);
  }

  return humanize(event.event_type);
}

function timelineDescription(event) {
  if (event.metadata?.fulfillment_stage) {
    return `Merchant fulfillment: ${humanize(event.metadata.fulfillment_stage)}`;
  }

  if (event.actor_role) {
    return `Actor role: ${event.actor_role}`;
  }

  return 'Lifecycle event';
}

function actionFeedbackLabel(action) {
  switch (action) {
    case 'accept':
      return 'accepted';
    case 'reject':
      return 'rejected';
    case 'start_preparing':
      return 'moved into preparing';
    case 'mark_ready':
      return 'marked ready for pickup';
    default:
      return 'updated';
  }
}

export function MerchantOrderBoard() {
  const { api } = useSession();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrderUuid, setSelectedOrderUuid] = useState();
  const [feedback, setFeedback] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const {
    data = [],
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['merchant-orders'],
    queryFn: () => api.listMerchantOrders(),
  });
  const transitionMutation = useMutation({
    mutationFn: ({ orderUuid, action }) => api.transitionMerchantOrder(orderUuid, action),
    onSuccess: (order, variables) => {
      queryClient.invalidateQueries({ queryKey: ['merchant-orders'] });
      setSelectedOrderUuid(order.uuid);
      setFeedback(
        `${order.customer_name} ${actionFeedbackLabel(variables.action)}.`
      );
    },
    onError: (error) => {
      setFeedback(error.message ?? 'Merchant action could not be completed.');
    },
  });

  useEffect(() => {
    if (!selectedOrderUuid && data.length > 0) {
      setSelectedOrderUuid(data[0].uuid);
    }
  }, [data, selectedOrderUuid]);

  const filteredOrders = data.filter((order) => {
    const matchesStatus =
      statusFilter === 'all' ? true : order.status === statusFilter;
    const matchesSearch =
      deferredSearchTerm.length === 0
        ? true
        : order.customer_name
            .toLowerCase()
            .includes(deferredSearchTerm.trim().toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const visibleLanes =
    statusFilter === 'all'
      ? laneDefinitions
      : laneDefinitions.filter((lane) => lane.status === statusFilter);
  const selectedOrder =
    data.find((order) => order.uuid === selectedOrderUuid) ?? filteredOrders[0] ?? null;

  return (
    <section className="board panel">
      <div className="board-header">
        <div>
          <span className="eyebrow">Merchant board</span>
          <h2>Fulfillment from placed to pickup-ready</h2>
        </div>
        <span className="status-pill" data-tone="success">
          {filteredOrders.length} active orders
        </span>
      </div>

      <div className="toolbar">
        <input
          aria-label="Search orders"
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by customer name"
          type="search"
          value={searchTerm}
        />
        <select
          aria-label="Filter orders by status"
          onChange={(event) =>
            startTransition(() => setStatusFilter(event.target.value))
          }
          value={statusFilter}
        >
          {filterOptions.map((option) => (
            <option key={option} value={option}>
              {humanize(option)}
            </option>
          ))}
        </select>
        <button onClick={() => refetch()} type="button">
          {isFetching ? 'Refreshing...' : 'Refresh board'}
        </button>
      </div>

      <div className="insight-strip">
        <div className="panel">
          <span className="eyebrow">Transition control</span>
          <strong>Lifecycle service only</strong>
          <p>Accept, reject, preparing, and ready-for-pickup stay aligned with one backend state machine.</p>
        </div>
        <div className="panel">
          <span className="eyebrow">Merchant pace</span>
          <strong>Kitchen-first execution</strong>
          <p>The board favors branch operators who need clear next actions and timeline visibility over dense admin tooling.</p>
        </div>
      </div>

      {feedback ? <div className="inline-feedback">{feedback}</div> : null}

      {filteredOrders.length === 0 ? (
        <div className="empty-state">
          <h3>No orders match the current filters</h3>
          <p>Try a different status or clear the customer search term.</p>
        </div>
      ) : (
        <div className="fulfillment-layout">
          <div className="fulfillment-lanes">
            {visibleLanes.map((lane) => {
              const laneOrders = filteredOrders.filter(
                (order) => order.status === lane.status
              );

              return (
                <section className="fulfillment-lane panel" key={lane.status}>
                  <div className="lane-header">
                    <div>
                      <span className="eyebrow">{lane.title}</span>
                      <h3>{laneOrders.length} order{laneOrders.length === 1 ? '' : 's'}</h3>
                    </div>
                    <p>{lane.description}</p>
                  </div>

                  {laneOrders.length === 0 ? (
                    <div className="lane-empty">No orders in this stage right now.</div>
                  ) : (
                    <div className="lane-stack">
                      {laneOrders.map((order) => (
                        <article
                          className={`board-card${selectedOrderUuid === order.uuid ? ' selected' : ''}`}
                          data-testid={`merchant-order-${order.uuid}`}
                          key={order.uuid}
                        >
                          <header>
                            <div>
                              <span className="eyebrow">Order</span>
                              <h3>{order.customer_name}</h3>
                            </div>
                            <span className="status-pill" data-tone={toneForStatus(order.status)}>
                              {humanize(order.status)}
                            </span>
                          </header>

                          <div className="board-meta">
                            <span>{order.uuid.slice(0, 8).toUpperCase()}</span>
                            <span>{order.branch_name}</span>
                          </div>

                          <dl>
                            <div>
                              <dt>Total</dt>
                              <dd>{(order.total_minor / 100).toFixed(2)} SAR</dd>
                            </div>
                            <div>
                              <dt>Items</dt>
                              <dd>{order.item_count}</dd>
                            </div>
                            <div>
                              <dt>Placed</dt>
                              <dd>{new Date(order.placed_at ?? Date.now()).toLocaleTimeString()}</dd>
                            </div>
                            <div>
                              <dt>Timeline</dt>
                              <dd>{order.timeline.length} events</dd>
                            </div>
                          </dl>

                          {order.notes ? (
                            <p className="board-note">
                              <strong>Notes:</strong> {order.notes}
                            </p>
                          ) : null}

                          <footer className="card-actions">
                            {order.merchant_actions.length > 0 ? (
                              order.merchant_actions.map((action) => (
                                <button
                                  aria-label={`${merchantActionLabels[action]} ${order.customer_name}`}
                                  className="action-button"
                                  data-testid={`merchant-action-${action}-${order.uuid}`}
                                  disabled={
                                    transitionMutation.isPending &&
                                    transitionMutation.variables?.orderUuid === order.uuid
                                  }
                                  key={action}
                                  onClick={() =>
                                    transitionMutation.mutate({
                                      orderUuid: order.uuid,
                                      action,
                                    })
                                  }
                                  type="button"
                                >
                                  {transitionMutation.isPending &&
                                  transitionMutation.variables?.orderUuid === order.uuid &&
                                  transitionMutation.variables?.action === action
                                    ? 'Working...'
                                    : merchantActionLabels[action]}
                                </button>
                              ))
                            ) : (
                              <span className="status-pill" data-tone={toneForStatus(order.status)}>
                                Waiting for next actor
                              </span>
                            )}
                            <button
                              className="action-button secondary"
                              onClick={() => setSelectedOrderUuid(order.uuid)}
                              type="button"
                            >
                              View timeline
                            </button>
                          </footer>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          <aside className="timeline-rail panel">
            <div className="lane-header">
              <div>
                <span className="eyebrow">Timeline focus</span>
                <h3>
                  {selectedOrder ? selectedOrder.customer_name : 'Select an order'}
                </h3>
              </div>
              {selectedOrder ? (
                <span className="status-pill" data-tone={toneForStatus(selectedOrder.status)}>
                  {humanize(selectedOrder.status)}
                </span>
              ) : null}
            </div>

            {selectedOrder ? (
              <>
                <p className="timeline-copy">
                  {selectedOrder.branch_name} - {(selectedOrder.total_minor / 100).toFixed(2)} SAR -{' '}
                  {selectedOrder.item_count} item{selectedOrder.item_count === 1 ? '' : 's'}
                </p>
                <div className="timeline">
                  {selectedOrder.timeline.map((event, index) => (
                    <div className="timeline-entry" key={`${selectedOrder.uuid}-${event.event_type}-${index}`}>
                      <strong>{timelineTitle(event)}</strong>
                      <span>{timelineDescription(event)}</span>
                      <small>
                        {event.created_at
                          ? new Date(event.created_at).toLocaleString()
                          : 'Timestamp pending'}
                      </small>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="lane-empty">Choose an order card to inspect its lifecycle.</div>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}

