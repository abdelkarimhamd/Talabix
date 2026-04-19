import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDeferredValue, useState } from 'react';
import { Text, View } from 'react-native';
import {
  createCustomerAddress,
  getCustomerAddresses,
  searchCustomerPlaces,
  updateCustomerAddress,
} from '../customer-api';
import {
  AccentButton,
  InfoCard,
  ScreenFrame,
  SecondaryButton,
  TextField,
  screenStyles,
} from '../ui';

const emptyAddressForm = {
  label: '',
  line_1: '',
  line_2: '',
  building: '',
  floor: '',
  apartment: '',
  landmark: '',
  delivery_notes: '',
  city: 'Riyadh',
  latitude: '24.7136',
  longitude: '46.6753',
  is_default: false,
};

function toAddressForm(address) {
  return {
    label: address.label,
    line_1: address.line_1,
    line_2: address.line_2 ?? '',
    building: address.building ?? '',
    floor: address.floor ?? '',
    apartment: address.apartment ?? '',
    landmark: address.landmark ?? '',
    delivery_notes: address.delivery_notes ?? '',
    city: address.city,
    latitude: String(address.latitude),
    longitude: String(address.longitude),
    is_default: address.is_default,
  };
}

function getErrorMessage(error, fallback) {
  if (error?.issues?.length) {
    return fallback;
  }

  return error?.message ?? fallback;
}

