import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Text, View } from 'react-native';
import {
  checkoutCart,
  getCartSummary,
  getCustomerAddresses,
  updateCartItemQuantity,
  updateCartNotes,
} from '../customer-api';
import {
  AccentButton,
  InfoCard,
  ScreenFrame,
  SecondaryButton,
  TextField,
  screenStyles,
} from '../ui';

export function CartScreen({ onCheckoutComplete = null }) {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState();
  const { data } = useQuery({
    queryKey: ['customer-cart'],
    queryFn: getCartSummary,
  });
  const { data: addresses = [] } = useQuery({
    queryKey: ['customer-addresses'],
    queryFn: getCustomerAddresses,
  });
  const quantityMutation = useMutation({
    mutationFn: ({ lineId, quantity }) => updateCartItemQuantity(lineId, quantity),
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
  const checkoutMutation = useMutation({
    mutationFn: checkoutCart,
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['customer-cart'] });
      queryClient.invalidateQueries({ queryKey: ['customer-active-order'] });
      queryClient.invalidateQueries({ queryKey: ['customer-order', order.uuid] });
      setFeedback(`Order ${order.uuid.slice(0, 8).toUpperCase()} created.`);
      onCheckoutComplete?.(order);
    },
    onError: (error) => {
      setFeedback(error.message ?? 'Cart is not ready for checkout.');
    },
  });
  const selectedAddress = addresses.find((address) => address.uuid === data?.addressUuid) ?? addresses[0];

  return (
    <ScreenFrame
      description="The cart snapshot keeps prices explicit so checkout can write the order snapshot and timeline safely on the backend."
      eyebrow="Cart + checkout"
      title="Ready for COD checkout"
    >
      <View style={screenStyles.stacked}>
        {data?.items.map((item) => (
          <InfoCard
            accent="#ff8c42"
            description={`${item.quantity} item`}
            eyebrow="Cart item"
            key={item.id ?? item.catalog_item_uuid}
            title={item.name}
          >
            <Text style={screenStyles.statValue}>
              {(item.lineTotalMinor / 100).toFixed(2)} SAR
            </Text>
            {item.selectedModifierOptions.length > 0 ? (
              <Text style={screenStyles.muted}>
                {item.selectedModifierOptions.map((option) => `${option.groupName}: ${option.name}`).join(' • ')}
              </Text>
            ) : null}
            <View style={screenStyles.buttonRow}>
              <SecondaryButton
                label="Remove one"
                onPress={() =>
                  quantityMutation.mutate({
                    lineId: item.id,
                    quantity: item.quantity - 1,
                  })
                }
              />
              <SecondaryButton
                label="Add one"
                onPress={() =>
                  quantityMutation.mutate({
                    lineId: item.id,
                    quantity: item.quantity + 1,
                  })
                }
              />
            </View>
          </InfoCard>
        ))}

        <InfoCard
          accent="#26a69a"
          description="Checkout uses the current default address from the address book and keeps COD as the only payment mode."
          eyebrow="Delivery context"
          title={selectedAddress ? selectedAddress.label : 'Add a default address first'}
        >
          <Text style={screenStyles.muted}>
            {selectedAddress
              ? `${selectedAddress.line_1}, ${selectedAddress.city}`
              : 'No address available for checkout.'}
          </Text>
          <Text style={screenStyles.muted}>
            {data?.branchName
              ? `${data.branchName}${data.merchantName ? ` - ${data.merchantName}` : ''}`
              : 'Pick a branch from merchant discovery.'}
          </Text>
        </InfoCard>

        <InfoCard
          accent="#112134"
          description="COD only in v1, with pricing and delivery fee locked into the order snapshot."
          eyebrow="Checkout summary"
          title={`${data ? (data.totalMinor / 100).toFixed(2) : '--'} SAR total`}
        >
          <TextField
            label="Delivery notes"
            multiline
            onChangeText={(value) => notesMutation.mutate(value)}
            testID="cart-notes"
            value={data?.notes ?? ''}
          />
          <Text style={screenStyles.muted}>
            Subtotal {data ? (data.subtotalMinor / 100).toFixed(2) : '--'} SAR - Delivery fee{' '}
            {data ? (data.deliveryFeeMinor / 100).toFixed(2) : '--'} SAR
          </Text>
          <View style={screenStyles.buttonRow}>
            <AccentButton
              label="Place COD order"
              onPress={() => checkoutMutation.mutate()}
              testID="checkout-now"
            />
          </View>
          {feedback ? <Text style={screenStyles.helperText}>{feedback}</Text> : null}
        </InfoCard>

        {data && data.items.length === 0 ? (
          <InfoCard
            accent="#d9b675"
            description="Browse a branch catalog to add items before checking out."
            eyebrow="Empty cart"
            title="Cart is currently empty"
          />
        ) : null}
      </View>
    </ScreenFrame>
  );
}
