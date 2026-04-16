import { Link } from 'expo-router';
import { RiderHomeScreen } from '../src/screens/RiderHomeScreen';
import { AccentButton } from '../src/ui';

export default function RiderHomeRoute() {
  return (
    <RiderHomeScreen
      actions={
        <>
          <Link asChild href="/assignments">
            <AccentButton label="Open assignments" />
          </Link>
          <Link asChild href="/notifications">
            <AccentButton label="Notifications" />
          </Link>
          <Link asChild href="/earnings">
            <AccentButton label="Earnings" />
          </Link>
          <Link asChild href="/delivery">
            <AccentButton label="Delivery detail" testID="delivery-detail" />
          </Link>
        </>
      }
    />
  );
}
