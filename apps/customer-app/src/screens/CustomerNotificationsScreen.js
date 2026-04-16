import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { getCustomerNotifications, markCustomerNotificationRead } from '../customer-api';
import { useI18n } from '../i18n';
import {
  ActionPill,
  InfoCard,
  ScreenFrame,
  SecondaryButton,
  screenStyles,
} from '../ui';

function applyReadState(currentInbox, notification) {
  if (!currentInbox) {
    return currentInbox;
  }

  const nextData = currentInbox.data.map((entry) =>
    entry.id === notification.id ? notification : entry
  );

  return {
    data: nextData,
    meta: {
      ...currentInbox.meta,
      unread_count: nextData.filter((entry) => !entry.read_at).length,
      total: nextData.length,
    },
  };
}

export function CustomerNotificationsScreen() {
  const queryClient = useQueryClient();
  const { labelForEnum } = useI18n();
  const [feedback, setFeedback] = useState();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { data: inbox } = useQuery({
    queryKey: ['customer-notifications', unreadOnly],
    queryFn: () => getCustomerNotifications({ unread_only: unreadOnly || undefined }),
  });
  const markReadMutation = useMutation({
    mutationFn: markCustomerNotificationRead,
    onSuccess: (notification) => {
      queryClient.setQueryData(['customer-notifications', unreadOnly], (currentInbox) =>
        applyReadState(currentInbox, notification)
      );
      queryClient.setQueryData(['customer-notifications'], (currentInbox) =>
        applyReadState(currentInbox, notification)
      );
      setFeedback(`Marked ${notification.title.toLowerCase()} as read.`);
    },
    onError: (error) => {
      setFeedback(error.message ?? 'Notification could not be updated.');
    },
  });

  return (
    <ScreenFrame
      description="The customer inbox is backed by in-app delivery records only, so read-state stays separate from email or push delivery attempts."
      eyebrow="Customer inbox"
      title="Notification history stays attached to real order updates."
    >
      <InfoCard
        accent="#ff8c42"
        description="Unread filtering is actor-scoped and only returns the current customer's in-app rows."
        eyebrow="Inbox state"
        title={
          inbox
            ? `${inbox.meta.unread_count} unread of ${inbox.meta.total}`
            : 'Loading notifications'
        }
      >
        <View style={screenStyles.buttonRow}>
          <SecondaryButton
            label={unreadOnly ? 'Unread only: on' : 'Unread only: off'}
            onPress={() => setUnreadOnly((current) => !current)}
            testID="toggle-customer-unread-only"
          />
        </View>
        {feedback ? <Text style={screenStyles.helperText}>{feedback}</Text> : null}
      </InfoCard>

      <View style={screenStyles.stacked}>
        {inbox?.data.length ? (
          inbox.data.map((notification) => (
            <InfoCard
              accent={notification.read_at ? '#d9b675' : '#26a69a'}
              description={notification.body}
              eyebrow={notification.read_at ? 'Read' : 'Unread'}
              key={notification.id}
              title={notification.title}
            >
              <View style={screenStyles.row}>
                <ActionPill label={labelForEnum('notificationType', notification.notification_type)} />
                <ActionPill
                  label={notification.order_uuid ? notification.order_uuid.slice(0, 8).toUpperCase() : 'General'}
                />
                <ActionPill
                  label={notification.read_at ? 'read' : 'unread'}
                />
              </View>
              <Text style={screenStyles.muted}>
                {notification.created_at
                  ? `Queued ${new Date(notification.created_at).toLocaleString()}`
                  : 'Queued timestamp unavailable.'}
              </Text>
              {!notification.read_at ? (
                <View style={screenStyles.buttonRow}>
                  <SecondaryButton
                    label="Mark read"
                    onPress={() => markReadMutation.mutate(notification.id)}
                    testID={`mark-customer-notification-${notification.id}`}
                  />
                </View>
              ) : null}
            </InfoCard>
          ))
        ) : (
          <InfoCard
            accent="#d9b675"
            description="Unread filtering may hide notifications that were already acknowledged."
            eyebrow="Inbox empty"
            title="No notifications match the current filter."
          >
            <Text style={screenStyles.emptyState}>
              Customer inbox state is driven from the same order-linked notification records used by the backend actor routes.
            </Text>
          </InfoCard>
        )}
      </View>
    </ScreenFrame>
  );
}
