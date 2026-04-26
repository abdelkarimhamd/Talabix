import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// i18n-audit: strict
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useI18n } from '../i18n';
import {
  getRiderNotifications,
  getRiderOverview,
  updateRiderAvailability,
} from '../rider-api';
import {
  AccentButton,
  ActionPill,
  MetricTile,
  InfoCard,
  RiderTopBar,
  ScreenFrame,
  SectionHeader,
  SecondaryButton,
  colors,
  screenStyles,
} from '../ui';

export function RiderHomeScreen({ actions = null }) {
  const { dir, labelForEnum, t, tp } = useI18n();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState();
  const { data } = useQuery({
    queryKey: ['rider-overview'],
    queryFn: getRiderOverview,
  });
  const { data: notificationInbox } = useQuery({
    queryKey: ['rider-notifications'],
    queryFn: () => getRiderNotifications(),
  });
  const availabilityMutation = useMutation({
    mutationFn: updateRiderAvailability,
    onSuccess: (_, availability) => {
      queryClient.invalidateQueries({ queryKey: ['rider-overview'] });
      setFeedback(
        t('rider.home.availabilityUpdated', {
          availability: labelForEnum('riderAvailability', availability),
        })
      );
    },
    onError: (error) => {
      setFeedback(error.message ?? t('rider.home.availabilityUpdateFailed'));
    },
  });
  const isAvailabilityPending = availabilityMutation.isPending;
  const pendingAvailabilityLabel = t('rider.home.updatingAvailability');

  return (
    <ScreenFrame
      activeTab="home"
      description={t('rider.home.description')}
      eyebrow={t('rider.home.eyebrow')}
      preserveHeaderText={false}
      showHeader={false}
      title={t('rider.home.title')}
    >
      <Text testID="rider-locale-direction" style={{ height: 0, opacity: 0 }}>
        {dir}
      </Text>
      <RiderTopBar
        meta={data?.pickupBranch ?? 'Riyadh delivery run'}
        name={notificationInbox?.data[0]?.recipient_name ?? 'Reem Al-Shehri'}
        status={t('rider.home.availability')}
      />

      <View style={screenStyles.section}>
        <Text style={screenStyles.pageKicker}>
          {t('rider.home.eyebrow')}
        </Text>
        <Text style={screenStyles.compactTitle}>{t('rider.home.title')}</Text>
      </View>

      <View style={screenStyles.metricRail}>
        <MetricTile
          label={t('rider.home.activeAssignment')}
          tone="yellow"
          value={data ? tp('rider.home.activeStops', data.activeStops) : '...'}
        />
        <MetricTile
          label={t('rider.home.inbox')}
          value={
            notificationInbox
              ? tp(
                  'rider.home.unreadNotifications',
                  notificationInbox.meta.unread_count
                )
              : '...'
          }
        />
      </View>

      <InfoCard
        accent={colors.primary}
        description={data?.pickupBranch}
        eyebrow={t('rider.home.activeAssignment')}
        title={
          data?.orderUuid
            ? data.orderUuid.slice(0, 8).toUpperCase()
            : t('rider.home.waitingDispatch')
        }
      >
        <Text style={screenStyles.statValue}>
          {data ? tp('rider.home.activeStops', data.activeStops) : '...'}
        </Text>
        <Text style={screenStyles.muted}>
          {data
            ? t('rider.home.customerDropoff', {
                customer: data.customerName,
                dropoff: data.dropoffArea,
              })
            : t('rider.home.waitingDispatchData')}
        </Text>
        {data ? (
          <ActionPill
            tone="warning"
            label={t('rider.home.nextAction', { action: data.nextActionLabel })}
          />
        ) : null}
      </InfoCard>

      <InfoCard
        accent={colors.green}
        description={t('rider.home.inboxDescription')}
        eyebrow={t('rider.home.inbox')}
        title={
          notificationInbox
            ? tp(
                'rider.home.unreadNotifications',
                notificationInbox.meta.unread_count
              )
            : t('rider.home.loadingInbox')
        }
      >
        <View style={screenStyles.row}>
          <ActionPill
            tone="warning"
            label={t('common.total', {
              count: notificationInbox?.meta.total ?? 0,
            })}
          />
          <ActionPill
            tone="success"
            label={t('common.unread', {
              count: notificationInbox?.meta.unread_count ?? 0,
            })}
          />
        </View>
        <Text style={screenStyles.muted}>
          {notificationInbox?.data[0]
            ? `${notificationInbox.data[0].title} - ${notificationInbox.data[0].body}`
            : t('rider.home.emptyInbox')}
        </Text>
      </InfoCard>

      <InfoCard
        accent={colors.dark}
        description={t('rider.home.availabilityDescription')}
        eyebrow={t('rider.home.availability')}
        title={
          data ? labelForEnum('riderAvailability', data.availability) : '...'
        }
      >
        <Text style={screenStyles.muted}>
          {t('rider.home.availabilityHelp')}
        </Text>
        <View style={screenStyles.buttonRow}>
          <AccentButton
            disabled={isAvailabilityPending}
            label={
              isAvailabilityPending &&
              availabilityMutation.variables === 'available'
                ? pendingAvailabilityLabel
                : t('rider.home.goAvailable')
            }
            onPress={() => availabilityMutation.mutate('available')}
            testID="set-rider-available"
          />
          <SecondaryButton
            disabled={isAvailabilityPending}
            label={
              isAvailabilityPending &&
              availabilityMutation.variables === 'offline'
                ? pendingAvailabilityLabel
                : t('rider.home.goOffline')
            }
            onPress={() => availabilityMutation.mutate('offline')}
            testID="set-rider-offline"
          />
        </View>
        {feedback ? (
          <Text style={screenStyles.helperText}>{feedback}</Text>
        ) : null}
      </InfoCard>

      {actions ? (
        <View style={screenStyles.section}>
          <SectionHeader title={t('rider.home.riderActions')} />
          <Text style={screenStyles.muted}>
            {t('rider.home.nextStepsDescription')}
          </Text>
          <View style={screenStyles.buttonRow}>{actions}</View>
        </View>
      ) : null}
    </ScreenFrame>
  );
}
