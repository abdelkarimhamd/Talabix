import { Link } from 'expo-router';
import { CustomerHomeScreen } from '../src/screens/CustomerHomeScreen';
import { AccentButton, SecondaryButton, withDesignFrame } from '../src/ui';

export default function CustomerHomeRoute() {
  return (
    <CustomerHomeScreen
      actions={
        <>
          <Link asChild href={withDesignFrame('/register')}>
            <AccentButton label="Register customer" />
          </Link>
          <Link asChild href={withDesignFrame('/profile')}>
            <SecondaryButton label="Edit profile" />
          </Link>
          <Link asChild href={withDesignFrame('/addresses')}>
            <SecondaryButton label="Address book" />
          </Link>
          <Link asChild href={withDesignFrame('/notifications')}>
            <SecondaryButton label="Notifications" />
          </Link>
          <Link asChild href={withDesignFrame('/cart')}>
            <SecondaryButton label="Open cart" />
          </Link>
          <Link
            asChild
            href={withDesignFrame(
              '/orders/4aa0f507-77b6-459c-adbe-ef8658cbdc51'
            )}
          >
            <SecondaryButton label="Track live order" testID="track-live-order" />
          </Link>
        </>
      }
      merchantActionRenderer={(merchant) => (
        <Link asChild href={withDesignFrame(`/merchants/${merchant.uuid}`)}>
          <SecondaryButton
            label="Open merchant"
            testID={`open-merchant-${merchant.uuid}`}
          />
        </Link>
      )}
    />
  );
}
