import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { getCustomerOffers } from '../customer-api';
import { useI18n } from '../i18n';
import {
  ActionPill,
  FoodArtwork,
  InfoCard,
  PageIntro,
  PriceSummaryRow,
  PromoBanner,
  ScreenFrame,
  SecondaryButton,
  SectionHeader,
  colors,
  screenStyles,
  withDesignFrame,
} from '../ui';

function formatOfferExpiry(value, isRtl, t) {
  return value
    ? new Date(value).toLocaleDateString(isRtl ? 'ar-SA' : undefined)
    : t('customer.offers.limitedTime');
}

function localizeOffer(offer, isRtl, t) {
  if (!isRtl) {
    return offer;
  }

  const keyPrefix = `customer.offers.offerCopy.${offer.id}`;
  const title = t(`${keyPrefix}.title`);

  if (title === `${keyPrefix}.title`) {
    return offer;
  }

  return {
    ...offer,
    branchName: t(`${keyPrefix}.branchName`),
    description: t(`${keyPrefix}.description`),
    discountLabel: t(`${keyPrefix}.discountLabel`),
    itemName: t(`${keyPrefix}.itemName`),
    title,
  };
}

export function CustomerOffersScreen() {
  const {
    formatCurrency,
    isRtl,
    rowDirection,
    t,
    textAlign,
    tp,
    writingDirection,
  } = useI18n();
  const router = useRouter();
  const { data: offers = [] } = useQuery({
    queryKey: ['customer-offers'],
    queryFn: getCustomerOffers,
  });

  function openOffer(offer) {
    const offerId = encodeURIComponent(offer.id);
    const catalogItemUuid = encodeURIComponent(offer.catalogItemUuid);

    router.push(
      withDesignFrame(
        `/branches/${offer.branchUuid}/catalog?offerId=${offerId}&item=${catalogItemUuid}`
      )
    );
  }

  return (
    <ScreenFrame
      activeTab="offers"
      description={t('customer.offers.screenDescription')}
      eyebrow={t('customer.offers.screenEyebrow')}
      preserveHeaderText={false}
      showHeader={false}
      title={t('customer.offers.screenTitle')}
    >
      <PageIntro
        kicker={t('customer.offers.pageKicker')}
        title={t('customer.offers.pageTitle')}
      />

      <PromoBanner
        description={t('customer.offers.promoDescription')}
        eyebrow={t('customer.offers.promoEyebrow')}
        title={t('customer.offers.promoTitle')}
      />

      <InfoCard
        accent={colors.rose}
        description={t('customer.offers.apiDescription')}
        eyebrow={t('customer.offers.apiEyebrow')}
        title={tp('customer.offers.activeOfferCount', offers.length)}
      >
        <View style={[screenStyles.row, { flexDirection: rowDirection }]}>
          <ActionPill
            label={t('customer.offers.packagedArtwork')}
            tone="success"
          />
          <ActionPill label={t('customer.offers.branchAware')} />
        </View>
      </InfoCard>

      <View style={screenStyles.section}>
        <SectionHeader title={t('customer.offers.availableOffers')} />
        <View style={screenStyles.stacked}>
          {offers.map((offer) => {
            const copy = localizeOffer(offer, isRtl, t);

            return (
              <InfoCard
                accent={colors.primaryDeep}
                description={copy.description}
                eyebrow={copy.discountLabel}
                key={offer.id}
                title={copy.title}
              >
                <FoodArtwork
                  badge={copy.discountLabel}
                  label={copy.artworkLabel ?? copy.itemName}
                  style={{ height: 146 }}
                />
                <Text
                  style={[
                    screenStyles.inlineTitle,
                    { textAlign, writingDirection },
                  ]}
                >
                  {copy.itemName}
                </Text>
                <Text
                  style={[screenStyles.muted, { textAlign, writingDirection }]}
                >
                  {copy.merchantName} - {copy.branchName}
                </Text>
                <PriceSummaryRow
                  label={t('customer.offers.minimumSpend')}
                  value={formatCurrency(offer.minSpendMinor)}
                />
                <PriceSummaryRow
                  label={t('customer.offers.deliveryFee')}
                  strong
                  value={formatCurrency(offer.deliveryFeeMinor)}
                />
                <View style={[screenStyles.row, { flexDirection: rowDirection }]}>
                  <ActionPill
                    label={t('customer.offers.expires', {
                      date: formatOfferExpiry(offer.expiresAt, isRtl, t),
                    })}
                  />
                  {offer.requiresPromoCode ? (
                    <ActionPill
                      label={t('customer.offers.code', {
                        code: offer.promoCode,
                      })}
                      tone="success"
                    />
                  ) : null}
                  <ActionPill label={offer.artworkFileName} />
                </View>
                <View
                  style={[screenStyles.buttonRow, { flexDirection: rowDirection }]}
                >
                  <SecondaryButton
                    label={t('customer.offers.viewOffer')}
                    onPress={() => openOffer(offer)}
                    testID={`customer-offer-${offer.id}`}
                  />
                </View>
              </InfoCard>
            );
          })}
        </View>
      </View>

      {offers.length === 0 ? (
        <Text style={[screenStyles.emptyState, { textAlign, writingDirection }]}>
          {t('customer.offers.empty')}
        </Text>
      ) : null}
    </ScreenFrame>
  );
}
