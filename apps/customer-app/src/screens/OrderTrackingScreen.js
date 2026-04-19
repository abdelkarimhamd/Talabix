import { useQuery } from '@tanstack/react-query';
import { Text, View } from 'react-native';
import { getActiveOrder, getCustomerOrder } from '../customer-api';
import { useI18n } from '../i18n';
import {
  ActionPill,
  InfoCard,
  PriceSummaryRow,
  PromoBanner,
  ScreenFrame,
  SectionHeader,
  colors,
  screenStyles,
} from '../ui';

const timelineOrder = [
  'order_placed',
  'merchant_accepted',
  'dispatch_started',
  'rider_assigned',
  'picked_up',
  'delivered',
];

export function OrderTrackingScreen({ orderId }) {
  const { formatCurrency, labelForEnum } = useI18n();
  const { data: order } = useQuery({
    queryKey: ['customer-order', orderId],
    queryFn: () => (orderId ? getCustomerOrder(orderId) : getActiveOrder()),
  });
  const completedEvents = new Set(
    order?.timeline.map((event) => event.event_type) ?? []
  );

  return (
    <ScreenFrame
      activeTab="orders"
      description="Realtime order updates map directly to the append-only order timeline and actor-specific broadcast channels."
      eyebrow="Live tracking"
      title="Talabix order tracking"
    >
      <PromoBanner
        description={`Order ${orderId ?? order?.uuid ?? 'loading'}`}
        eyebrow="Current status"
        title="Tracking your delivery"
      />

      <InfoCard
        accent={colors.green}
        description="The app keeps a simple status tracker so customers can see where the order is without reading the raw timeline."
        eyebrow="Tracking summary"
        title={
          order ? labelForEnum('orderStatus', order.status) : 'Loading status'
        }
      >
        <PriceSummaryRow
          label="Order total"
          strong
          value={
            order ? formatCurrency(order.total_minor, order.currency) : '--'
          }
        />
        <View style={screenStyles.row}>
          <ActionPill
            label={
              order
                ? `${order.timeline.length} lifecycle events visible on-device.`
                : 'Waiting for tracking events.'
            }
          />
          <ActionPill label="COD" />
        </View>
      </InfoCard>

      <View style={screenStyles.section}>
        <SectionHeader title="Delivery progress" />
        <View style={screenStyles.stacked}>
          {timelineOrder.map((eventType, index) => (
            <InfoCard
              accent={
                completedEvents.has(eventType) ? colors.green : colors.line
              }
              description={`${labelForEnum('orderTimelineEventType', eventType)} - ${
                completedEvents.has(eventType) ? 'completed' : 'waiting'
              }`}
              eyebrow={completedEvents.has(eventType) ? 'Done' : 'Next'}
              key={eventType}
              title={`Step ${index + 1}`}
            />
          ))}
        </View>
      </View>

      <View style={screenStyles.section}>
        <SectionHeader title="Timeline" />
        <View style={screenStyles.stacked}>
          {order?.timeline.map((event) => (
            <InfoCard
              accent={colors.primaryDeep}
              description={event.created_at ?? 'timestamp pending'}
              eyebrow="Timeline event"
              key={`${event.event_type}-${event.created_at}`}
              title={labelForEnum('orderTimelineEventType', event.event_type)}
            />
          ))}
        </View>
      </View>

      {!order ? (
        <Text style={screenStyles.emptyState}>Waiting for order data.</Text>
      ) : null}
    </ScreenFrame>
  );
}
