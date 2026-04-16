import { Link, useLocalSearchParams } from 'expo-router';
import { MerchantDetailScreen } from '../../src/screens/MerchantDetailScreen';
import { SecondaryButton } from '../../src/ui';

export default function MerchantDetailRoute() {
  const { merchantId } = useLocalSearchParams();

  return (
    <MerchantDetailScreen
      branchActionRenderer={(branch) => (
        <>
          <Link asChild href={`/branches/${branch.uuid}/catalog`}>
            <SecondaryButton label="Browse branch catalog" />
          </Link>
          <Link asChild href="/cart">
            <SecondaryButton label="Open cart" />
          </Link>
        </>
      )}
      merchantId={String(merchantId ?? '')}
    />
  );
}
