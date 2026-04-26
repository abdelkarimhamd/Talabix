import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  checkoutCart,
  getCartSummary,
  getCustomerAddresses,
  redeemCartPromoCode,
  updateCartItemQuantity,
  updateCartNotes,
} from '../customer-api';
import { useI18n } from '../i18n';
import {
  AccentButton,
  ActionPill,
  InfoCard,
  PageIntro,
  PriceSummaryRow,
  ScreenFrame,
  SecondaryButton,
  SectionHeader,
  TextField,
  colors,
  screenStyles,
  withDesignFrame,
} from '../ui';

export function CartScreen({ onCheckoutComplete = null }) {
  const { formatCurrency, rowDirection, t, textAlign, tp, writingDirection } =
    useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState();
  const [promoCode, setPromoCode] = useState('');
  const { data } = useQuery({
    queryKey: ['customer-cart'],
    queryFn: getCartSummary,
  });
  const { data: addresses = [] } = useQuery({
    queryKey: ['customer-addresses'],
    queryFn: getCustomerAddresses,
  });
  const quantityMutation = useMutation({
    mutationFn: ({ lineId, quantity }) =>
      updateCartItemQuantity(lineId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-cart'] });
    },
  });
  const notesMutation = useMutation({
    mutationFn: (notes) => updateCartNotes(notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-cart'] });
      setFeedback(t('customer.cart.checkoutNotesUpdated'));
    },
  });
  const promoMutation = useMutation({
    mutationFn: redeemCartPromoCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-cart'] });
      setFeedback(t('customer.cart.promoApplied', { code: promoCode.trim() }));
      setPromoCode('');
    },
    onError: (error) => {
      setFeedback(error.message ?? t('customer.cart.promoInvalid'));
    },
  });
  const checkoutMutation = useMutation({
    mutationFn: checkoutCart,
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['customer-cart'] });
      queryClient.invalidateQueries({ queryKey: ['customer-active-order'] });
      queryClient.invalidateQueries({
        queryKey: ['customer-order', order.uuid],
      });
      setFeedback(
        t('customer.cart.orderCreated', {
          code: order.uuid.slice(0, 8).toUpperCase(),
        })
      );
      onCheckoutComplete?.(order);
    },
    onError: (error) => {
      setFeedback(error.message ?? t('customer.cart.notReady'));
    },
  });
  const selectedAddress =
    addresses.find((address) => address.uuid === data?.addressUuid) ??
    addresses[0];
  const canCheckout = Boolean(data?.items.length && selectedAddress);
  const checkoutDisabled = !canCheckout || checkoutMutation.isPending;
  const pendingQuantity = quantityMutation.isPending
    ? quantityMutation.variables
    : null;

  return (
    <ScreenFrame
      activeTab="orders"
      description={t('customer.cart.screenDescription')}
      eyebrow={t('customer.cart.screenEyebrow')}
      preserveHeaderText={false}
      showHeader={false}
      title={t('customer.cart.screenTitle')}
    >
      <PageIntro
        kicker={t('customer.cart.pageKicker')}
        title={t('customer.cart.pageTitle')}
      />

      <View style={screenStyles.section}>
        <SectionHeader title={t('customer.cart.items')} />
        <View style={screenStyles.stacked}>
          {data?.items.length ? (
            data.items.map((item) => {
              const isQuantityPending = pendingQuantity?.lineId === item.id;
              const isRemoving =
                isQuantityPending && pendingQuantity.quantity < item.quantity;
              const isAdding =
                isQuantityPending && pendingQuantity.quantity > item.quantity;

              return (
                <View
                  key={item.id ?? item.catalog_item_uuid}
                  style={styles.cartLine}
                >
                  <View
                    style={[
                      styles.cartLineTop,
                      { flexDirection: rowDirection },
                    ]}
                  >
                    <View style={styles.cartLineCopy}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.cartLineTitle,
                          { textAlign, writingDirection },
                        ]}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={[
                          styles.cartLineMeta,
                          { textAlign, writingDirection },
                        ]}
                      >
                        {tp('customer.cart.itemDescription', item.quantity, {
                          amount: formatCurrency(item.unitPriceMinor),
                        })}
                      </Text>
                    </View>
                    <View style={styles.quantityBadge}>
                      <Text style={styles.quantityBadgeText}>
                        {item.quantity}
                      </Text>
                    </View>
                  </View>
                  {item.selectedModifierOptions.length > 0 ? (
                    <Text
                      style={[
                        screenStyles.muted,
                        { textAlign, writingDirection },
                      ]}
                    >
                      {item.selectedModifierOptions
                        .map((option) => `${option.groupName}: ${option.name}`)
                        .join(' - ')}
                    </Text>
                  ) : null}
                  <PriceSummaryRow
                    label={t('customer.cart.lineTotal')}
                    strong
                    value={formatCurrency(item.lineTotalMinor)}
                  />
                  <View
                    style={[
                      screenStyles.buttonRow,
                      { flexDirection: rowDirection },
                    ]}
                  >
                    <SecondaryButton
                      disabled={quantityMutation.isPending}
                      label={
                        isRemoving
                          ? t('customer.cart.removing')
                          : t('customer.cart.removeOne')
                      }
                      onPress={() =>
                        quantityMutation.mutate({
                          lineId: item.id,
                          quantity: item.quantity - 1,
                        })
                      }
                    />
                    <ActionPill
                      label={t('customer.cart.qty', { count: item.quantity })}
                    />
                    <SecondaryButton
                      disabled={quantityMutation.isPending}
                      label={
                        isAdding
                          ? t('customer.cart.adding')
                          : t('customer.cart.addOne')
                      }
                      onPress={() =>
                        quantityMutation.mutate({
                          lineId: item.id,
                          quantity: item.quantity + 1,
                        })
                      }
                    />
                  </View>
                </View>
              );
            })
          ) : (
            <InfoCard
              accent={colors.primaryDeep}
              description={t('customer.cart.emptyDescription')}
              eyebrow={t('customer.cart.emptyEyebrow')}
              title={t('customer.cart.emptyTitle')}
            />
          )}
        </View>
      </View>

      <InfoCard
        accent={colors.green}
        description={
          data?.merchantName
            ? `${data.branchName}${data.merchantName ? ` - ${data.merchantName}` : ''}`
            : t('customer.cart.branchPrompt')
        }
        eyebrow={t('customer.cart.deliveryOrder')}
        title={
          data
            ? tp('customer.cart.itemCount', data.itemCount)
            : t('customer.cart.loadingCart')
        }
      >
        <Text style={[screenStyles.muted, { textAlign, writingDirection }]}>
          {selectedAddress
            ? `${selectedAddress.line_1}, ${selectedAddress.city}`
            : t('customer.cart.noAddress')}
        </Text>
        <View style={[screenStyles.row, { flexDirection: rowDirection }]}>
          <ActionPill label={data?.branchName ?? t('customer.cart.noBranch')} />
          <ActionPill
            label={data?.merchantName ?? t('customer.cart.noStore')}
          />
          <ActionPill label={t('customer.cart.cod')} />
        </View>
      </InfoCard>

      <InfoCard
        accent={colors.ink}
        description={t('customer.cart.paymentSummaryDescription')}
        eyebrow={t('customer.cart.paymentSummary')}
        title={data ? formatCurrency(data.totalMinor) : '--'}
      >
        <TextField
          label={t('customer.cart.deliveryNotes')}
          multiline
          onChangeText={(value) => notesMutation.mutate(value)}
          testID="cart-notes"
          value={data?.notes ?? ''}
        />
        <TextField
          label={t('customer.cart.promoCode')}
          onChangeText={setPromoCode}
          placeholder="COFFEE8"
          testID="cart-promo-code"
          value={promoCode}
        />
        <View style={[screenStyles.buttonRow, { flexDirection: rowDirection }]}>
          <SecondaryButton
            disabled={promoMutation.isPending || !promoCode.trim()}
            label={
              promoMutation.isPending
                ? t('customer.cart.applying')
                : t('customer.cart.applyPromo')
            }
            onPress={() => promoMutation.mutate(promoCode)}
            testID="apply-promo-code"
          />
        </View>
        <PriceSummaryRow
          label={t('customer.cart.subtotal')}
          value={data ? formatCurrency(data.subtotalMinor) : '--'}
        />
        <PriceSummaryRow
          label={t('customer.cart.deliveryFee')}
          value={data ? formatCurrency(data.deliveryFeeMinor) : '--'}
        />
        {data?.itemDiscountMinor ? (
          <PriceSummaryRow
            label={t('customer.cart.offerSavings')}
            value={`-${formatCurrency(data.itemDiscountMinor)}`}
          />
        ) : null}
        {data?.deliveryDiscountMinor ? (
          <PriceSummaryRow
            label={t('customer.cart.freeDelivery')}
            value={`-${formatCurrency(data.deliveryDiscountMinor)}`}
          />
        ) : null}
        {data?.discountMinor ? (
          <PriceSummaryRow
            label={t('customer.cart.totalDiscounts')}
            value={`-${formatCurrency(data.discountMinor)}`}
          />
        ) : null}
        <PriceSummaryRow
          label={t('customer.cart.total')}
          strong
          value={data ? formatCurrency(data.totalMinor) : '--'}
        />
        {data?.appliedOffers?.length ? (
          <View style={screenStyles.row}>
            {data.appliedOffers.map((offer) => (
              <ActionPill
                key={offer.id}
                label={`${offer.title}: -${formatCurrency(
                  offer.discountMinor
                )}`}
                tone="success"
              />
            ))}
          </View>
        ) : null}
        <View style={[screenStyles.buttonRow, { flexDirection: rowDirection }]}>
          <AccentButton
            disabled={checkoutDisabled}
            label={
              checkoutMutation.isPending
                ? t('customer.cart.placingOrder')
                : t('customer.cart.placeCodOrder')
            }
            onPress={() => checkoutMutation.mutate()}
            testID="checkout-now"
          />
          <SecondaryButton
            label={t('customer.cart.back')}
            onPress={() => router.push(withDesignFrame('/'))}
            testID="cart-back"
          />
        </View>
        {feedback ? (
          <Text
            style={[screenStyles.helperText, { textAlign, writingDirection }]}
          >
            {feedback}
          </Text>
        ) : null}
      </InfoCard>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  cartLine: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cartLineTop: {
    alignItems: 'center',
    gap: 12,
  },
  cartLineCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  cartLineTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  cartLineMeta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  quantityBadge: {
    alignItems: 'center',
    backgroundColor: colors.surfaceSoft,
    borderRadius: 10,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  quantityBadgeText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
});
