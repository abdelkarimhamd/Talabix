import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useSession } from '../../use-session.js';

function humanize(value) {
  return value.replaceAll('_', ' ');
}

function applyReadState(
  currentInbox,
  notification,
  { unreadOnly = false } = {}
) {
  if (!currentInbox) {
    return currentInbox;
  }

  const nextData = currentInbox.data
    .map((entry) => (entry.id === notification.id ? notification : entry))
    .filter((entry) => !unreadOnly || !entry.read_at);

  return {
    data: nextData,
    meta: {
      ...currentInbox.meta,
      total: nextData.length,
      unread_count: nextData.filter((entry) => !entry.read_at).length,
    },
  };
}

export function MerchantNotificationsBoard() {
  const { api } = useSession();
  const queryClient = useQueryClient();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [feedback, setFeedback] = useState('');
  const { data } = useQuery({
    queryKey: ['merchant-notifications', unreadOnly],
    queryFn: () =>
      api.listMerchantNotifications({ unread_only: unreadOnly || undefined }),
  });
  const markReadMutation = useMutation({
    mutationFn: (notificationId) =>
      api.markMerchantNotificationRead(notificationId),
    onSuccess: (notification) => {
      queryClient.setQueryData(
        ['merchant-notifications', true],
        (currentInbox) =>
          applyReadState(currentInbox, notification, { unreadOnly: true })
      );
      queryClient.setQueryData(
        ['merchant-notifications', false],
        (currentInbox) => applyReadState(currentInbox, notification)
      );
      queryClient.setQueryData(['merchant-notifications'], (currentInbox) =>
        applyReadState(currentInbox, notification)
      );
      setFeedback(`${notification.title} marked as read.`);
    },
    onError: (error) => {
      setFeedback(error.message ?? 'Notification could not be updated.');
    },
  });

  return (
    <section className="board panel">
      <div className="board-header">
        <div>
          <span className="eyebrow">Merchant inbox</span>
          <h2>In-app merchant notifications stay scoped to the store team</h2>
        </div>
        <span className="status-pill" data-tone="info">
          {data?.meta.unread_count ?? 0} unread
        </span>
      </div>

      <div className="toolbar">
        <button
          onClick={() => setUnreadOnly((current) => !current)}
          type="button"
        >
          {unreadOnly ? 'Show all notifications' : 'Show unread only'}
        </button>
      </div>

      <div className="insight-strip">
        <div className="panel">
          <span className="eyebrow">Actor scope</span>
          <strong>Merchant in-app only</strong>
          <p>
            The inbox excludes ops, rider, and customer rows and ignores email
            delivery history.
          </p>
        </div>
        <div className="panel">
          <span className="eyebrow">Read state</span>
          <strong>Order-linked history</strong>
          <p>
            Each notification keeps its order UUID so store staff can tie inbox
            events back to fulfillment activity.
          </p>
        </div>
      </div>

      {feedback ? (
        <div aria-live="polite" className="inline-feedback" role="status">
          {feedback}
        </div>
      ) : null}

      {data?.data.length ? (
        <div className="board-grid">
          {data.data.map((notification) => (
            <article className="board-card" key={notification.id}>
              <header>
                <div>
                  <span className="eyebrow">
                    {notification.read_at ? 'Read' : 'Unread'}
                  </span>
                  <h3>{notification.title}</h3>
                </div>
                <span
                  className="status-pill"
                  data-tone={notification.read_at ? 'muted' : 'success'}
                >
                  {notification.order_uuid
                    ? notification.order_uuid.slice(0, 8).toUpperCase()
                    : 'GENERAL'}
                </span>
              </header>

              <div className="board-meta">
                <span>{humanize(notification.notification_type)}</span>
                <span>
                  {notification.created_at
                    ? new Date(notification.created_at).toLocaleString()
                    : 'Queued'}
                </span>
              </div>

              <p className="board-note">{notification.body}</p>

              <footer className="card-actions">
                {!notification.read_at ? (
                  <button
                    className="action-button secondary"
                    disabled={
                      markReadMutation.isPending &&
                      markReadMutation.variables === notification.id
                    }
                    onClick={() => markReadMutation.mutate(notification.id)}
                    aria-label={`Mark read: ${notification.title}`}
                    type="button"
                  >
                    {markReadMutation.isPending &&
                    markReadMutation.variables === notification.id
                      ? 'Marking...'
                      : 'Mark read'}
                  </button>
                ) : (
                  <span className="status-pill" data-tone="muted">
                    Acknowledged
                  </span>
                )}
              </footer>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>No notifications match the current filter</h3>
          <p>
            Unread filtering hides already acknowledged merchant in-app updates.
          </p>
        </div>
      )}
    </section>
  );
}
