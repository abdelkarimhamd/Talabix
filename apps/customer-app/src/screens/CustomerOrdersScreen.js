import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import {
  getCustomerOrderHistory,
  reorderCustomerOrder,
} from '../customer-api';
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

function formatOrderDate(value) {
  return value ? new Date(value).toLocaleString() : 'Date pending';
}

export function CustomerOrdersScreen() {
  const { formatCurrency, labelForEnum } = useI18n();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: orders = [] } = useQuery({
    queryKey: ['customer-order-history'],
    queryFn: getCustomerOrderHistory,
  });
  const reorderMutation = useMutation({
    mutationFn: reorderCustomerOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-cart'] });
      router.push('/cart');
    },
  });
  const activeOrder = orders.find((order) =>
    ['placed', 'accepted', 'preparing', 'ready_for_pickup', 'assigned', 'picked_up'].includes(
      order.status
    )
  );

  function handleOrderAction(order, isActive) {
    if (isActive) {
      router.push(`/orders/${order.uuid}`);
      return;
    }

    reorderMutation.mutate(order.uuid);
  }

  return (
    <ScreenFrame
      activeTab="orders"
      description="Review active and previous purchases from the customer order history API."
      eyebrow="Orders"
      title="Order history"
    >
      <PromoBanner
        description={
          activeOrder
            ? `Order ${activeOrder.orderCode} is ${labelForEnum(
                'orderStatus',
                activeOrder.status
              ).toLowerCase()}.`
            : 'Previous purchases stay ready for quick reorder.'
        }
        eyebrow="Latest order"
        title={activeOrder ? activeOrder.merchantName : 'No active delivery'}
      />

      <InfoCard
        accent={colors.green}
        description="This list is backed by the customer order history endpoint, separate from the live tracking detail call."
        eyebrow="History API"
        title={`${orders.length} recent order${orders.length === 1 ? '' : 's'}`}
      >
        <View style={screenStyles.row}>
          <ActionPill label="Active and past orders" tone="success" />
          <ActionPill label="Reorder-ready" />
        </View>
      </InfoCard>

      <View style={screenStyles.section}>
        <SectionHeader title="Orders" />
        <View style={screenStyles.stacked}>
          {orders.map((order) => {
            const isActive = [
              'placed',
              'accepted',
              'preparing',
              'ready_for_pickup',
              'assigned',
              'picked_up',
            ].includes(order.status);

            return (
              <InfoCard
                accent={isActive ? colors.green : colors.primaryDeep}
                description={`${order.branchName} - Order ${order.orderCode}`}
                eyebrow={isActive ? 'Current order' : 'Past order'}
                key={order.uuid}
                title={order.merchantName}
              >
                <FoodArtwork
                  badge={isActive ? 'Tracking' : 'Past order'}
                  compact
                  label={order.artworkLabel}
                />
                <PriceSummaryRow
                  label="Total"
                  strong
                  value={formatCurrency(order.totalMinor, order.currency)}
                />
                <Text style={screenStyles.muted}>
                  Placed {formatOrderDate(order.placedAt)}
                </Text>
                <View style={screenStyles.row}>
                  <ActionPill
                    label={labelForEnum('orderStatus', order.status)}
                    tone={order.status === 'delivered' ? 'success' : 'neutral'}
                  />
                  <ActionPill
                    label={`${order.itemCount} item${
                      order.itemCount === 1 ? '' : 's'
                    }`}
                  />
                </View>
                <View style={screenStyles.buttonRow}>
                  <SecondaryButton
                    disabled={reorderMutation.isPending}
                    label={
                      reorderMutation.isPending &&
                      reorderMutation.variables === order.uuid
                        ? 'Reordering...'
                        : isActive
                          ? 'Track order'
                          : 'Reorder'
                    }
                    onPress={() => handleOrderAction(order, isActive)}
                    testID={`order-history-action-${order.orderCode}`}
                  />
                </View>
              </InfoCard>
            );
          })}
        </View>
      </View>

      {orders.length === 0 ? (
        <Text style={screenStyles.emptyState}>
          No order history is available for this customer yet.
        </Text>
      ) : null}
    </ScreenFrame>
  );
}
