import { Link, useLocalSearchParams } from 'expo-router';
import { BranchCatalogScreen } from '../../../src/screens/BranchCatalogScreen';
import { SecondaryButton } from '../../../src/ui';

export default function BranchCatalogRoute() {
  const { branchId } = useLocalSearchParams();

  return (
    <BranchCatalogScreen
      actions={
        <Link asChild href="/cart">
          <SecondaryButton label="Continue to cart" />
        </Link>
      }
      branchId={String(branchId ?? '')}
    />
  );
}
