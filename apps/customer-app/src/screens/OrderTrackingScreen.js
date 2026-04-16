import { useQuery } from '@tanstack/react-query';
import { Text, View } from 'react-native';
import { getActiveOrder, getCustomerOrder } from '../customer-api';
import { InfoCard, ScreenFrame, screenStyles } from '../ui';

export function OrderTrackingScreen({ orderId }) {
  const { data: order } = useQuery({
    queryKey: ['customer-order', orderId],
    queryFn: () => (orderId ? getCustomerOrder(orderId) : getActiveOrder()),
  });

  return (
    <ScreenFrame
      description="Realtime order updates map directly to the append-only order timeline and actor-specific broadcast channels."
      eyebrow="Live tracking"
      title="Talabix order tracking"
    >
      <InfoCard
        accent="#26a69a"
        description={`Order ${orderId ?? order?.uuid ?? 'loading'}`}
        eyebrow="Current status"
        title={order ? order.status.replaceAll('_', ' ') : 'Loading status'}
      >
        <Text style={screenStyles.statValue}>
          {order ? `${(order.total_minor / 100).toFixed(2)} ${order.currency}` : '--'}
        </Text>
        <Text style={screenStyles.muted}>
          {order ? `${order.timeline.length} lifecycle events visible on-device.` : 'Waiting for tracking events.'}
        </Text>
      </InfoCard>

      <View style={screenStyles.stacked}>
        {order?.timeline.map((event) => (
          <InfoCard
            accent="#d9b675"
            description={event.created_at ?? 'timestamp pending'}
            eyebrow="Timeline event"
            key={`${event.event_type}-${event.created_at}`}
            title={event.event_type.replaceAll('_', ' ')}
          />
        ))}
      </View>
    </ScreenFrame>
  );
}
