import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// i18n-audit: strict
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useI18n } from '../i18n';
import { getRiderNotifications, getRiderOverview, updateRiderAvailability } from '../rider-api';
import {
  AccentButton,
  ActionPill,
  InfoCard,
  ScreenFrame,
  SecondaryButton,
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
  });

  return (
    <ScreenFrame
      description={t('rider.home.description')}
      eyebrow={t('rider.home.eyebrow')}
      title={t('rider.home.title')}
    >
      <Text testID="rider-locale-direction" style={{ height: 0, opacity: 0 }}>
        {dir}
      </Text>
      <InfoCard
        accent="#26a69a"
        description={data?.pickupBranch}
        eyebrow={t('rider.home.activeAssignment')}
        title={data?.orderUuid ? data.orderUuid.slice(0, 8).toUpperCase() : t('rider.home.waitingDispatch')}
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
        {data ? <ActionPill label={t('rider.home.nextAction', { action: data.nextActionLabel })} /> : null}
      </InfoCard>

      <InfoCard
        accent="#7fc7bc"
        description={t('rider.home.inboxDescription')}
        eyebrow={t('rider.home.inbox')}
        title={
          notificationInbox
            ? tp('rider.home.unreadNotifications', notificationInbox.meta.unread_count)
            : t('rider.home.loadingInbox')
        }
      >
        <View style={screenStyles.row}>
          <ActionPill label={t('common.total', { count: notificationInbox?.meta.total ?? 0 })} />
          <ActionPill
            label={t('common.unread', { count: notificationInbox?.meta.unread_count ?? 0 })}
          />
        </View>
        <Text style={screenStyles.muted}>
          {notificationInbox?.data[0]
            ? `${notificationInbox.data[0].title} - ${notificationInbox.data[0].body}`
            : t('rider.home.emptyInbox')}
        </Text>
      </InfoCard>

      <InfoCard
        accent="#112134"
        description={t('rider.home.availabilityDescription')}
        eyebrow={t('rider.home.availability')}
        title={data ? labelForEnum('riderAvailability', data.availability) : '...'}
      >
        <Text style={screenStyles.muted}>
          {t('rider.home.availabilityHelp')}
        </Text>
        <View style={screenStyles.buttonRow}>
          <AccentButton
            label={t('rider.home.goAvailable')}
            onPress={() => availabilityMutation.mutate('available')}
            testID="set-rider-available"
          />
          <SecondaryButton
            label={t('rider.home.goOffline')}
            onPress={() => availabilityMutation.mutate('offline')}
            testID="set-rider-offline"
          />
        </View>
        {feedback ? <Text style={screenStyles.helperText}>{feedback}</Text> : null}
      </InfoCard>

      <InfoCard
        accent="#7fc7bc"
        description={t('rider.home.nextStepsDescription')}
        eyebrow={t('rider.home.nextSteps')}
        title={t('rider.home.riderActions')}
      >
        <View style={screenStyles.row}>{actions}</View>
      </InfoCard>
    </ScreenFrame>
  );
}
