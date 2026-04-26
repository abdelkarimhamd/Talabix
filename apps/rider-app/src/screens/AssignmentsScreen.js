import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { acceptRiderAssignment, getCurrentAssignments } from '../rider-api';
import {
  AccentButton,
  ActionPill,
  InfoCard,
  MetricTile,
  RouteStopCard,
  ScreenFrame,
  SectionHeader,
  colors,
  screenStyles,
} from '../ui';

export function AssignmentsScreen() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState();
  const { data: assignments = [] } = useQuery({
    queryKey: ['rider-assignments'],
    queryFn: getCurrentAssignments,
  });
  const acceptMutation = useMutation({
    mutationFn: (orderUuid) => acceptRiderAssignment(orderUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rider-overview'] });
      queryClient.invalidateQueries({ queryKey: ['rider-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['rider-current-order'] });
      setFeedback(
        'Assignment accepted. Head to the merchant and confirm pickup next.'
      );
    },
    onError: (error) => {
      setFeedback(error.message ?? 'Assignment could not be accepted.');
    },
  });
  const pendingAssignmentUuid = acceptMutation.isPending
    ? acceptMutation.variables
    : null;

  return (
    <ScreenFrame
      activeTab="assignments"
      description="Assignments surface the same operational facts the dispatch board uses: zone coverage, active load, and current rider state."
      eyebrow="Assignment queue"
      preserveHeaderText={false}
      showHeader={false}
      title="Accept or decline the next order"
    >
      <View style={screenStyles.section}>
        <Text style={screenStyles.pageKicker}>Assignment queue</Text>
        <Text style={screenStyles.compactTitle}>
          Accept or decline the next order
        </Text>
      </View>

      <View style={screenStyles.metricRail}>
        <MetricTile
          label="Open assignments"
          tone="yellow"
          value={assignments.length}
        />
        <MetricTile
          label="Rider load"
          value={assignments.length ? '1 active' : 'Clear'}
        />
      </View>

      <View style={screenStyles.stacked}>
        {assignments.length === 0 ? (
          <InfoCard
            accent={colors.green}
            description="Once dispatch assigns an order, it will appear here with the next required rider action."
            eyebrow="No active assignments"
            title="Dispatch queue is clear"
          >
            <Text style={screenStyles.emptyState}>
              No assigned or picked-up orders are waiting for this rider right
              now.
            </Text>
          </InfoCard>
        ) : null}

        {assignments.map((assignment) => (
          <InfoCard
            accent={colors.primary}
            description={`Pickup from ${assignment.branch_name ?? 'assigned branch'}`}
            eyebrow="Dispatch candidate"
            key={assignment.uuid}
            title={assignment.customer_name ?? 'Assigned customer'}
          >
            <RouteStopCard
              accent={colors.primary}
              description={
                assignment.delivery_address_snapshot?.delivery_notes ??
                'No extra drop-off notes saved yet.'
              }
              eyebrow="Drop-off"
              meta={assignment.delivery_address_snapshot?.city ?? 'Riyadh'}
              title={
                assignment.delivery_address_snapshot?.line_1 ??
                'Drop-off loading'
              }
            />
            <ActionPill
              tone={
                assignment.delivery_assignment?.accepted_at
                  ? 'success'
                  : 'warning'
              }
              label={
                assignment.delivery_assignment?.accepted_at
                  ? 'Assignment accepted'
                  : 'Waiting for rider acceptance'
              }
            />
            <View style={screenStyles.buttonRow}>
              {assignment.rider_actions.includes('accept_assignment') ? (
                <AccentButton
                  disabled={pendingAssignmentUuid === assignment.uuid}
                  label={
                    pendingAssignmentUuid === assignment.uuid
                      ? 'Accepting'
                      : 'Accept assignment'
                  }
                  onPress={() => acceptMutation.mutate(assignment.uuid)}
                  testID="accept-assignment"
                />
              ) : null}
            </View>
          </InfoCard>
        ))}

        {feedback ? (
          <Text style={screenStyles.helperText}>{feedback}</Text>
        ) : null}
      </View>

      <View style={screenStyles.section}>
        <SectionHeader title="Dispatch context" />
        <Text style={screenStyles.muted}>
          Assignments surface the same operational facts the dispatch board uses:
          zone coverage, active load, and current rider state.
        </Text>
      </View>
    </ScreenFrame>
  );
}
