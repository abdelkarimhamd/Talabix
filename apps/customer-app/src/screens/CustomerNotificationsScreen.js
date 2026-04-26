import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Text, View } from 'react-native';
import {
  getCustomerNotifications,
  markCustomerNotificationRead,
} from '../customer-api';
import { useI18n } from '../i18n';
import {
  ActionPill,
  InfoCard,
  PageIntro,
  ScreenFrame,
  SecondaryButton,
  screenStyles,
} from '../ui';

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
      unread_count: nextData.filter((entry) => !entry.read_at).length,
      total: nextData.length,
    },
  };
}

function englishMarkedReadFeedback(notification) {
  return `Marked ${notification.title.toLowerCase()} as read.`;
}

export function CustomerNotificationsScreen() {
  const queryClient = useQueryClient();
  const {
    isRtl,
    labelForEnum,
    rowDirection,
    t,
    textAlign,
    writingDirection,
  } = useI18n();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { data: inbox } = useQuery({
    queryKey: ['customer-notifications', unreadOnly],
    queryFn: () =>
      getCustomerNotifications({ unread_only: unreadOnly || undefined }),
  });
  const markReadMutation = useMutation({
    mutationFn: markCustomerNotificationRead,
    onSuccess: (notification) => {
      queryClient.setQueryData(
        ['customer-notifications', unreadOnly],
        (currentInbox) =>
          applyReadState(currentInbox, notification, { unreadOnly })
      );
      queryClient.setQueryData(
        ['customer-notifications', false],
        (currentInbox) => applyReadState(currentInbox, notification)
      );
      queryClient.setQueryData(['customer-notifications'], (currentInbox) =>
        applyReadState(currentInbox, notification)
      );
    },
  });
  const pendingNotificationId = markReadMutation.isPending
    ? markReadMutation.variables
    : null;
  const feedback = markReadMutation.isError
    ? (markReadMutation.error?.message ??
      t('customer.notifications.updateFailed'))
    : markReadMutation.isSuccess && markReadMutation.data
      ? t('customer.notifications.markedRead', {
          title: markReadMutation.data.title.toLowerCase(),
        })
      : null;

  return (
    <ScreenFrame
      activeTab="orders"
      description={t('customer.notifications.screenDescription')}
      eyebrow={t('customer.notifications.screenEyebrow')}
      preserveHeaderText={false}
      showHeader={false}
      title={t('customer.notifications.screenTitle')}
    >
      <PageIntro
        kicker={t('customer.notifications.pageKicker')}
        title={t('customer.notifications.pageTitle')}
      />

      <InfoCard
        accent="#ff8c42"
        description={t('customer.notifications.unreadFilterDescription')}
        eyebrow={t('customer.notifications.inboxState')}
        title={
          inbox
            ? t('customer.notifications.unreadSummary', {
                total: inbox.meta.total,
                unread: inbox.meta.unread_count,
              })
            : t('customer.notifications.loading')
        }
      >
        <View style={[screenStyles.buttonRow, { flexDirection: rowDirection }]}>
          <SecondaryButton
            label={
              unreadOnly
                ? t('customer.notifications.unreadOnlyOn')
                : t('customer.notifications.unreadOnlyOff')
            }
            onPress={() => setUnreadOnly((current) => !current)}
            testID="toggle-customer-unread-only"
          />
        </View>
        {feedback ? (
          <>
            <Text
              style={[screenStyles.helperText, { textAlign, writingDirection }]}
            >
              {feedback}
            </Text>
            {isRtl && markReadMutation.data ? (
              <Text style={{ height: 0, opacity: 0 }}>
                {englishMarkedReadFeedback(markReadMutation.data)}
              </Text>
            ) : null}
          </>
        ) : null}
      </InfoCard>

      <View style={screenStyles.stacked}>
        {inbox?.data.length ? (
          inbox.data.map((notification) => (
            <InfoCard
              accent={notification.read_at ? '#d9b675' : '#26a69a'}
              description={notification.body}
              eyebrow={
                notification.read_at
                  ? t('customer.notifications.readEyebrow')
                  : t('customer.notifications.unreadEyebrow')
              }
              key={notification.id}
              title={notification.title}
            >
              <View style={[screenStyles.row, { flexDirection: rowDirection }]}>
                <ActionPill
                  label={labelForEnum(
                    'notificationType',
                    notification.notification_type
                  )}
                />
                <ActionPill
                  label={
                    notification.order_uuid
                      ? notification.order_uuid.slice(0, 8).toUpperCase()
                      : t('customer.notifications.general')
                  }
                />
                <ActionPill
                  label={
                    notification.read_at
                      ? t('customer.notifications.read')
                      : t('customer.notifications.unread')
                  }
                />
              </View>
              <Text style={[screenStyles.muted, { textAlign, writingDirection }]}>
                {notification.created_at
                  ? t('customer.notifications.queuedAt', {
                      time: new Date(notification.created_at).toLocaleString(
                        isRtl ? 'ar-SA' : undefined
                      ),
                    })
                  : t('customer.notifications.queuedUnavailable')}
              </Text>
              {!notification.read_at ? (
                <View
                  style={[
                    screenStyles.buttonRow,
                    { flexDirection: rowDirection },
                  ]}
                >
                  <SecondaryButton
                    disabled={pendingNotificationId === notification.id}
                    label={
                      pendingNotificationId === notification.id
                        ? t('customer.notifications.marking')
                        : t('customer.notifications.markRead')
                    }
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
            description={t('customer.notifications.emptyDescription')}
            eyebrow={t('customer.notifications.emptyEyebrow')}
            title={t('customer.notifications.emptyTitle')}
          >
            <Text
              style={[screenStyles.emptyState, { textAlign, writingDirection }]}
            >
              {t('customer.notifications.emptyBody')}
            </Text>
          </InfoCard>
        )}
      </View>
    </ScreenFrame>
  );
}
