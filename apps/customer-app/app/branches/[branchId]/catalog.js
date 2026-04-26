import { Link, useLocalSearchParams } from 'expo-router';
import { BranchCatalogScreen } from '../../../src/screens/BranchCatalogScreen';
import { SecondaryButton, withDesignFrame } from '../../../src/ui';

export default function BranchCatalogRoute() {
  const { branchId, item, offerId } = useLocalSearchParams();

  return (
    <BranchCatalogScreen
      actions={
        <Link asChild href={withDesignFrame('/cart')}>
          <SecondaryButton label="Continue to cart" />
        </Link>
      }
      branchId={String(branchId ?? '')}
      highlightCatalogItemUuid={item ? String(item) : null}
      highlightOfferId={offerId ? String(offerId) : null}
    />
  );
}
