import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Text, View } from 'react-native';
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
      setFeedback(`Availability updated to ${availability}.`);
    },
  });

  return (
    <ScreenFrame
      description="Availability, assignment intake, pickup confirmation, and delivery proof now move through one rider-specific flow that matches the backend lifecycle."
      eyebrow="Rider app"
      title="Delivery flow optimized for one active order at a time."
    >
      <InfoCard
        accent="#26a69a"
        description={data?.pickupBranch}
        eyebrow="Active assignment"
        title={data?.orderUuid ? data.orderUuid.slice(0, 8).toUpperCase() : 'Waiting for dispatch'}
      >
        <Text style={screenStyles.statValue}>
          {data ? `${data.activeStops} active stop` : '...'}
        </Text>
        <Text style={screenStyles.muted}>
          {data
            ? `Customer ${data.customerName} - Drop-off ${data.dropoffArea}`
            : 'Waiting for dispatch data.'}
        </Text>
        {data ? <ActionPill label={`Next: ${data.nextActionLabel}`} /> : null}
      </InfoCard>

      <InfoCard
        accent="#7fc7bc"
        description="Assignment and support updates now surface through the rider's in-app inbox, separate from push delivery state."
        eyebrow="Inbox"
        title={
          notificationInbox
            ? `${notificationInbox.meta.unread_count} unread notification${
                notificationInbox.meta.unread_count === 1 ? '' : 's'
              }`
            : 'Loading rider inbox'
        }
      >
        <View style={screenStyles.row}>
          <ActionPill label={`${notificationInbox?.meta.total ?? 0} total`} />
          <ActionPill label={`${notificationInbox?.meta.unread_count ?? 0} unread`} />
        </View>
        <Text style={screenStyles.muted}>
          {notificationInbox?.data[0]
            ? `${notificationInbox.data[0].title} - ${notificationInbox.data[0].body}`
            : 'Dispatch and support notifications will appear here for the active rider session.'}
        </Text>
      </InfoCard>

      <InfoCard
        accent="#112134"
        description="The rider shell mirrors the dispatch assumptions from the backend: no batching, no route optimization, no stacked orders in v1."
        eyebrow="Availability"
        title={data ? data.availability : '...'}
      >
        <Text style={screenStyles.muted}>
          Toggle online state, then accept, pick up, deliver, and capture proof.
        </Text>
        <View style={screenStyles.buttonRow}>
          <AccentButton
            label="Go available"
            onPress={() => availabilityMutation.mutate('available')}
            testID="set-rider-available"
          />
          <SecondaryButton
            label="Go offline"
            onPress={() => availabilityMutation.mutate('offline')}
            testID="set-rider-offline"
          />
        </View>
        {feedback ? <Text style={screenStyles.helperText}>{feedback}</Text> : null}
      </InfoCard>

      <InfoCard
        accent="#7fc7bc"
        description="Route files stay in Expo Router, while the screens stay testable as plain React Native components with one mutable assignment state."
        eyebrow="Next steps"
        title="Rider actions"
      >
        <View style={screenStyles.row}>{actions}</View>
      </InfoCard>
    </ScreenFrame>
  );
}
