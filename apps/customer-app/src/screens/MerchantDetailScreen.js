import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { getCustomerAddresses, getMerchantDetail } from '../customer-api';
import { useI18n } from '../i18n';
import {
  ActionPill,
  FoodArtwork,
  InfoCard,
  MerchantRow,
  PromoBanner,
  ScreenFrame,
  SecondaryButton,
  SectionHeader,
  colors,
  screenStyles,
} from '../ui';

export function MerchantDetailScreen({
  merchantId,
  branchActionRenderer = null,
}) {
  const { formatCurrency } = useI18n();
  const [selectedAddressUuid, setSelectedAddressUuid] = useState();

  const { data: addresses = [] } = useQuery({
    queryKey: ['customer-addresses'],
    queryFn: getCustomerAddresses,
  });

  useEffect(() => {
    if (!selectedAddressUuid && addresses.length > 0) {
      setSelectedAddressUuid(
        addresses.find((address) => address.is_default)?.uuid ??
          addresses[0].uuid
      );
    }
  }, [addresses, selectedAddressUuid]);

  const { data: merchant } = useQuery({
    enabled: Boolean(merchantId),
    queryKey: ['customer-merchant-detail', merchantId, selectedAddressUuid],
    queryFn: () =>
      getMerchantDetail(merchantId, {
        address_uuid: selectedAddressUuid,
      }),
  });

  return (
    <ScreenFrame
      activeTab="home"
      description="Browse serviceable branches, compare ETA and delivery fee, then open the menu for the branch that fits the order."
      eyebrow="Store profile"
      title={merchant ? merchant.name : 'Loading merchant detail'}
    >
      <FoodArtwork
        badge={merchant?.is_open_now ? 'Open now' : '30% off'}
        label={merchant ? merchant.name : 'Talabix merchant'}
      />

      <PromoBanner
        description="Serviceability, delivery fee, open-now state, and ETA are projected from your selected address."
        eyebrow={merchant?.is_open_now ? 'Open now' : 'Store availability'}
        title="Store delivery options"
        tone={merchant?.is_open_now ? 'yellow' : 'dark'}
      />

      <View style={screenStyles.section}>
        <SectionHeader title="Deliver to" />
        <View style={screenStyles.row}>
          {addresses.map((address) => (
            <SecondaryButton
              active={address.uuid === selectedAddressUuid}
              key={address.uuid}
              label={
                address.is_default ? `${address.label} default` : address.label
              }
              onPress={() => setSelectedAddressUuid(address.uuid)}
            />
          ))}
        </View>
      </View>

      <InfoCard
        accent={colors.ink}
        description="Branch projections are address-aware so customers only continue with clear delivery context."
        eyebrow="Merchant summary"
        title={merchant ? merchant.slug : 'Loading summary'}
      >
        <View style={screenStyles.row}>
          <ActionPill
            label={merchant?.is_open_now ? 'Open now' : 'Closed now'}
            tone={merchant?.is_open_now ? 'success' : 'warning'}
          />
          <ActionPill
            label={
              merchant?.is_serviceable
                ? `${merchant.serviceable_branch_count} serviceable branch${merchant.serviceable_branch_count > 1 ? 'es' : ''}`
                : 'Not serviceable'
            }
          />
        </View>
      </InfoCard>

      <View style={screenStyles.section}>
        <SectionHeader title="Choose a branch" />
        {merchant?.branches.map((branch) => (
          <MerchantRow
            accent={
              branch.serviceability?.is_serviceable ? '#c9f06d' : '#f2e2b8'
            }
            action={branchActionRenderer ? branchActionRenderer(branch) : null}
            badges={[
              branch.is_open_now ? 'Open now' : 'Closed now',
              branch.serviceability?.is_serviceable
                ? 'Serviceable branch'
                : 'Out of range',
              branch.today_hours?.opens_at
                ? `${branch.today_hours.opens_at} - ${branch.today_hours.closes_at}`
                : null,
              branch.serviceability?.estimated_duration_minutes
                ? `${branch.serviceability.estimated_duration_minutes} min ETA${
                    branch.serviceability.maps_provider
                      ? ` via ${branch.serviceability.maps_provider}`
                      : ''
                  }`
                : null,
              branch.serviceability?.delivery_fee_minor
                ? `${formatCurrency(branch.serviceability.delivery_fee_minor)} delivery`
                : null,
            ].filter(Boolean)}
            description={branch.address_line}
            key={branch.uuid}
            title={branch.name}
            meta={
              branch.serviceability
                ? `${branch.serviceability.distance_meters}m from the selected address.`
                : 'Select an address to see serviceability.'
            }
          />
        ))}
      </View>
    </ScreenFrame>
  );
}
