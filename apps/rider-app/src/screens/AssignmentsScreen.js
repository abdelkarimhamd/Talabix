import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { acceptRiderAssignment, getCurrentAssignments } from '../rider-api';
import {
  AccentButton,
  ActionPill,
  InfoCard,
  ScreenFrame,
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
      setFeedback('Assignment accepted. Head to the merchant and confirm pickup next.');
    },
    onError: (error) => {
      setFeedback(error.message ?? 'Assignment could not be accepted.');
    },
  });

  return (
    <ScreenFrame
      description="Assignments surface the same operational facts the dispatch board uses: zone coverage, active load, and current rider state."
      eyebrow="Assignment queue"
      title="Accept or decline the next order"
    >
      <View style={screenStyles.stacked}>
        {assignments.length === 0 ? (
          <InfoCard
            accent="#7fc7bc"
            description="Once dispatch assigns an order, it will appear here with the next required rider action."
            eyebrow="No active assignments"
            title="Dispatch queue is clear"
          >
            <Text style={screenStyles.emptyState}>
              No assigned or picked-up orders are waiting for this rider right now.
            </Text>
          </InfoCard>
        ) : null}

        {assignments.map((assignment) => (
          <InfoCard
            accent="#26a69a"
            description={`Pickup from ${assignment.branch_name ?? 'assigned branch'}`}
            eyebrow="Dispatch candidate"
            key={assignment.uuid}
            title={assignment.customer_name ?? 'Assigned customer'}
          >
            <Text style={screenStyles.statValue}>
              {assignment.delivery_address_snapshot?.line_1 ?? 'Drop-off loading'}
            </Text>
            <Text style={screenStyles.muted}>
              {assignment.delivery_address_snapshot?.delivery_notes ??
                'No extra drop-off notes saved yet.'}
            </Text>
            <ActionPill
              label={
                assignment.delivery_assignment?.accepted_at
                  ? 'Assignment accepted'
                  : 'Waiting for rider acceptance'
              }
            />
            <View style={screenStyles.buttonRow}>
              {assignment.rider_actions.includes('accept_assignment') ? (
                <AccentButton
                  label="Accept assignment"
                  onPress={() => acceptMutation.mutate(assignment.uuid)}
                  testID="accept-assignment"
                />
              ) : null}
            </View>
          </InfoCard>
        ))}

        {feedback ? <Text style={screenStyles.helperText}>{feedback}</Text> : null}
      </View>
    </ScreenFrame>
  );
}
