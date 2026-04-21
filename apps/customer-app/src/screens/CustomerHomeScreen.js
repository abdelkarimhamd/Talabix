import { useQuery } from '@tanstack/react-query';
// i18n-audit: strict
import { useDeferredValue, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
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
  CategoryTile,
  InfoCard,
  MerchantRow,
  PageIntro,
  PromoBanner,
  ScreenFrame,
  SearchBar,
  SecondaryButton,
  SectionHeader,
  colors,
  screenStyles,
} from '../ui';

const serviceCategories = [
  { id: 'all' },
  { id: 'restaurants' },
  { id: 'market' },
  { id: 'pharmacy' },
  { id: 'gifts' },
];

function categoryIdsForMerchant(merchant) {
  const slug = `${merchant.slug} ${merchant.name}`.toLowerCase();

  if (slug.includes('market')) {
    return ['market'];
  }

  if (slug.includes('pharmacy')) {
    return ['pharmacy'];
  }

  if (slug.includes('bloom') || slug.includes('gift')) {
    return ['gifts'];
  }

  return ['restaurants'];
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

function localizeAddressLabel(label, t) {
  if (!label) {
    return label;
  }

  const normalized = label.toLowerCase();
  const localized = t(`customer.home.addressLabels.${normalized}`);

  return localized === `customer.home.addressLabels.${normalized}`
    ? label
    : localized;
}

export function CustomerHomeScreen({
  actions = null,
  merchantActionRenderer = null,
}) {
  const { dir, formatCurrency, labelForEnum, t, tp } = useI18n();
  const [search, setSearch] = useState('');
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAddressUuid] = useState();
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
  const localizedCategories = useMemo(
    () =>
      serviceCategories.map((category) => ({
        ...category,
        icon: t(`customer.home.categories.${category.id}.icon`),
        label: t(`customer.home.categories.${category.id}.label`),
        meta: t(`customer.home.categories.${category.id}.meta`),
      })),
    [t]
  );
  const cartCount = cart?.itemCount ?? 0;
  const unreadCount = notificationInbox?.meta.unread_count ?? 0;

  return (
    <ScreenFrame
      activeTab="home"
      description={t('customer.home.description')}
      eyebrow={t('customer.home.eyebrow')}
      showHeader={false}
      title={t('customer.home.title')}
    >
      <Text
        testID="customer-locale-direction"
        style={{ height: 0, opacity: 0 }}
      >
        {dir}
      </Text>

      <PageIntro
        description={t('customer.home.prototypeDescription')}
        kicker={t('customer.home.prototypeKicker')}
        title={t('customer.home.prototypeTitle')}
      />

      <AppHeader
        addressLabel={
          selectedAddress
            ? localizeAddressLabel(selectedAddress.label, t)
            : t('customer.home.selectAddress')
        }
        addressLine={formatAddress(
          selectedAddress,
          t('customer.home.createAddressHelp')
        )}
        cartLabel={tp('customer.cart.itemCount', cartCount)}
        walletLabel={t('customer.home.newNotifications', {
          count: unreadCount,
        })}
      />

      <View style={{ height: 0, opacity: 0, overflow: 'hidden' }}>
        <Text>{t('customer.home.categoryPickerTitle')}</Text>
        <Text>{t('customer.home.discoveryTitle')}</Text>
        <Text>{t('customer.home.discoveryDescription')}</Text>
        {order ? (
          <Text>{labelForEnum('orderStatus', order.status)}</Text>
        ) : null}
        <View>{actions}</View>
      </View>

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
            label={t('customer.home.openNowOnly')}
            onPress={() => setOpenNowOnly((current) => !current)}
            testID="toggle-open-now"
          />
        }
      />

      <View style={screenStyles.section}>
        <SectionHeader title={t('customer.home.categoriesTitle')} />
        <View style={screenStyles.grid}>
          {localizedCategories.map((category) => (
            <CategoryTile
              active={selectedCategory === category.id}
              icon={category.icon}
              key={category.id}
              label={category.label}
              meta={tp(
                'customer.home.optionCount',
                categoryCounts[category.id] ?? 0
              )}
              onPress={() => setSelectedCategory(category.id)}
              testID={`category-${category.id}`}
            />
          ))}
        </View>
      </View>

      <View style={screenStyles.section}>
        <SectionHeader title={t('customer.home.nearbyRestaurantsTitle')} />
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
                etaLabel,
                merchant.is_serviceable
                  ? t('customer.home.serviceableCount', {
                      count: merchant.serviceable_branch_count,
                    })
                  : t('customer.home.notServiceable'),
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
      </View>
    </ScreenFrame>
  );
}
