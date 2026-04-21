import { useRouter } from 'expo-router';
import { CartScreen } from '../src/screens/CartScreen';
import { withDesignFrame } from '../src/ui';

export default function CartRoute() {
  const router = useRouter();

  return (
    <CartScreen
      onCheckoutComplete={(order) => {
        router.push(withDesignFrame(`/orders/${order.uuid}`));
      }}
    />
  );
}
