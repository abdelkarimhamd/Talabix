import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import {
  acceptRiderAssignment,
  completeRiderDelivery,
  confirmRiderPickup,
  getCurrentRiderOrder,
  getRiderNavigationPlan,
  reportRiderDeliveryException,
} from '../rider-api';
import { useI18n } from '../i18n';
import {
  AccentButton,
  ActionPill,
  InfoCard,
  MetricTile,
  RouteStopCard,
  ScreenFrame,
  SectionHeader,
  SecondaryButton,
  TextField,
  TimelineEventRow,
  colors,
  screenStyles,
} from '../ui';

export function DeliveryScreen({
  openExternalUrl = (url) => Linking.openURL(url),
}) {
  const { labelForEnum } = useI18n();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState();
  const [proofType, setProofType] = useState('recipient_confirmation');
  const [recipientName, setRecipientName] = useState('');
  const [proofNotes, setProofNotes] = useState('');
  const [proofReference, setProofReference] = useState('');
  const [exceptionReason, setExceptionReason] = useState('address_issue');
  const [exceptionNote, setExceptionNote] = useState('');
  const [pendingNavigationKey, setPendingNavigationKey] = useState(null);
  const pendingNavigationRef = useRef(null);
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

  async function handleNavigation(handoff, handoffKey) {
    if (pendingNavigationRef.current) {
      return;
    }

    pendingNavigationRef.current = handoffKey;
    setPendingNavigationKey(handoffKey);

    try {
      await openExternalUrl(handoff.url);
      setFeedback(
        `Navigation handoff ready for ${handoff.label.toLowerCase()}.`
      );
    } catch (error) {
      setFeedback(error?.message ?? 'Navigation could not be opened.');
    } finally {
      pendingNavigationRef.current = null;
      setPendingNavigationKey(null);
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
      setFeedback(
        'Pickup confirmed. Capture proof before completing delivery.'
      );
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

  const exceptionMutation = useMutation({
    mutationFn: (orderUuid) =>
      reportRiderDeliveryException(orderUuid, {
        reason_code: exceptionReason,
        note: exceptionNote || null,
      }),
    onSuccess: (nextOrder) => {
      refreshQueries();
      const reasonCode =
        nextOrder.active_delivery_exception?.reason_code ?? exceptionReason;
      setFeedback(
        `Delivery issue reported: ${labelForEnum(
          'deliveryExceptionReason',
          reasonCode
        )}.`
      );
    },
    onError: (error) => {
      setFeedback(error.message ?? 'Delivery issue could not be reported.');
    },
  });

  const proofMetadata = order?.delivery_assignment?.proof_metadata;
  const activeException = order?.active_delivery_exception;
  const activeExceptionReasonLabel = activeException
    ? labelForEnum('deliveryExceptionReason', activeException.reason_code)
    : null;
  const selectedProofTypeLabel = labelForEnum('proofType', proofType);
  const exceptionReasons = [
    'customer_unreachable',
    'address_issue',
    'merchant_delay',
    'vehicle_issue',
    'safety_issue',
    'other',
  ];
  const acceptDisabled = acceptMutation.isPending;
  const pickupDisabled = pickupMutation.isPending;
  const deliveryDisabled = deliveryMutation.isPending;
  const exceptionDisabled = exceptionMutation.isPending || !order?.uuid;

  return (
    <ScreenFrame
      activeTab="delivery"
      description="Pickup, delivery, and proof capture map directly to rider-scoped endpoints and order lifecycle transitions."
      eyebrow="Delivery detail"
      preserveHeaderText={false}
      showHeader={false}
      title="Complete the order and capture proof"
    >
      <View style={screenStyles.section}>
        <Text style={screenStyles.pageKicker}>Delivery detail</Text>
        <Text style={screenStyles.compactTitle}>
          Complete the order and capture proof
        </Text>
      </View>

      <View style={screenStyles.metricRail}>
        <MetricTile
          label="Order status"
          tone="yellow"
          value={order ? labelForEnum('orderStatus', order.status) : '...'}
        />
        <MetricTile
          label="Stops"
          value={order ? `${order.item_count ?? 0} items` : '...'}
        />
      </View>

      <View style={screenStyles.stacked}>
        <InfoCard
          accent={colors.primary}
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
            tone={
              order?.status === 'delivered'
                ? 'success'
                : order?.rider_actions?.[0]
                  ? 'warning'
                  : 'neutral'
            }
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
                disabled={acceptDisabled}
                label={acceptDisabled ? 'Accepting' : 'Accept assignment'}
                onPress={() => acceptMutation.mutate(order.uuid)}
                testID="delivery-accept-assignment"
              />
            ) : null}
            {order?.rider_actions?.includes('confirm_pickup') ? (
              <AccentButton
                disabled={pickupDisabled}
                label={pickupDisabled ? 'Confirming pickup' : 'Confirm pickup'}
                onPress={() => pickupMutation.mutate(order.uuid)}
                testID="confirm-pickup"
              />
            ) : null}
          </View>
        </InfoCard>

        <InfoCard
          accent={colors.orange}
          description="Report a delivery issue while keeping the order open for support, reassignment, or final proof capture."
          eyebrow="Delivery issue"
          title={
            activeException
              ? activeExceptionReasonLabel
              : 'Report delivery issue'
          }
        >
          <View style={screenStyles.form}>
            <View style={screenStyles.buttonRow}>
              {exceptionReasons.map((reasonCode) => (
                <SecondaryButton
                  active={exceptionReason === reasonCode}
                  key={reasonCode}
                  label={labelForEnum('deliveryExceptionReason', reasonCode)}
                  onPress={() => setExceptionReason(reasonCode)}
                  testID={`delivery-exception-${reasonCode.replaceAll('_', '-')}`}
                />
              ))}
            </View>
            <Text style={screenStyles.muted}>
              Selected issue:{' '}
              {labelForEnum('deliveryExceptionReason', exceptionReason)}
            </Text>
            <TextField
              label="Issue note"
              multiline
              onChangeText={setExceptionNote}
              placeholder="Customer unreachable, address blocked, vehicle issue"
              testID="delivery-exception-note"
              value={exceptionNote}
            />
            {['assigned', 'picked_up'].includes(order?.status) &&
            order?.delivery_assignment?.accepted_at ? (
              <AccentButton
                disabled={exceptionDisabled}
                label={
                  exceptionMutation.isPending
                    ? 'Reporting issue'
                    : 'Report delivery issue'
                }
                onPress={() => exceptionMutation.mutate(order.uuid)}
                testID="report-delivery-exception"
              />
            ) : null}
          </View>
          {activeException ? (
            <Text style={screenStyles.muted}>
              {activeExceptionReasonLabel}:{' '}
              {activeException.note ?? 'No note added.'}
            </Text>
          ) : null}
        </InfoCard>

        <InfoCard
          accent={colors.dark}
          description="Proof metadata is kept structured so the same fields can later back real file uploads and support review tools."
          eyebrow="Proof capture"
          title={
            proofMetadata ? 'Proof already captured' : 'Capture delivery proof'
          }
        >
          <View style={screenStyles.form}>
            <View style={screenStyles.buttonRow}>
              <SecondaryButton
                active={proofType === 'recipient_confirmation'}
                label={labelForEnum('proofType', 'recipient_confirmation')}
                onPress={() => setProofType('recipient_confirmation')}
                testID="proof-type-recipient"
              />
              <SecondaryButton
                active={proofType === 'photo'}
                label={labelForEnum('proofType', 'photo')}
                onPress={() => setProofType('photo')}
                testID="proof-type-photo"
              />
              <SecondaryButton
                active={proofType === 'handoff_code'}
                label={labelForEnum('proofType', 'handoff_code')}
                onPress={() => setProofType('handoff_code')}
                testID="proof-type-handoff"
              />
            </View>
            <Text style={screenStyles.muted}>
              Selected proof mode: {selectedProofTypeLabel}
            </Text>
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
                disabled={deliveryDisabled}
                label={
                  deliveryDisabled ? 'Completing delivery' : 'Complete delivery'
                }
                onPress={() => deliveryMutation.mutate(order.uuid)}
                testID="complete-delivery"
              />
            ) : null}
          </View>
          {feedback ? (
            <Text style={screenStyles.helperText}>{feedback}</Text>
          ) : null}
          {proofMetadata ? (
            <Text style={screenStyles.muted}>
              Delivered to{' '}
              {proofMetadata.recipient_name || 'recipient not specified'} using{' '}
              {labelForEnum('proofType', proofMetadata.proof_type)}.
            </Text>
          ) : null}
        </InfoCard>

        <InfoCard
          accent={colors.primaryDeep}
          description="Navigation handoff stays provider-agnostic in the shared layer, then resolves to an external Google Maps URL for this demo shell."
          eyebrow="Navigation"
          title="Pickup and drop-off routing"
        >
          <View style={screenStyles.stacked}>
            <RouteStopCard
              accent={colors.primary}
              action={
                navigationPlan?.pickup.handoff ? (
                  <SecondaryButton
                    disabled={Boolean(pendingNavigationKey)}
                    label={
                      pendingNavigationKey === 'pickup'
                        ? 'Opening navigation'
                        : navigationPlan.pickup.handoff.label
                    }
                    onPress={() =>
                      handleNavigation(navigationPlan.pickup.handoff, 'pickup')
                    }
                    testID="open-pickup-navigation"
                  />
                ) : null
              }
              description={
                navigationPlan?.pickup.address ??
                'Waiting for pickup coordinates.'
              }
              eyebrow="Pickup"
              meta={
                navigationPlan?.pickup.estimate
                  ? `${navigationPlan.pickup.estimate.duration_minutes} min to pickup`
                  : 'Pickup ETA unavailable.'
              }
              title={navigationPlan?.pickup.label ?? 'Pickup branch'}
            />

            <RouteStopCard
              accent={colors.green}
              action={
                navigationPlan?.dropoff.handoff ? (
                  <SecondaryButton
                    disabled={Boolean(pendingNavigationKey)}
                    label={
                      pendingNavigationKey === 'dropoff'
                        ? 'Opening navigation'
                        : navigationPlan.dropoff.handoff.label
                    }
                    onPress={() =>
                      handleNavigation(
                        navigationPlan.dropoff.handoff,
                        'dropoff'
                      )
                    }
                    testID="open-dropoff-navigation"
                  />
                ) : null
              }
              description={
                navigationPlan?.dropoff.address ??
                'Waiting for drop-off coordinates.'
              }
              eyebrow="Drop-off"
              meta={
                navigationPlan?.dropoff.estimate
                  ? `${navigationPlan.dropoff.estimate.duration_minutes} min to drop-off`
                  : 'Drop-off ETA unavailable.'
              }
              title={navigationPlan?.dropoff.label ?? 'Drop-off address'}
            />
          </View>
        </InfoCard>

        <View style={screenStyles.section}>
          <SectionHeader title="Order timeline" />
        </View>

        {(order?.timeline ?? []).map((step) => (
          <InfoCard
            accent={colors.green}
            description={
              step.metadata?.recipient_name
                ? `Recipient: ${step.metadata.recipient_name}`
                : step.metadata?.proof_type
                  ? `Proof type: ${labelForEnum('proofType', step.metadata.proof_type)}`
                  : (step.actor_role ?? 'System event')
            }
            eyebrow="Timeline event"
            key={`${step.event_type}-${step.created_at}`}
            title={
              step.created_at
                ? new Date(step.created_at).toLocaleString()
                : 'Recorded event'
            }
          >
            <TimelineEventRow
              description={
                step.from_status
                  ? `${labelForEnum('orderStatus', step.from_status)} -> ${labelForEnum(
                      'orderStatus',
                      step.to_status
                    )}`
                  : 'Order event recorded'
              }
              label={step.actor_role ?? 'System event'}
              title={labelForEnum('orderTimelineEventType', step.event_type)}
            />
          </InfoCard>
        ))}
      </View>
    </ScreenFrame>
  );
}
