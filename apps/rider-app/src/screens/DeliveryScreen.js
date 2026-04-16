import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import {
  acceptRiderAssignment,
  completeRiderDelivery,
  confirmRiderPickup,
  getCurrentRiderOrder,
  getRiderNavigationPlan,
} from '../rider-api';
import {
  AccentButton,
  ActionPill,
  InfoCard,
  ScreenFrame,
  SecondaryButton,
  TextField,
  screenStyles,
} from '../ui';

export function DeliveryScreen({
  openExternalUrl = (url) => Linking.openURL(url),
}) {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState();
  const [proofType, setProofType] = useState('recipient_confirmation');
  const [recipientName, setRecipientName] = useState('');
  const [proofNotes, setProofNotes] = useState('');
  const [proofReference, setProofReference] = useState('');
  const { data: order } = useQuery({
    queryKey: ['rider-current-order'],
    queryFn: getCurrentRiderOrder,
  });
  const { data: navigationPlan } = useQuery({
    enabled: Boolean(order?.uuid),
    queryKey: ['rider-navigation-plan', order?.uuid],
    queryFn: () => getRiderNavigationPlan(order.uuid),
  });

  function refreshQueries() {
    queryClient.invalidateQueries({ queryKey: ['rider-overview'] });
    queryClient.invalidateQueries({ queryKey: ['rider-assignments'] });
    queryClient.invalidateQueries({ queryKey: ['rider-current-order'] });
    queryClient.invalidateQueries({ queryKey: ['rider-navigation-plan'] });
    queryClient.invalidateQueries({ queryKey: ['rider-earnings'] });
  }

  async function handleNavigation(handoff) {
    try {
      await openExternalUrl(handoff.url);
      setFeedback(`Navigation handoff ready for ${handoff.label.toLowerCase()}.`);
    } catch (error) {
      setFeedback(error?.message ?? 'Navigation could not be opened.');
    }
  }

  const acceptMutation = useMutation({
    mutationFn: (orderUuid) => acceptRiderAssignment(orderUuid),
    onSuccess: () => {
      refreshQueries();
      setFeedback('Assignment accepted. Head to pickup.');
    },
    onError: (error) => {
      setFeedback(error.message ?? 'Assignment could not be accepted.');
    },
  });

  const pickupMutation = useMutation({
    mutationFn: (orderUuid) => confirmRiderPickup(orderUuid),
    onSuccess: () => {
      refreshQueries();
      setFeedback('Pickup confirmed. Capture proof before completing delivery.');
    },
    onError: (error) => {
      setFeedback(error.message ?? 'Pickup could not be confirmed.');
    },
  });

  const deliveryMutation = useMutation({
    mutationFn: (orderUuid) =>
      completeRiderDelivery(orderUuid, {
        proof_type: proofType,
        recipient_name: recipientName || null,
        proof_notes: proofNotes || null,
        proof_reference: proofReference || null,
      }),
    onSuccess: () => {
      refreshQueries();
      setFeedback('Delivery completed and proof captured.');
    },
    onError: (error) => {
      setFeedback(error.message ?? 'Delivery could not be completed.');
    },
  });

  const proofMetadata = order?.delivery_assignment?.proof_metadata;

  return (
    <ScreenFrame
      description="Pickup, delivery, and proof capture map directly to rider-scoped endpoints and order lifecycle transitions."
      eyebrow="Delivery detail"
      title="Complete the order and capture proof"
    >
      <View style={screenStyles.stacked}>
        <InfoCard
          accent="#26a69a"
          description={order?.branch_name ?? 'Assigned branch'}
          eyebrow="Current order"
          title={order?.customer_name ?? 'Waiting for assignment'}
        >
          <Text style={screenStyles.statValue}>
            {order?.delivery_address_snapshot?.line_1 ?? 'Drop-off loading'}
          </Text>
          <Text style={screenStyles.muted}>
            {order?.delivery_address_snapshot?.landmark ??
              'No landmark saved yet for this delivery.'}
          </Text>
          <ActionPill
            label={
              order?.status === 'delivered'
                ? 'Delivered'
                : order?.rider_actions?.[0] === 'confirm_pickup'
                  ? 'Ready for pickup confirmation'
                  : order?.rider_actions?.[0] === 'complete_delivery'
                    ? 'Ready for delivery completion'
                    : 'Waiting for assignment acceptance'
            }
          />
          <View style={screenStyles.buttonRow}>
            {order?.rider_actions?.includes('accept_assignment') ? (
              <AccentButton
                label="Accept assignment"
                onPress={() => acceptMutation.mutate(order.uuid)}
                testID="delivery-accept-assignment"
              />
            ) : null}
            {order?.rider_actions?.includes('confirm_pickup') ? (
              <AccentButton
                label="Confirm pickup"
                onPress={() => pickupMutation.mutate(order.uuid)}
                testID="confirm-pickup"
              />
            ) : null}
          </View>
        </InfoCard>

        <InfoCard
          accent="#112134"
          description="Proof metadata is kept structured so the same fields can later back real file uploads and support review tools."
          eyebrow="Proof capture"
          title={proofMetadata ? 'Proof already captured' : 'Capture delivery proof'}
        >
          <View style={screenStyles.form}>
            <View style={screenStyles.buttonRow}>
              <SecondaryButton
                label="Recipient confirmation"
                onPress={() => setProofType('recipient_confirmation')}
                testID="proof-type-recipient"
              />
              <SecondaryButton
                label="Photo"
                onPress={() => setProofType('photo')}
                testID="proof-type-photo"
              />
              <SecondaryButton
                label="Handoff code"
                onPress={() => setProofType('handoff_code')}
                testID="proof-type-handoff"
              />
            </View>
            <Text style={screenStyles.muted}>Selected proof mode: {proofType}</Text>
            <TextField
              label="Recipient name"
              onChangeText={setRecipientName}
              placeholder="Who received the order?"
              testID="delivery-recipient-name"
              value={recipientName}
            />
            <TextField
              label="Proof notes"
              multiline
              onChangeText={setProofNotes}
              placeholder="Lobby desk, handed to customer, or gate details"
              testID="delivery-proof-notes"
              value={proofNotes}
            />
            <TextField
              label="Proof reference"
              onChangeText={setProofReference}
              placeholder="Optional photo or handoff reference"
              testID="delivery-proof-reference"
              value={proofReference}
            />
            {order?.rider_actions?.includes('complete_delivery') ? (
              <AccentButton
                label="Complete delivery"
                onPress={() => deliveryMutation.mutate(order.uuid)}
                testID="complete-delivery"
              />
            ) : null}
          </View>
          {feedback ? <Text style={screenStyles.helperText}>{feedback}</Text> : null}
          {proofMetadata ? (
            <Text style={screenStyles.muted}>
              Delivered to {proofMetadata.recipient_name || 'recipient not specified'} using{' '}
              {proofMetadata.proof_type}.
            </Text>
          ) : null}
        </InfoCard>

        <InfoCard
          accent="#d9b675"
          description="Navigation handoff stays provider-agnostic in the shared layer, then resolves to an external Google Maps URL for this demo shell."
          eyebrow="Navigation"
          title="Pickup and drop-off routing"
        >
          <View style={screenStyles.stacked}>
            <View style={screenStyles.inlinePanel}>
              <Text style={screenStyles.inlineTitle}>
                {navigationPlan?.pickup.label ?? 'Pickup branch'}
              </Text>
              <Text style={screenStyles.muted}>
                {navigationPlan?.pickup.address ?? 'Waiting for pickup coordinates.'}
              </Text>
              <Text style={screenStyles.muted}>
                {navigationPlan?.pickup.estimate
                  ? `${navigationPlan.pickup.estimate.duration_minutes} min to pickup`
                  : 'Pickup ETA unavailable.'}
              </Text>
              {navigationPlan?.pickup.handoff ? (
                <SecondaryButton
                  label={navigationPlan.pickup.handoff.label}
                  onPress={() => handleNavigation(navigationPlan.pickup.handoff)}
                  testID="open-pickup-navigation"
                />
              ) : null}
            </View>

            <View style={screenStyles.inlinePanel}>
              <Text style={screenStyles.inlineTitle}>
                {navigationPlan?.dropoff.label ?? 'Drop-off address'}
              </Text>
              <Text style={screenStyles.muted}>
                {navigationPlan?.dropoff.address ?? 'Waiting for drop-off coordinates.'}
              </Text>
              <Text style={screenStyles.muted}>
                {navigationPlan?.dropoff.estimate
                  ? `${navigationPlan.dropoff.estimate.duration_minutes} min to drop-off`
                  : 'Drop-off ETA unavailable.'}
              </Text>
              {navigationPlan?.dropoff.handoff ? (
                <SecondaryButton
                  label={navigationPlan.dropoff.handoff.label}
                  onPress={() => handleNavigation(navigationPlan.dropoff.handoff)}
                  testID="open-dropoff-navigation"
                />
              ) : null}
            </View>
          </View>
        </InfoCard>

        {(order?.timeline ?? []).map((step) => (
          <InfoCard
            accent="#7fc7bc"
            description={
              step.metadata?.recipient_name
                ? `Recipient: ${step.metadata.recipient_name}`
                : step.metadata?.proof_type
                  ? `Proof type: ${step.metadata.proof_type}`
                  : step.actor_role ?? 'System event'
            }
            eyebrow="Timeline event"
            key={`${step.event_type}-${step.created_at}`}
            title={step.event_type.replaceAll('_', ' ')}
          >
            <Text style={screenStyles.muted}>
              {step.from_status ? `${step.from_status} -> ${step.to_status}` : 'Order event recorded'}
            </Text>
          </InfoCard>
        ))}
      </View>
    </ScreenFrame>
  );
}
