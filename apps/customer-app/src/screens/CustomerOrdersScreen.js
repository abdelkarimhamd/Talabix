import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { getCustomerOrderHistory, reorderCustomerOrder } from '../customer-api';
import { useI18n } from '../i18n';
import {
  ActionPill,
  FoodArtwork,
  InfoCard,
  PageIntro,
  PromoBanner,
  SearchBar,
  ScreenFrame,
  SecondaryButton,
  SectionHeader,
  colors,
  screenStyles,
  withDesignFrame,
} from '../ui';

const activeStatuses = [
  'placed',
  'accepted',
  'preparing',
  'ready_for_pickup',
  'assigned',
  'picked_up',
];

function formatOrderDate(value, isRtl, t) {
  return value
    ? new Date(value).toLocaleString(isRtl ? 'ar-SA' : undefined)
    : t('customer.orders.datePending');
}

function localizeBranchName(name, isRtl, t) {
  if (!isRtl) {
    return name;
  }

  const key = `customer.orders.branchNames.${name}`;
  const translated = t(key);

  return translated === key ? name : translated;
}

export function CustomerOrdersScreen() {
  const {
    formatCurrency,
    isRtl,
    labelForEnum,
    rowDirection,
    t,
    textAlign,
    tp,
    writingDirection,
  } = useI18n();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const { data: orders = [] } = useQuery({
    queryKey: ['customer-order-history'],
    queryFn: getCustomerOrderHistory,
  });
  const reorderMutation = useMutation({
    mutationFn: reorderCustomerOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-cart'] });
      router.push(withDesignFrame('/cart'));
    },
  });
  const activeOrder = orders.find((order) =>
    activeStatuses.includes(order.status)
  );
  const visibleOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return orders;
    }

    return orders.filter((order) =>
      [
        order.merchantName,
        order.branchName,
        order.orderCode,
        labelForEnum('orderStatus', order.status),
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [labelForEnum, orders, search]);

  function handleOrderAction(order, isActive) {
    if (isActive) {
      router.push(withDesignFrame(`/orders/${order.uuid}`));
      return;
    }

    reorderMutation.mutate(order.uuid);
  }

  return (
    <ScreenFrame
      activeTab="orders"
      description={t('customer.orders.screenDescription')}
      eyebrow={t('customer.orders.screenEyebrow')}
      preserveHeaderText={false}
      showHeader={false}
      title={t('customer.orders.screenTitle')}
    >
      <PageIntro
        kicker={t('customer.orders.pageKicker')}
        title={t('customer.orders.pageTitle')}
      />

      <SearchBar
        onChangeText={setSearch}
        placeholder={t('customer.orders.searchPlaceholder')}
        testID="order-history-search"
        value={search}
      />

      <PromoBanner
        description={
          activeOrder
            ? t('customer.orders.activeOrderDescription', {
                code: activeOrder.orderCode,
                status: labelForEnum(
                  'orderStatus',
                  activeOrder.status
                ).toLowerCase(),
              })
            : t('customer.orders.noActiveDescription')
        }
        eyebrow={t('customer.orders.latestOrder')}
        title={
          activeOrder
            ? activeOrder.merchantName
            : t('customer.orders.noActiveDelivery')
        }
      />

      <InfoCard
        accent={colors.green}
        description={t('customer.orders.historyDescription')}
        eyebrow={t('customer.orders.historyEyebrow')}
        title={tp('customer.orders.recentOrders', orders.length)}
      >
        <View style={[screenStyles.row, { flexDirection: rowDirection }]}>
          <ActionPill
            label={t('customer.orders.activeAndPast')}
            tone="success"
          />
          <ActionPill label={t('customer.orders.reorderReady')} />
        </View>
      </InfoCard>

      <View style={screenStyles.section}>
        <SectionHeader title={t('customer.orders.orders')} />
        <View style={screenStyles.stacked}>
          {visibleOrders.map((order) => {
            const isActive = activeStatuses.includes(order.status);

            return (
              <View
                key={order.uuid}
                style={[screenStyles.orderRow, { flexDirection: rowDirection }]}
              >
                <FoodArtwork
                  badge={
                    isActive
                      ? t('customer.orders.tracking')
                      : t('customer.orders.pastOrder')
                  }
                  compact
                  label={order.artworkLabel}
                  style={screenStyles.orderThumb}
                />
                <View style={screenStyles.orderBody}>
                  <Text
                    style={[
                      screenStyles.orderTitle,
                      { textAlign, writingDirection },
                    ]}
                  >
                    {order.merchantName}
                  </Text>
                  <Text
                    style={[
                      screenStyles.orderMeta,
                      { textAlign, writingDirection },
                    ]}
                  >
                    {localizeBranchName(order.branchName, isRtl, t)} -{' '}
                    {t('customer.orders.orderCode', {
                      code: order.orderCode,
                    })}
                  </Text>
                  <Text
                    style={[
                      screenStyles.orderMeta,
                      { textAlign, writingDirection },
                    ]}
                  >
                    {formatOrderDate(order.placedAt, isRtl, t)}
                  </Text>
                  <Text
                    style={[
                      screenStyles.orderTotal,
                      { textAlign, writingDirection },
                    ]}
                  >
                    {formatCurrency(order.totalMinor, order.currency)}
                  </Text>
                  <View style={[screenStyles.row, { flexDirection: rowDirection }]}>
                    <ActionPill
                      label={labelForEnum('orderStatus', order.status)}
                      tone={
                        order.status === 'delivered' ? 'success' : 'neutral'
                      }
                    />
                    <ActionPill
                      label={tp('customer.orders.itemCount', order.itemCount)}
                    />
                  </View>
                  <SecondaryButton
                    disabled={reorderMutation.isPending}
                    label={
                      reorderMutation.isPending &&
                      reorderMutation.variables === order.uuid
                        ? t('customer.orders.reordering')
                        : isActive
                          ? t('customer.orders.trackOrder')
                          : t('customer.orders.reorder')
                    }
                    onPress={() => handleOrderAction(order, isActive)}
                    testID={`order-history-action-${order.orderCode}`}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {orders.length === 0 ? (
        <Text style={screenStyles.emptyState}>
          {t('customer.orders.empty')}
        </Text>
      ) : null}
    </ScreenFrame>
  );
}
