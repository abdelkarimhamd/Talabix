import { Link } from 'expo-router';
import { RiderHomeScreen } from '../src/screens/RiderHomeScreen';
import { AccentButton, SecondaryButton } from '../src/ui';

export default function RiderHomeRoute() {
  return (
    <RiderHomeScreen
      actions={
        <>
          <Link asChild href="/assignments">
            <AccentButton label="Open assignments" />
          </Link>
          <Link asChild href="/notifications">
            <SecondaryButton label="Notifications" />
          </Link>
          <Link asChild href="/earnings">
            <SecondaryButton label="Earnings" />
          </Link>
          <Link asChild href="/delivery">
            <SecondaryButton label="Delivery detail" testID="delivery-detail" />
          </Link>
        </>
      }
    />
  );
}
