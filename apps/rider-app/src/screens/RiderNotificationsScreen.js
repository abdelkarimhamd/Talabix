import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { getRiderNotifications, markRiderNotificationRead } from '../rider-api';
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

export function RiderNotificationsScreen() {
  const queryClient = useQueryClient();
  const { labelForEnum } = useI18n();
  const [feedback, setFeedback] = useState();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { data: inbox } = useQuery({
    queryKey: ['rider-notifications', unreadOnly],
    queryFn: () => getRiderNotifications({ unread_only: unreadOnly || undefined }),
  });
  const markReadMutation = useMutation({
    mutationFn: markRiderNotificationRead,
    onSuccess: (notification) => {
      queryClient.setQueryData(['rider-notifications', unreadOnly], (currentInbox) =>
        applyReadState(currentInbox, notification)
      );
      queryClient.setQueryData(['rider-notifications'], (currentInbox) =>
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
      description="The rider inbox only shows in-app delivery records for the signed-in rider, so assignment context and support updates stay readable even when push state diverges."
      eyebrow="Rider inbox"
      title="Assignment updates and support notes stay attached to the run."
    >
      <InfoCard
        accent="#26a69a"
        description="Unread filtering is local to the rider actor surface and does not expose customer or merchant rows."
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
            testID="toggle-rider-unread-only"
          />
        </View>
        {feedback ? <Text style={screenStyles.helperText}>{feedback}</Text> : null}
      </InfoCard>

      <View style={screenStyles.stacked}>
        {inbox?.data.length ? (
          inbox.data.map((notification) => (
            <InfoCard
              accent={notification.read_at ? '#9ab8b3' : '#26a69a'}
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
                <ActionPill label={notification.read_at ? 'read' : 'unread'} />
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
                    testID={`mark-rider-notification-${notification.id}`}
                  />
                </View>
              ) : null}
            </InfoCard>
          ))
        ) : (
          <InfoCard
            accent="#9ab8b3"
            description="Unread filtering may hide notifications that were already acknowledged."
            eyebrow="Inbox empty"
            title="No rider notifications match the current filter."
          >
            <Text style={screenStyles.emptyState}>
              Notification delivery state is still stored per order, but this view only surfaces in-app rows relevant to the current rider.
            </Text>
          </InfoCard>
        )}
      </View>
    </ScreenFrame>
  );
}
