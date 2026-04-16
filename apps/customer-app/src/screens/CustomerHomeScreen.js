import { useQuery } from '@tanstack/react-query';
import { useDeferredValue, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import {
  getActiveOrder,
  getCurrentCustomer,
  getCustomerAddresses,
  getCustomerNotifications,
  listMerchants,
} from '../customer-api';
import {
  ActionPill,
  InfoCard,
  ScreenFrame,
  SecondaryButton,
  TextField,
  screenStyles,
} from '../ui';

export function CustomerHomeScreen({ actions = null, merchantActionRenderer = null }) {
  const [search, setSearch] = useState('');
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [selectedAddressUuid, setSelectedAddressUuid] = useState();
  const deferredSearch = useDeferredValue(search);

  const { data: customer } = useQuery({
    queryKey: ['customer-session'],
    queryFn: getCurrentCustomer,
  });
  const { data: addresses = [] } = useQuery({
    queryKey: ['customer-addresses'],
    queryFn: getCustomerAddresses,
  });
  const { data: order } = useQuery({
    queryKey: ['customer-active-order'],
    queryFn: getActiveOrder,
  });
  const { data: notificationInbox } = useQuery({
    queryKey: ['customer-notifications'],
    queryFn: () => getCustomerNotifications(),
  });

  useEffect(() => {
    if (!selectedAddressUuid && addresses.length > 0) {
      setSelectedAddressUuid(addresses.find((address) => address.is_default)?.uuid ?? addresses[0].uuid);
    }
  }, [addresses, selectedAddressUuid]);

  const selectedAddress =
    addresses.find((address) => address.uuid === selectedAddressUuid) ??
    addresses.find((address) => address.is_default) ??
    addresses[0];

  const { data: merchants = [] } = useQuery({
    enabled: Boolean(selectedAddress?.uuid),
    queryKey: ['customer-merchants', selectedAddress?.uuid, deferredSearch, openNowOnly],
    queryFn: () =>
      listMerchants({
        address_uuid: selectedAddress?.uuid,
        search: deferredSearch.trim() || undefined,
        open_now: openNowOnly || undefined,
      }),
  });

  return (
    <ScreenFrame
      description="Register a customer, keep a richer address book, filter discovery by serviceability, and open merchant detail before continuing into catalog and cart."
      eyebrow="Customer discovery"
      title="Customer identity and discovery now run as one slice."
    >
      <InfoCard
        accent="#ff8c42"
        description="The shared contract package now drives registration, profile updates, address payloads, and merchant discovery responses."
        eyebrow="Signed-in customer"
        title={customer ? customer.name : 'Loading customer session'}
      >
        <View style={screenStyles.row}>
          <ActionPill label={customer?.email ?? 'email loading'} />
          <ActionPill label={customer?.phone ?? 'phone loading'} />
          <ActionPill label={customer ? `${customer.roles[0]} role` : 'role loading'} />
        </View>
      </InfoCard>

      <InfoCard
        accent="#26a69a"
        description="Discovery uses the selected default or manually chosen address so the merchant list only shows serviceable results."
        eyebrow="Discovery context"
        title={selectedAddress ? selectedAddress.label : 'Select a delivery address'}
      >
        <Text style={screenStyles.muted}>
          {selectedAddress
            ? `${selectedAddress.line_1}${selectedAddress.line_2 ? `, ${selectedAddress.line_2}` : ''}, ${selectedAddress.city}`
            : 'Create an address to unlock serviceability-aware discovery.'}
        </Text>
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
        description="Search stays merchant-name-based in this phase, open-now uses each branch schedule, and ETA stays provider-driven instead of hard-coded."
        eyebrow="Filters"
        title="Address-aware merchant discovery"
      >
        <View style={screenStyles.form}>
          <TextField
            label="Search merchants"
            onChangeText={setSearch}
            placeholder="Search by merchant name"
            testID="merchant-search"
            value={search}
          />
          <View style={screenStyles.buttonRow}>
            <SecondaryButton
              label={openNowOnly ? 'Open now only: on' : 'Open now only: off'}
              onPress={() => setOpenNowOnly((current) => !current)}
              testID="toggle-open-now"
            />
          </View>
        </View>
      </InfoCard>

      <View style={screenStyles.stacked}>
        {merchants.length > 0 ? (
          merchants.map((merchant) => {
            const leadBranch = merchant.branches[0];

            return (
              <InfoCard
                accent={merchant.is_open_now ? '#ff8c42' : '#d9b675'}
                description={
                  leadBranch?.serviceability?.delivery_fee_minor
                    ? `${(leadBranch.serviceability.delivery_fee_minor / 100).toFixed(2)} SAR delivery from the nearest serviceable branch.`
                    : 'Serviceability and branch open-state are projected from the selected address.'
                }
                eyebrow={merchant.is_open_now ? 'Open now' : 'Closed right now'}
                key={merchant.uuid}
                title={merchant.name}
              >
                <View style={screenStyles.row}>
                  <ActionPill label={`${merchant.branches.length} visible branch${merchant.branches.length > 1 ? 'es' : ''}`} />
                  <ActionPill
                    label={
                      merchant.is_serviceable
                        ? `${merchant.serviceable_branch_count} serviceable`
                        : 'Not serviceable'
                    }
                  />
                  {leadBranch?.serviceability?.estimated_duration_minutes ? (
                    <ActionPill
                      label={`${leadBranch.serviceability.estimated_duration_minutes} min ETA${
                        leadBranch.serviceability.maps_provider
                          ? ` via ${leadBranch.serviceability.maps_provider}`
                          : ''
                      }`}
                    />
                  ) : null}
                  {leadBranch?.today_hours?.opens_at ? (
                    <ActionPill
                      label={`${leadBranch.today_hours.opens_at} - ${leadBranch.today_hours.closes_at}`}
                    />
                  ) : null}
                </View>
                <Text style={screenStyles.muted}>
                  {leadBranch
                    ? `${leadBranch.name} - ${leadBranch.address_line}`
                    : 'No active branches match the current filters.'}
                </Text>
                {merchantActionRenderer ? merchantActionRenderer(merchant) : null}
              </InfoCard>
            );
          })
        ) : (
          <InfoCard
            accent="#d9b675"
            description="Try a broader search or turn off the open-now filter."
            eyebrow="No merchants"
            title="No merchants match the current address and filters."
          >
            <Text style={screenStyles.emptyState}>
              Merchant discovery is intentionally constrained to serviceable branches only when an address is selected.
            </Text>
          </InfoCard>
        )}
      </View>

      <InfoCard
        accent="#d9b675"
        description="In-app delivery and support notifications now stay actor-scoped, so the customer app can surface unread operational updates without relying on email or push state."
        eyebrow="Inbox"
        title={
          notificationInbox
            ? `${notificationInbox.meta.unread_count} unread notification${
                notificationInbox.meta.unread_count === 1 ? '' : 's'
              }`
            : 'Loading inbox'
        }
      >
        <View style={screenStyles.row}>
          <ActionPill label={`${notificationInbox?.meta.total ?? 0} total`} />
          <ActionPill label={`${notificationInbox?.meta.unread_count ?? 0} unread`} />
        </View>
        <Text style={screenStyles.muted}>
          {notificationInbox?.data[0]
            ? `${notificationInbox.data[0].title} - ${notificationInbox.data[0].body}`
            : 'Order and support notifications will appear here once they are queued for the signed-in customer.'}
        </Text>
      </InfoCard>

      <InfoCard
        accent="#26a69a"
        description="The live order card still mirrors the append-only timeline so the new discovery flow drops into the existing order shell without changing checkout semantics."
        eyebrow="Active order"
        title={order ? `Track order ${order.uuid.slice(0, 8).toUpperCase()}` : 'Preparing live order'}
      >
        <Text style={screenStyles.statValue}>
          {order ? order.status.replaceAll('_', ' ') : 'loading'}
        </Text>
        <Text style={screenStyles.muted}>
          {order
            ? `${order.timeline.length} projected lifecycle events visible on-device.`
            : 'Waiting for order data.'}
        </Text>
      </InfoCard>

      <InfoCard
        accent="#112134"
        description="Profile, registration, addresses, cart, and live order tracking stay as separate routes while sharing the same query client and contract package."
        eyebrow="Routes"
        title="Continue the customer flow"
      >
        <View style={screenStyles.buttonRow}>{actions}</View>
      </InfoCard>
    </ScreenFrame>
  );
}

