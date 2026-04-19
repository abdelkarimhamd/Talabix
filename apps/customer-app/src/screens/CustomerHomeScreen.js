import { useQuery } from '@tanstack/react-query';
// i18n-audit: strict
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import {
  getActiveOrder,
  getCartSummary,
  getCustomerAddresses,
  getCustomerNotifications,
  listMerchants,
} from '../customer-api';
import { useI18n } from '../i18n';
import {
  AppHeader,
  ActionPill,
  CategoryTile,
  MerchantRow,
  PromoBanner,
  InfoCard,
  SearchBar,
  ScreenFrame,
  SecondaryButton,
  SectionHeader,
  colors,
  screenStyles,
} from '../ui';

const serviceCategories = [
  { id: 'all', kicker: 'H', label: 'All', meta: 'Near you' },
  {
    id: 'restaurants',
    kicker: '50.00',
    label: 'Restaurants',
    meta: 'Meals & cafes',
  },
  { id: 'market', kicker: '20 min', label: 'Market', meta: 'Groceries' },
  { id: 'pharmacy', kicker: 'RX', label: 'Pharmacy', meta: 'Care items' },
  { id: 'gifts', kicker: '30%', label: 'Flowers & gifts', meta: 'Same day' },
  { id: 'pickup', kicker: 'BAG', label: 'Pickup', meta: 'Branch ready' },
];

const dailyOfferCards = [
  {
    badge: 'Up to 35',
    meta: 'Reduced delivery',
    title: 'Hour offers',
  },
  {
    badge: 'Coffee',
    meta: '10 min nearby',
    title: 'Morning picks',
  },
  {
    badge: 'Fast',
    meta: 'HPlus eligible',
    title: 'Free delivery',
  },
];

function categoryIdsForMerchant(merchant) {
  const slug = `${merchant.slug} ${merchant.name}`.toLowerCase();

  if (slug.includes('market')) {
    return ['market', 'pickup'];
  }

  if (slug.includes('pharmacy')) {
    return ['pharmacy'];
  }

  if (slug.includes('bloom') || slug.includes('gift')) {
    return ['gifts'];
  }

  return ['restaurants', 'pickup'];
}

function formatAddress(address, fallback) {
  if (!address) {
    return fallback;
  }

  return `${address.line_1}${address.line_2 ? `, ${address.line_2}` : ''}, ${address.city}`;
}

function merchantAccent(merchant) {
  const categories = categoryIdsForMerchant(merchant);

  if (categories.includes('market')) {
    return '#c9f06d';
  }

  if (categories.includes('pharmacy')) {
    return '#a7e8df';
  }

  if (categories.includes('gifts')) {
    return '#ffc4d5';
  }

  return colors.primary;
}

