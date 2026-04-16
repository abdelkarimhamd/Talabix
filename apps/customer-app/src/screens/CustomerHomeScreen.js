import { useQuery } from '@tanstack/react-query';
// i18n-audit: strict
import { useDeferredValue, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import {
  getActiveOrder,
  getCurrentCustomer,
  getCustomerAddresses,
  getCustomerNotifications,
  listMerchants,
} from '../customer-api';
import { useI18n } from '../i18n';
import {
  ActionPill,
  InfoCard,
  ScreenFrame,
  SecondaryButton,
  TextField,
  screenStyles,
} from '../ui';

export function CustomerHomeScreen({ actions = null, merchantActionRenderer = null }) {
  const { dir, formatCurrency, labelForEnum, t, tp } = useI18n();
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
      description={t('customer.home.description')}
      eyebrow={t('customer.home.eyebrow')}
      title={t('customer.home.title')}
    >
      <Text testID="customer-locale-direction" style={{ height: 0, opacity: 0 }}>
        {dir}
      </Text>
      <InfoCard
        accent="#ff8c42"
        description={t('customer.home.signedInDescription')}
        eyebrow={t('customer.home.signedInCustomer')}
        title={customer ? customer.name : t('customer.home.loadingSession')}
      >
        <View style={screenStyles.row}>
          <ActionPill label={customer?.email ?? t('customer.home.emailLoading')} />
          <ActionPill label={customer?.phone ?? t('customer.home.phoneLoading')} />
          <ActionPill
            label={
              customer
                ? t('customer.home.roleLabel', { role: customer.roles[0] })
                : t('customer.home.roleLoading')
            }
          />
        </View>
      </InfoCard>

      <InfoCard
        accent="#26a69a"
        description={t('customer.home.discoveryContextDescription')}
        eyebrow={t('customer.home.discoveryContext')}
        title={selectedAddress ? selectedAddress.label : t('customer.home.selectAddress')}
      >
        <Text style={screenStyles.muted}>
          {selectedAddress
            ? `${selectedAddress.line_1}${selectedAddress.line_2 ? `, ${selectedAddress.line_2}` : ''}, ${selectedAddress.city}`
            : t('customer.home.createAddressHelp')}
        </Text>
        <View style={screenStyles.row}>
          {addresses.map((address) => (
            <SecondaryButton
              key={address.uuid}
              label={
                address.is_default
                  ? t('customer.home.defaultAddress', { label: address.label })
                  : address.label
              }
              onPress={() => setSelectedAddressUuid(address.uuid)}
            />
          ))}
        </View>
      </InfoCard>

      <InfoCard
        accent="#112134"
        description={t('customer.home.discoveryDescription')}
        eyebrow={t('customer.home.filters')}
        title={t('customer.home.discoveryTitle')}
      >
        <View style={screenStyles.form}>
          <TextField
            label={t('customer.home.searchMerchants')}
            onChangeText={setSearch}
            placeholder={t('customer.home.searchPlaceholder')}
            testID="merchant-search"
            value={search}
          />
          <View style={screenStyles.buttonRow}>
            <SecondaryButton
              label={openNowOnly ? t('customer.home.openNowOn') : t('customer.home.openNowOff')}
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
                    ? t('customer.home.deliveryFee', {
                        amount: formatCurrency(leadBranch.serviceability.delivery_fee_minor),
                      })
                    : t('customer.home.projectedServiceability')
                }
                eyebrow={merchant.is_open_now ? t('customer.home.openNow') : t('customer.home.closedNow')}
                key={merchant.uuid}
                title={merchant.name}
              >
                <View style={screenStyles.row}>
                  <ActionPill
                    label={tp('customer.home.visibleBranches', merchant.branches.length)}
                  />
                  <ActionPill
                    label={
                      merchant.is_serviceable
                        ? t('customer.home.serviceableCount', {
                            count: merchant.serviceable_branch_count,
                          })
                        : t('customer.home.notServiceable')
                    }
                  />
                  {leadBranch?.serviceability?.estimated_duration_minutes ? (
                    <ActionPill
                      label={
                        leadBranch.serviceability.maps_provider
                          ? t('customer.home.etaVia', {
                              minutes: leadBranch.serviceability.estimated_duration_minutes,
                              provider: leadBranch.serviceability.maps_provider,
                            })
                          : t('customer.home.eta', {
                              minutes: leadBranch.serviceability.estimated_duration_minutes,
                            })
                      }
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
                    : t('customer.home.noActiveBranches')}
                </Text>
                {merchantActionRenderer ? merchantActionRenderer(merchant) : null}
              </InfoCard>
            );
          })
        ) : (
          <InfoCard
            accent="#d9b675"
            description={t('customer.home.noMerchantsDescription')}
            eyebrow={t('customer.home.noMerchants')}
            title={t('customer.home.noMerchantsTitle')}
          >
            <Text style={screenStyles.emptyState}>
              {t('customer.home.noMerchantsBody')}
            </Text>
          </InfoCard>
        )}
      </View>

      <InfoCard
        accent="#d9b675"
        description={t('customer.home.inboxDescription')}
        eyebrow={t('customer.home.inbox')}
        title={
          notificationInbox
            ? tp('customer.home.unreadNotifications', notificationInbox.meta.unread_count)
            : t('customer.home.loadingInbox')
        }
      >
        <View style={screenStyles.row}>
          <ActionPill label={t('common.total', { count: notificationInbox?.meta.total ?? 0 })} />
          <ActionPill
            label={t('common.unread', { count: notificationInbox?.meta.unread_count ?? 0 })}
          />
        </View>
        <Text style={screenStyles.muted}>
          {notificationInbox?.data[0]
            ? `${notificationInbox.data[0].title} - ${notificationInbox.data[0].body}`
            : t('customer.home.emptyInbox')}
        </Text>
      </InfoCard>

      <InfoCard
        accent="#26a69a"
        description={t('customer.home.activeOrderDescription')}
        eyebrow={t('customer.home.activeOrder')}
        title={
          order
            ? t('customer.home.trackOrder', { code: order.uuid.slice(0, 8).toUpperCase() })
            : t('customer.home.preparingOrder')
        }
      >
        <Text style={screenStyles.statValue}>
          {order ? labelForEnum('orderStatus', order.status) : t('customer.home.loadingOrder')}
        </Text>
        <Text style={screenStyles.muted}>
          {order
            ? t('customer.home.lifecycleEvents', { count: order.timeline.length })
            : t('customer.home.waitingOrder')}
        </Text>
      </InfoCard>

      <InfoCard
        accent="#112134"
        description={t('customer.home.routesDescription')}
        eyebrow={t('customer.home.routes')}
        title={t('customer.home.routesTitle')}
      >
        <View style={screenStyles.buttonRow}>{actions}</View>
      </InfoCard>
    </ScreenFrame>
  );
}

