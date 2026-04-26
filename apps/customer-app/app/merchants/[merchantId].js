import { Link, useLocalSearchParams } from 'expo-router';
import { MerchantDetailScreen } from '../../src/screens/MerchantDetailScreen';
import { SecondaryButton, withDesignFrame } from '../../src/ui';

export default function MerchantDetailRoute() {
  const { merchantId } = useLocalSearchParams();

  return (
    <MerchantDetailScreen
      branchActionRenderer={(branch) => (
        <>
          <Link
            asChild
            href={withDesignFrame(`/branches/${branch.uuid}/catalog`)}
          >
            <SecondaryButton label="Browse branch catalog" />
          </Link>
          <Link asChild href={withDesignFrame('/cart')}>
            <SecondaryButton label="Open cart" />
          </Link>
        </>
      )}
      merchantId={String(merchantId ?? '')}
    />
  );
}
