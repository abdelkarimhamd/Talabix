import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { getCustomerOffers } from '../customer-api';
import { useI18n } from '../i18n';
import {
  ActionPill,
  FoodArtwork,
  InfoCard,
  PriceSummaryRow,
  PromoBanner,
  ScreenFrame,
  SecondaryButton,
  SectionHeader,
  colors,
  screenStyles,
} from '../ui';

function formatOfferExpiry(value) {
  return value ? new Date(value).toLocaleDateString() : 'Limited time';
}

export function CustomerOffersScreen() {
  const { formatCurrency } = useI18n();
  const router = useRouter();
  const { data: offers = [] } = useQuery({
    queryKey: ['customer-offers'],
    queryFn: getCustomerOffers,
  });

  function openOffer(offer) {
    const offerId = encodeURIComponent(offer.id);
    const catalogItemUuid = encodeURIComponent(offer.catalogItemUuid);

    router.push(
      `/branches/${offer.branchUuid}/catalog?offerId=${offerId}&item=${catalogItemUuid}`
    );
  }

  return (
    <ScreenFrame
      activeTab="offers"
      description="Browse customer-facing promotions from the offers API, with packaged artwork and branch-aware item metadata."
      eyebrow="Offers"
      title="Offers near you"
    >
      <PromoBanner
        description="Selected restaurants, markets, and member-style bundles are refreshed from the offers list."
        eyebrow="Today"
        title="Deals ready for your next order"
      />

      <InfoCard
        accent={colors.rose}
        description="The offer cards below are no longer a fixed branch catalog shortcut."
        eyebrow="Offers API"
        title={`${offers.length} active offer${offers.length === 1 ? '' : 's'}`}
      >
        <View style={screenStyles.row}>
          <ActionPill label="Packaged artwork" tone="success" />
          <ActionPill label="Branch-aware" />
        </View>
      </InfoCard>

      <View style={screenStyles.section}>
        <SectionHeader title="Available offers" />
        <View style={screenStyles.stacked}>
          {offers.map((offer) => (
            <InfoCard
              accent={colors.primaryDeep}
              description={offer.description}
              eyebrow={offer.discountLabel}
              key={offer.id}
              title={offer.title}
            >
              <FoodArtwork
                badge={offer.discountLabel}
                label={offer.artworkLabel ?? offer.itemName}
                style={{ height: 146 }}
              />
              <Text style={screenStyles.inlineTitle}>{offer.itemName}</Text>
              <Text style={screenStyles.muted}>
                {offer.merchantName} - {offer.branchName}
              </Text>
              <PriceSummaryRow
                label="Minimum spend"
                value={formatCurrency(offer.minSpendMinor)}
              />
              <PriceSummaryRow
                label="Delivery fee"
                strong
                value={formatCurrency(offer.deliveryFeeMinor)}
              />
              <View style={screenStyles.row}>
                <ActionPill label={`Expires ${formatOfferExpiry(offer.expiresAt)}`} />
                {offer.requiresPromoCode ? (
                  <ActionPill label={`Code ${offer.promoCode}`} tone="success" />
                ) : null}
                <ActionPill label={offer.artworkFileName} />
              </View>
              <View style={screenStyles.buttonRow}>
                <SecondaryButton
                  label="View offer"
                  onPress={() => openOffer(offer)}
                  testID={`customer-offer-${offer.id}`}
                />
              </View>
            </InfoCard>
          ))}
        </View>
      </View>

      {offers.length === 0 ? (
        <Text style={screenStyles.emptyState}>
          No active customer offers are available right now.
        </Text>
      ) : null}
    </ScreenFrame>
  );
}
