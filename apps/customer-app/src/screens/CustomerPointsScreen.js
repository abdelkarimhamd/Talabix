import { Text, View } from 'react-native';
import {
  ActionPill,
  InfoCard,
  PageIntro,
  PriceSummaryRow,
  PromoBanner,
  ScreenFrame,
  colors,
  screenStyles,
} from '../ui';
import { useI18n } from '../i18n';

export function CustomerPointsScreen() {
  const { rowDirection, t, textAlign, writingDirection } = useI18n();

  return (
    <ScreenFrame
      activeTab="points"
      description={t('customer.points.screenDescription')}
      eyebrow={t('customer.points.screenEyebrow')}
      preserveHeaderText={false}
      showHeader={false}
      title={t('customer.points.screenTitle')}
    >
      <PageIntro
        kicker={t('customer.points.pageKicker')}
        title={t('customer.points.pageTitle')}
      />

      <PromoBanner
        description={t('customer.points.promoDescription')}
        eyebrow={t('customer.points.pageKicker')}
        title={t('customer.points.pageTitle')}
      />

      <InfoCard
        accent={colors.primaryDeep}
        description={t('customer.points.previewDescription')}
        eyebrow={t('customer.points.freeDeliveryProgress')}
        title={t('customer.points.addMore')}
      >
        <View style={screenStyles.progressTrack}>
          <View style={screenStyles.progressFill} />
        </View>
        <PriceSummaryRow
          label={t('customer.points.currentSpend')}
          value="SAR 15"
        />
        <PriceSummaryRow
          label={t('customer.points.rewardThreshold')}
          strong
          value="SAR 30"
        />
        <View style={[screenStyles.row, { flexDirection: rowDirection }]}>
          <ActionPill label="HPlus" tone="warning" />
          <ActionPill label={t('customer.points.autoApply')} />
        </View>
      </InfoCard>

      <InfoCard
        accent={colors.rose}
        description={t('customer.points.vouchersDescription')}
        eyebrow={t('customer.points.vouchers')}
        title={t('customer.points.rewardsSoon')}
      >
        <Text style={[screenStyles.muted, { textAlign, writingDirection }]}>
          {t('customer.points.voucherBody')}
        </Text>
      </InfoCard>
    </ScreenFrame>
  );
}
