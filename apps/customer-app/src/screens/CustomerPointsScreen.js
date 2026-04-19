import { Text, View } from 'react-native';
import {
  ActionPill,
  InfoCard,
  PriceSummaryRow,
  PromoBanner,
  ScreenFrame,
  colors,
  screenStyles,
} from '../ui';

export function CustomerPointsScreen() {
  return (
    <ScreenFrame
      activeTab="points"
      description="Track HPlus rewards, free delivery progress, and voucher-style benefits in the same dock destination."
      eyebrow="HPlus rewards"
      title="9000 points"
    >
      <PromoBanner
        description="Spend SAR 30 with eligible stores to unlock the next free-delivery reward."
        eyebrow="HPlus rewards"
        title="9000 points"
      />

      <InfoCard
        accent={colors.primaryDeep}
        description="This mirrors the reference loyalty surface until the backend exposes a dedicated rewards ledger."
        eyebrow="Free delivery progress"
        title="Add SAR 15 more"
      >
        <PriceSummaryRow label="Current spend" value="SAR 15" />
        <PriceSummaryRow label="Reward threshold" strong value="SAR 30" />
        <View style={screenStyles.row}>
          <ActionPill label="HPlus" tone="warning" />
          <ActionPill label="Auto apply" />
        </View>
      </InfoCard>

      <InfoCard
        accent={colors.rose}
        description="Vouchers and points use local preview data here so the dock target feels complete while rewards APIs are pending."
        eyebrow="Vouchers"
        title="2 rewards ready soon"
      >
        <Text style={screenStyles.muted}>
          Free delivery, selected item discounts, and member perks will land in
          this screen.
        </Text>
      </InfoCard>
    </ScreenFrame>
  );
}