export function AddressBookScreen() {
  const queryClient = useQueryClient();
  const [editingUuid, setEditingUuid] = useState(null);
  const [placeQuery, setPlaceQuery] = useState('');
  const [form, setForm] = useState(emptyAddressForm);
  const [feedback, setFeedback] = useState();
  const deferredPlaceQuery = useDeferredValue(placeQuery.trim());

  const { data: addresses = [] } = useQuery({
    queryKey: ['customer-addresses'],
    queryFn: getCustomerAddresses,
  });
  const { data: suggestions = [] } = useQuery({
    enabled: deferredPlaceQuery.length >= 2,
    queryKey: ['customer-place-search', deferredPlaceQuery],
    queryFn: () => searchCustomerPlaces(deferredPlaceQuery),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      editingUuid
        ? updateCustomerAddress(editingUuid, form)
        : createCustomerAddress(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
      queryClient.invalidateQueries({ queryKey: ['customer-merchants'] });
      setFeedback(editingUuid ? 'Address updated.' : 'Address created.');
      setEditingUuid(null);
      setPlaceQuery('');
      setForm(emptyAddressForm);
    },
    onError: (error) => {
      setFeedback(getErrorMessage(error, 'Please review the address fields.'));
    },
  });

  const defaultMutation = useMutation({
    mutationFn: (address) =>
      updateCustomerAddress(address.uuid, {
        ...address,
        is_default: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
      queryClient.invalidateQueries({ queryKey: ['customer-merchants'] });
      setFeedback('Default address updated.');
    },
  });
  const defaultPendingAddressUuid = defaultMutation.isPending
    ? defaultMutation.variables?.uuid
    : null;

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function applySuggestion(suggestion) {
    setForm((current) => ({
      ...current,
      label: current.label || suggestion.label,
      line_1: suggestion.line_1,
      line_2: suggestion.line_2 ?? '',
      building: suggestion.building ?? '',
      landmark: suggestion.landmark ?? '',
      city: suggestion.city,
      latitude: String(suggestion.latitude),
      longitude: String(suggestion.longitude),
    }));
    setFeedback(`Applied ${suggestion.title} from map search.`);
  }

  return (
    <ScreenFrame
      activeTab="profile"
      description="Addresses now capture richer branch-serviceability context, keep one default address in play, and support map-driven place search before manual edits."
      eyebrow="Address book"
      title="Saved drop-off points with richer delivery detail"
    >
      <InfoCard
        accent="#112134"
        description="The same structured payload is used by the backend form request, the shared zod schema, and this mobile shell."
        eyebrow="Map place picker"
        title={
          editingUuid
            ? 'Update saved address'
            : 'Pick a place, then save the address'
        }
      >
        <View style={screenStyles.form}>
          <TextField
            label="Search places"
            onChangeText={setPlaceQuery}
            placeholder="Olaya, DQ, King Fahd..."
            testID="place-search-query"
            value={placeQuery}
          />
          {deferredPlaceQuery.length >= 2 ? (
            <View style={screenStyles.stacked}>
              {suggestions.length > 0 ? (
                suggestions.map((suggestion) => (
                  <View key={suggestion.id} style={screenStyles.inlinePanel}>
                    <Text style={screenStyles.inlineTitle}>
                      {suggestion.title}
                    </Text>
                    <Text style={screenStyles.muted}>
                      {suggestion.line_1}
                      {suggestion.building
                        ? ` - ${suggestion.building}`
                        : ''}, {suggestion.city}
                    </Text>
                    <SecondaryButton
                      label={`Use ${suggestion.label}`}
                      onPress={() => applySuggestion(suggestion)}
                      testID={`use-place-${suggestion.id}`}
                    />
                  </View>
                ))
              ) : (
                <Text style={screenStyles.muted}>
                  No map suggestions match the current query.
                </Text>
              )}
            </View>
          ) : null}
          <TextField
            label="Label"
            onChangeText={(value) => updateField('label', value)}
            placeholder="Home, Office, Parents"
            testID="address-label"
            value={form.label}
          />
          <TextField
            label="Address line 1"
            onChangeText={(value) => updateField('line_1', value)}
            placeholder="Street and building access"
            testID="address-line-1"
            value={form.line_1}
          />
          <TextField
            label="Address line 2"
            onChangeText={(value) => updateField('line_2', value)}
            placeholder="Optional suite or extra line"
            value={form.line_2}
          />
          <TextField
            label="Building"
            onChangeText={(value) => updateField('building', value)}
            placeholder="Building name"
            value={form.building}
          />
          <TextField
            label="Floor"
            onChangeText={(value) => updateField('floor', value)}
            placeholder="Floor"
            value={form.floor}
          />
          <TextField
            label="Apartment"
            onChangeText={(value) => updateField('apartment', value)}
            placeholder="Apartment or unit"
            value={form.apartment}
          />
          <TextField
            label="Landmark"
            onChangeText={(value) => updateField('landmark', value)}
            placeholder="Closest landmark"
            value={form.landmark}
          />
          <TextField
            label="Delivery notes"
            multiline
            onChangeText={(value) => updateField('delivery_notes', value)}
            placeholder="How should the courier find you?"
            testID="address-delivery-notes"
            value={form.delivery_notes}
          />
          <TextField
            label="City"
            onChangeText={(value) => updateField('city', value)}
            placeholder="City"
            testID="address-city"
            value={form.city}
          />
          <TextField
            keyboardType="numeric"
            label="Latitude"
            onChangeText={(value) => updateField('latitude', value)}
            placeholder="24.7136"
            value={form.latitude}
          />
          <TextField
            keyboardType="numeric"
            label="Longitude"
            onChangeText={(value) => updateField('longitude', value)}
            placeholder="46.6753"
            value={form.longitude}
          />

          <View style={screenStyles.buttonRow}>
            <SecondaryButton
              disabled={saveMutation.isPending}
              label={form.is_default ? 'Default on' : 'Mark as default'}
              onPress={() => updateField('is_default', !form.is_default)}
              testID="toggle-default-address"
            />
            <AccentButton
              disabled={saveMutation.isPending}
              label={
                saveMutation.isPending
                  ? 'Saving address'
                  : editingUuid
                    ? 'Save address changes'
                    : 'Create saved address'
              }
              onPress={() => saveMutation.mutate()}
            />
            {editingUuid ? (
              <SecondaryButton
                disabled={saveMutation.isPending}
                label="Cancel edit"
                onPress={() => {
                  setEditingUuid(null);
                  setForm(emptyAddressForm);
                }}
              />
            ) : null}
          </View>
          {feedback ? (
            <Text style={screenStyles.helperText}>{feedback}</Text>
          ) : null}
        </View>
      </InfoCard>

      <View style={screenStyles.stacked}>
        {addresses.map((address) => (
          <InfoCard
            accent={address.is_default ? '#26a69a' : '#d9b675'}
            description={`${address.line_1}${address.line_2 ? `, ${address.line_2}` : ''}, ${address.city}`}
            eyebrow={address.is_default ? 'Default address' : 'Saved address'}
            key={address.uuid}
            title={address.label}
          >
            <Text style={screenStyles.muted}>
              {[
                address.building,
                address.floor ? `Floor ${address.floor}` : null,
                address.apartment ? `Unit ${address.apartment}` : null,
              ]
                .filter(Boolean)
                .join(' - ')}
            </Text>
            <Text style={screenStyles.muted}>
              {address.landmark
                ? `Landmark: ${address.landmark}`
                : 'No landmark saved yet.'}
            </Text>
            <Text style={screenStyles.muted}>
              {address.delivery_notes
                ? `Notes: ${address.delivery_notes}`
                : 'No delivery notes saved.'}
            </Text>
            <View style={screenStyles.buttonRow}>
              <SecondaryButton
                disabled={saveMutation.isPending || defaultMutation.isPending}
                label="Edit"
                onPress={() => {
                  setEditingUuid(address.uuid);
                  setForm(toAddressForm(address));
                  setFeedback(undefined);
                }}
              />
              {!address.is_default ? (
                <SecondaryButton
                  disabled={defaultMutation.isPending}
                  label={
                    defaultPendingAddressUuid === address.uuid
                      ? 'Making default'
                      : 'Make default'
                  }
                  onPress={() => defaultMutation.mutate(address)}
                  testID={`make-default-${address.uuid}`}
                />
              ) : null}
            </View>
          </InfoCard>
        ))}
      </View>
    </ScreenFrame>
  );
}
