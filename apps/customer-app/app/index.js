import { Link } from 'expo-router';
import { CustomerHomeScreen } from '../src/screens/CustomerHomeScreen';
import { AccentButton, SecondaryButton } from '../src/ui';

export default function CustomerHomeRoute() {
  return (
    <CustomerHomeScreen
      actions={
        <>
          <Link asChild href="/register">
            <AccentButton label="Register customer" />
          </Link>
          <Link asChild href="/profile">
            <SecondaryButton label="Edit profile" />
          </Link>
          <Link asChild href="/addresses">
            <SecondaryButton label="Address book" />
          </Link>
          <Link asChild href="/notifications">
            <SecondaryButton label="Notifications" />
          </Link>
          <Link asChild href="/cart">
            <SecondaryButton label="Open cart" />
          </Link>
          <Link asChild href="/orders/4aa0f507-77b6-459c-adbe-ef8658cbdc51">
            <SecondaryButton label="Track live order" testID="track-live-order" />
          </Link>
        </>
      }
      merchantActionRenderer={(merchant) => (
        <Link asChild href={`/merchants/${merchant.uuid}`}>
          <SecondaryButton label="Open merchant" />
        </Link>
      )}
    />
  );
}
