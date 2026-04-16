import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { getCustomerAddresses, getMerchantDetail } from '../customer-api';
import { ActionPill, InfoCard, ScreenFrame, SecondaryButton, screenStyles } from '../ui';

export function MerchantDetailScreen({ merchantId, branchActionRenderer = null }) {
  const [selectedAddressUuid, setSelectedAddressUuid] = useState();

  const { data: addresses = [] } = useQuery({
    queryKey: ['customer-addresses'],
    queryFn: getCustomerAddresses,
  });

  useEffect(() => {
    if (!selectedAddressUuid && addresses.length > 0) {
      setSelectedAddressUuid(addresses.find((address) => address.is_default)?.uuid ?? addresses[0].uuid);
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
      description="Merchant detail keeps to what the current backend can support: branch summary, open-now state, address-aware serviceability, and a provider-driven ETA projection."
      eyebrow="Merchant detail"
      title={merchant ? merchant.name : 'Loading merchant detail'}
    >
      <InfoCard
        accent="#ff8c42"
        description="Switching addresses changes the serviceability and ETA projection without inventing ratings or product search."
        eyebrow="Address context"
        title="Selected delivery address"
      >
        <View style={screenStyles.row}>
          {addresses.map((address) => (
            <SecondaryButton
              key={address.uuid}
              label={address.is_default ? `${address.label} default` : address.label}
              onPress={() => setSelectedAddressUuid(address.uuid)}
            />
          ))}
        </View>
      </InfoCard>

      <InfoCard
        accent="#112134"
        description="Serviceability is aggregated from branch projections so the customer sees only data the domain currently owns."
        eyebrow="Merchant summary"
        title={merchant ? merchant.slug : 'Loading summary'}
      >
        <View style={screenStyles.row}>
          <ActionPill label={merchant?.is_open_now ? 'Open now' : 'Closed now'} />
          <ActionPill
            label={
              merchant?.is_serviceable
                ? `${merchant.serviceable_branch_count} serviceable branch${merchant.serviceable_branch_count > 1 ? 'es' : ''}`
                : 'Not serviceable'
            }
          />
        </View>
      </InfoCard>

      <View style={screenStyles.stacked}>
        {merchant?.branches.map((branch) => (
          <InfoCard
            accent={branch.serviceability?.is_serviceable ? '#26a69a' : '#d9b675'}
            description={branch.address_line}
            eyebrow={branch.serviceability?.is_serviceable ? 'Serviceable branch' : 'Out of range'}
            key={branch.uuid}
            title={branch.name}
          >
            <View style={screenStyles.row}>
              <ActionPill label={branch.is_open_now ? 'Open now' : 'Closed now'} />
              {branch.today_hours?.opens_at ? (
                <ActionPill label={`${branch.today_hours.opens_at} - ${branch.today_hours.closes_at}`} />
              ) : null}
              {branch.serviceability?.estimated_duration_minutes ? (
                <ActionPill
                  label={`${branch.serviceability.estimated_duration_minutes} min ETA${
                    branch.serviceability.maps_provider
                      ? ` via ${branch.serviceability.maps_provider}`
                      : ''
                  }`}
                />
              ) : null}
              {branch.serviceability?.delivery_fee_minor ? (
                <ActionPill
                  label={`${(branch.serviceability.delivery_fee_minor / 100).toFixed(2)} SAR delivery`}
                />
              ) : null}
            </View>
            <Text style={screenStyles.muted}>
              {branch.serviceability
                ? `${branch.serviceability.distance_meters}m from the selected address.`
                : 'Select an address to see serviceability.'}
            </Text>
            {branchActionRenderer ? branchActionRenderer(branch) : null}
          </InfoCard>
        ))}
      </View>
    </ScreenFrame>
  );
}
