import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Text, View } from 'react-native';
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
  PriceSummaryRow,
  PromoBanner,
  ScreenFrame,
  SecondaryButton,
  SectionHeader,
  TextField,
  colors,
  screenStyles,
} from '../ui';

export function CartScreen({ onCheckoutComplete = null }) {
  const { formatCurrency } = useI18n();
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
      setFeedback('Checkout notes updated.');
    },
  });
  const promoMutation = useMutation({
    mutationFn: redeemCartPromoCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-cart'] });
      setFeedback(`Promo code ${promoCode.trim()} applied.`);
      setPromoCode('');
    },
    onError: (error) => {
      setFeedback(error.message ?? 'Promo code is not valid for this cart.');
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
      setFeedback(`Order ${order.uuid.slice(0, 8).toUpperCase()} created.`);
      onCheckoutComplete?.(order);
    },
    onError: (error) => {
      setFeedback(error.message ?? 'Cart is not ready for checkout.');
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
      description="Review item quantities, delivery address, notes, and COD totals before creating the order."
      eyebrow="Checkout"
      title="Your Talabix cart"
    >
      <PromoBanner
        description={
          data?.merchantName
            ? `${data.branchName}${data.merchantName ? ` - ${data.merchantName}` : ''}`
            : 'Pick a branch from merchant discovery to start a cart.'
        }
        eyebrow="Delivery order"
        title={
          data
            ? `${data.itemCount} cart item${data.itemCount === 1 ? '' : 's'}`
            : 'Loading cart'
        }
      />

      <View style={screenStyles.stacked}>
        <View style={screenStyles.section}>
          <SectionHeader title="Items" />
          {data?.items.length ? (
            data.items.map((item) => {
              const isQuantityPending = pendingQuantity?.lineId === item.id;
              const isRemoving =
                isQuantityPending && pendingQuantity.quantity < item.quantity;
              const isAdding =
                isQuantityPending && pendingQuantity.quantity > item.quantity;

              return (
                <InfoCard
                  accent={colors.primaryDeep}
                  description={`${item.quantity} item${item.quantity === 1 ? '' : 's'} at ${formatCurrency(item.unitPriceMinor)} each`}
                  eyebrow="Cart item"
                  key={item.id ?? item.catalog_item_uuid}
                  title={item.name}
                >
                  <PriceSummaryRow
                    label="Line total"
                    strong
                    value={formatCurrency(item.lineTotalMinor)}
                  />
                  {item.selectedModifierOptions.length > 0 ? (
                    <Text style={screenStyles.muted}>
                      {item.selectedModifierOptions
                        .map((option) => `${option.groupName}: ${option.name}`)
                        .join(' - ')}
                    </Text>
                  ) : null}
                  <View style={screenStyles.buttonRow}>
                    <SecondaryButton
                      disabled={quantityMutation.isPending}
                      label={isRemoving ? 'Removing' : 'Remove one'}
                      onPress={() =>
                        quantityMutation.mutate({
                          lineId: item.id,
                          quantity: item.quantity - 1,
                        })
                      }
                    />
                    <ActionPill label={`Qty ${item.quantity}`} />
                    <SecondaryButton
                      disabled={quantityMutation.isPending}
                      label={isAdding ? 'Adding' : 'Add one'}
                      onPress={() =>
                        quantityMutation.mutate({
                          lineId: item.id,
                          quantity: item.quantity + 1,
                        })
                      }
                    />
                  </View>
                </InfoCard>
              );
            })
          ) : (
            <InfoCard
              accent={colors.primaryDeep}
              description="Browse a branch catalog to add items before checking out."
              eyebrow="Empty cart"
              title="Cart is currently empty"
            />
          )}
        </View>

        <InfoCard
          accent={colors.green}
          description="Checkout uses the current default address from the address book."
          eyebrow="Delivery context"
          title={
            selectedAddress
              ? selectedAddress.label
              : 'Add a default address first'
          }
        >
          <Text style={screenStyles.muted}>
            {selectedAddress
              ? `${selectedAddress.line_1}, ${selectedAddress.city}`
              : 'No address available for checkout.'}
          </Text>
          <View style={screenStyles.row}>
            <ActionPill label={data?.branchName ?? 'No branch selected'} />
            <ActionPill label={data?.merchantName ?? 'No store selected'} />
            <ActionPill label="COD" />
          </View>
        </InfoCard>

        <InfoCard
          accent={colors.ink}
          description="COD only in v1, with pricing and delivery fee locked into the order snapshot."
          eyebrow="Payment summary"
          title={data ? formatCurrency(data.totalMinor) : '--'}
        >
          <TextField
            label="Delivery notes"
            multiline
            onChangeText={(value) => notesMutation.mutate(value)}
            testID="cart-notes"
            value={data?.notes ?? ''}
          />
          <TextField
            label="Promo code"
            onChangeText={setPromoCode}
            placeholder="COFFEE8"
            testID="cart-promo-code"
            value={promoCode}
          />
          <View style={screenStyles.buttonRow}>
            <SecondaryButton
              disabled={promoMutation.isPending || !promoCode.trim()}
              label={promoMutation.isPending ? 'Applying' : 'Apply promo'}
              onPress={() => promoMutation.mutate(promoCode)}
              testID="apply-promo-code"
            />
          </View>
          <PriceSummaryRow
            label="Subtotal"
            value={data ? formatCurrency(data.subtotalMinor) : '--'}
          />
          <PriceSummaryRow
            label="Delivery fee"
            value={data ? formatCurrency(data.deliveryFeeMinor) : '--'}
          />
          {data?.itemDiscountMinor ? (
            <PriceSummaryRow
              label="Offer savings"
              value={`-${formatCurrency(data.itemDiscountMinor)}`}
            />
          ) : null}
          {data?.deliveryDiscountMinor ? (
            <PriceSummaryRow
              label="Free delivery"
              value={`-${formatCurrency(data.deliveryDiscountMinor)}`}
            />
          ) : null}
          {data?.discountMinor ? (
            <PriceSummaryRow
              label="Total discounts"
              value={`-${formatCurrency(data.discountMinor)}`}
            />
          ) : null}
          <PriceSummaryRow
            label="Total"
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
          <View style={screenStyles.buttonRow}>
            <AccentButton
              disabled={checkoutDisabled}
              label={
                checkoutMutation.isPending ? 'Placing order' : 'Place COD order'
              }
              onPress={() => checkoutMutation.mutate()}
              testID="checkout-now"
            />
          </View>
          {feedback ? (
            <Text style={screenStyles.helperText}>{feedback}</Text>
          ) : null}
        </InfoCard>
      </View>
    </ScreenFrame>
  );
}