export function CustomerHomeScreen({
  actions = null,
  merchantActionRenderer = null,
}) {
  const { dir, formatCurrency, labelForEnum, t, tp } = useI18n();
  const [search, setSearch] = useState('');
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAddressUuid, setSelectedAddressUuid] = useState();
  const deferredSearch = useDeferredValue(search);

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
  const { data: cart } = useQuery({
    queryKey: ['customer-cart'],
    queryFn: getCartSummary,
  });

  useEffect(() => {
    if (!selectedAddressUuid && addresses.length > 0) {
      setSelectedAddressUuid(
        addresses.find((address) => address.is_default)?.uuid ??
          addresses[0].uuid
      );
    }
  }, [addresses, selectedAddressUuid]);

  const selectedAddress =
    addresses.find((address) => address.uuid === selectedAddressUuid) ??
    addresses.find((address) => address.is_default) ??
    addresses[0];

  const { data: merchants = [] } = useQuery({
    enabled: Boolean(selectedAddress?.uuid),
    queryKey: [
      'customer-merchants',
      selectedAddress?.uuid,
      deferredSearch,
      openNowOnly,
    ],
    queryFn: () =>
      listMerchants({
        address_uuid: selectedAddress?.uuid,
        search: deferredSearch.trim() || undefined,
        open_now: openNowOnly || undefined,
      }),
  });

  const visibleMerchants = useMemo(() => {
    if (selectedCategory === 'all') {
      return merchants;
    }

    return merchants.filter((merchant) =>
      categoryIdsForMerchant(merchant).includes(selectedCategory)
    );
  }, [merchants, selectedCategory]);

  const categoryCounts = useMemo(() => {
    return serviceCategories.reduce((counts, category) => {
      counts[category.id] =
        category.id === 'all'
          ? merchants.length
          : merchants.filter((merchant) =>
              categoryIdsForMerchant(merchant).includes(category.id)
            ).length;
      return counts;
    }, {});
  }, [merchants]);

  return (
    <ScreenFrame
      activeTab="home"
      description={t('customer.home.description')}
      eyebrow={t('customer.home.eyebrow')}
      title={t('customer.home.title')}
    >
      <Text
        testID="customer-locale-direction"
        style={{ height: 0, opacity: 0 }}
      >
        {dir}
      </Text>

      <AppHeader
        addressLabel={
          selectedAddress
            ? selectedAddress.label
            : t('customer.home.selectAddress')
        }
        addressLine={formatAddress(
          selectedAddress,
          t('customer.home.createAddressHelp')
        )}
        cartLabel={`${cart?.itemCount ?? 0} cart`}
        walletLabel={
          notificationInbox
            ? `${notificationInbox.meta.unread_count} new`
            : '0 new'
        }
      />

      <SearchBar
        onChangeText={setSearch}
        placeholder={t('customer.home.searchPlaceholder')}
        testID="merchant-search"
        value={search}
      />

      <PromoBanner
        description={t('customer.home.promoBannerDescription')}
        eyebrow={t('customer.home.promoBannerEyebrow')}
        title={t('customer.home.promoBannerTitle')}
        action={
          <SecondaryButton
            active={openNowOnly}
            label={
              openNowOnly
                ? t('customer.home.openNowOn')
                : t('customer.home.openNowOff')
            }
            onPress={() => setOpenNowOnly((current) => !current)}
            testID="toggle-open-now"
          />
        }
      />

      <View style={screenStyles.section}>
        <SectionHeader title={t('customer.home.dailyOffersTitle')} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={screenStyles.offerRail}
        >
          {dailyOfferCards.map((offer) => (
            <View key={offer.title} style={screenStyles.offerCard}>
              <Text style={screenStyles.offerCardBadge}>{offer.badge}</Text>
              <Text style={screenStyles.offerCardTitle}>{offer.title}</Text>
              <Text style={screenStyles.offerCardMeta}>{offer.meta}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={screenStyles.section}>
        <SectionHeader title={t('customer.home.categoryPickerTitle')} />
        <View style={screenStyles.grid}>
          {serviceCategories.map((category) => (
            <CategoryTile
              active={selectedCategory === category.id}
              key={category.id}
              kicker={category.kicker}
              label={category.label}
              meta={`${categoryCounts[category.id] ?? 0} options`}
              onPress={() => setSelectedCategory(category.id)}
              testID={`category-${category.id}`}
            />
          ))}
        </View>
      </View>

      <InfoCard
        accent={colors.green}
        description={t('customer.home.discoveryContextDescription')}
        eyebrow={t('customer.home.discoveryContext')}
        title={
          selectedAddress
            ? selectedAddress.label
            : t('customer.home.selectAddress')
        }
      >
        <Text style={screenStyles.muted}>
          {formatAddress(selectedAddress, t('customer.home.createAddressHelp'))}
        </Text>
        <View style={screenStyles.row}>
          {addresses.map((address) => (
            <SecondaryButton
              active={address.uuid === selectedAddress?.uuid}
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

      <View style={screenStyles.section}>
        <SectionHeader title={t('customer.home.discoveryTitle')} />
        <Text style={screenStyles.muted}>
          {t('customer.home.discoveryDescription')}
        </Text>
      </View>

      <View style={screenStyles.stacked}>
        {visibleMerchants.length > 0 ? (
          visibleMerchants.map((merchant) => {
            const leadBranch = merchant.branches[0];
            const etaLabel = leadBranch?.serviceability
              ?.estimated_duration_minutes
              ? leadBranch.serviceability.maps_provider
                ? t('customer.home.etaVia', {
                    minutes:
                      leadBranch.serviceability.estimated_duration_minutes,
                    provider: leadBranch.serviceability.maps_provider,
                  })
                : t('customer.home.eta', {
                    minutes:
                      leadBranch.serviceability.estimated_duration_minutes,
                  })
              : null;
            const feeLabel = leadBranch?.serviceability?.delivery_fee_minor
              ? t('customer.home.deliveryFee', {
                  amount: formatCurrency(
                    leadBranch.serviceability.delivery_fee_minor
                  ),
                })
              : t('customer.home.projectedServiceability');
            const badges = [
              merchant.is_open_now
                ? t('customer.home.openNow')
                : t('customer.home.closedNow'),
              tp('customer.home.visibleBranches', merchant.branches.length),
              merchant.is_serviceable
                ? t('customer.home.serviceableCount', {
                    count: merchant.serviceable_branch_count,
                  })
                : t('customer.home.notServiceable'),
              etaLabel,
            ].filter(Boolean);

            return (
              <MerchantRow
                accent={merchantAccent(merchant)}
                action={
                  merchantActionRenderer
                    ? merchantActionRenderer(merchant)
                    : null
                }
                badges={badges}
                description={
                  leadBranch
                    ? `${leadBranch.name} - ${leadBranch.address_line}`
                    : t('customer.home.noActiveBranches')
                }
                key={merchant.uuid}
                meta={feeLabel}
                title={merchant.name}
              />
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
        accent={colors.primaryDeep}
        description={t('customer.home.inboxDescription')}
        eyebrow={t('customer.home.inbox')}
        title={
          notificationInbox
            ? tp(
                'customer.home.unreadNotifications',
                notificationInbox.meta.unread_count
              )
            : t('customer.home.loadingInbox')
        }
      >
        <View style={screenStyles.row}>
          <ActionPill
            label={t('common.total', {
              count: notificationInbox?.meta.total ?? 0,
            })}
          />
          <ActionPill
            label={t('common.unread', {
              count: notificationInbox?.meta.unread_count ?? 0,
            })}
          />
        </View>
        <Text style={screenStyles.muted}>
          {notificationInbox?.data[0]
            ? `${notificationInbox.data[0].title} - ${notificationInbox.data[0].body}`
            : t('customer.home.emptyInbox')}
        </Text>
      </InfoCard>

      <InfoCard
        accent={colors.green}
        description={t('customer.home.activeOrderDescription')}
        eyebrow={t('customer.home.activeOrder')}
        title={
          order
            ? t('customer.home.trackOrder', {
                code: order.uuid.slice(0, 8).toUpperCase(),
              })
            : t('customer.home.preparingOrder')
        }
      >
        <Text style={screenStyles.statValue}>
          {order
            ? labelForEnum('orderStatus', order.status)
            : t('customer.home.loadingOrder')}
        </Text>
        <Text style={screenStyles.muted}>
          {order
            ? t('customer.home.lifecycleEvents', {
                count: order.timeline.length,
              })
            : t('customer.home.waitingOrder')}
        </Text>
      </InfoCard>

      <InfoCard
        accent={colors.ink}
        description={t('customer.home.routesDescription')}
        eyebrow={t('customer.home.routes')}
        title={t('customer.home.routesTitle')}
      >
        <View style={screenStyles.buttonRow}>{actions}</View>
      </InfoCard>
    </ScreenFrame>
  );
}
