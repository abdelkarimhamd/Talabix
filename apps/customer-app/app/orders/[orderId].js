import { useLocalSearchParams } from 'expo-router';
import { OrderTrackingScreen } from '../../src/screens/OrderTrackingScreen';

export default function OrderTrackingRoute() {
  const { orderId } = useLocalSearchParams();

  return <OrderTrackingScreen orderId={String(orderId ?? '')} />;
}
