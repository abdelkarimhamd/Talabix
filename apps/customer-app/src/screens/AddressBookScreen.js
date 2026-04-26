import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDeferredValue, useState } from 'react';
import { Text, View } from 'react-native';
import {
  createCustomerAddress,
  getCustomerAddresses,
  searchCustomerPlaces,
  updateCustomerAddress,
} from '../customer-api';
import { useI18n } from '../i18n';
import { requestCurrentLocation } from '../location';
import {
  AccentButton,
  AddressChoice,
  InfoCard,
  PageIntro,
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

function addressDescription(address) {
  return `${address.line_1}${address.line_2 ? `, ${address.line_2}` : ''}, ${address.city}`;
}

function addressDetailParts(address, t) {
  return [
    address.building,
    address.floor ? t('customer.addressBook.floor', { floor: address.floor }) : null,
    address.apartment
      ? t('customer.addressBook.unit', {
          apartment: address.apartment,
        })
      : null,
  ]
    .filter(Boolean)
    .join(' - ');
}

export function AddressBookScreen() {
  const { t, textAlign, writingDirection } = useI18n();
  const queryClient = useQueryClient();
  const [editingUuid, setEditingUuid] = useState(null);
  const [placeQuery, setPlaceQuery] = useState('');
  const [form, setForm] = useState(emptyAddressForm);
  const [feedback, setFeedback] = useState();
  const [isFindingLocation, setIsFindingLocation] = useState(false);
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
      setFeedback(
        editingUuid
          ? t('customer.addressBook.addressUpdated')
          : t('customer.addressBook.addressCreated')
      );
      setEditingUuid(null);
      setPlaceQuery('');
      setForm(emptyAddressForm);
    },
    onError: (error) => {
      setFeedback(
        getErrorMessage(error, t('customer.addressBook.reviewFields'))
      );
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
      setFeedback(t('customer.addressBook.defaultUpdated'));
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
    setFeedback(
      t('customer.addressBook.suggestionApplied', {
        title: suggestion.title,
      })
    );
  }

  async function handleUseCurrentLocation() {
    setIsFindingLocation(true);
    setFeedback(t('customer.addressBook.findingCurrentLocation'));

    const result = await requestCurrentLocation();

    if (result.ok) {
      setForm((current) => ({
        ...current,
        latitude: String(result.latitude),
        longitude: String(result.longitude),
      }));
      setFeedback(t('customer.addressBook.locationApplied'));
    } else if (result.reason === 'permission-denied') {
      setFeedback(t('customer.addressBook.locationPermissionDenied'));
    } else {
      setFeedback(t('customer.addressBook.locationUnavailable'));
    }

    setIsFindingLocation(false);
  }

  return (
    <ScreenFrame
      activeTab="profile"
      description={t('customer.addressBook.screenDescription')}
      eyebrow={t('customer.addressBook.screenEyebrow')}
      preserveHeaderText={false}
      showHeader={false}
      title={t('customer.addressBook.screenTitle')}
    >
      <View style={screenStyles.section}>
        <PageIntro
          kicker={t('customer.addressBook.chooseAddress')}
          title={t('customer.addressBook.deliveryAddress')}
        />
        <View style={screenStyles.stacked}>
          {addresses.map((address) => (
            <AddressChoice
              active={address.is_default}
              description={addressDescription(address)}
              key={address.uuid}
              label={
                address.is_default
                  ? t('customer.addressBook.selectedAddress')
                  : t('customer.addressBook.savedAddress')
              }
              meta={
                address.is_default
                  ? t('customer.addressBook.selected')
                  : t('customer.addressBook.use')
              }
              onPress={() => defaultMutation.mutate(address)}
              testID={`address-choice-${address.uuid}`}
            />
          ))}
        </View>
      </View>

      <InfoCard
        accent="#112134"
        description={t('customer.addressBook.placePickerDescription')}
        eyebrow={t('customer.addressBook.placePicker')}
        title={
          editingUuid
            ? t('customer.addressBook.updateSavedAddress')
            : t('customer.addressBook.pickPlaceTitle')
        }
      >
        <View style={screenStyles.form}>
          <TextField
            label={t('customer.addressBook.searchPlaces')}
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
                      {suggestion.building ? ` - ${suggestion.building}` : ''},{' '}
                      {suggestion.city}
                    </Text>
                    <SecondaryButton
                      label={t('customer.addressBook.usePlace', {
                        label: suggestion.label,
                      })}
                      onPress={() => applySuggestion(suggestion)}
                      testID={`use-place-${suggestion.id}`}
                    />
                  </View>
                ))
              ) : (
                <Text style={[screenStyles.muted, { textAlign, writingDirection }]}>
                  {t('customer.addressBook.noSuggestions')}
                </Text>
              )}
            </View>
          ) : null}
          <TextField
            label={t('customer.addressBook.label')}
            onChangeText={(value) => updateField('label', value)}
            placeholder="Home, Office, Parents"
            testID="address-label"
            value={form.label}
          />
          <TextField
            label={t('customer.addressBook.addressLine1')}
            onChangeText={(value) => updateField('line_1', value)}
            placeholder="Street and building access"
            testID="address-line-1"
            value={form.line_1}
          />
          <TextField
            label={t('customer.addressBook.addressLine2')}
            onChangeText={(value) => updateField('line_2', value)}
            placeholder="Optional suite or extra line"
            value={form.line_2}
          />
          <TextField
            label={t('customer.addressBook.building')}
            onChangeText={(value) => updateField('building', value)}
            placeholder="Building name"
            value={form.building}
          />
          <TextField
            label={t('customer.addressBook.floorLabel')}
            onChangeText={(value) => updateField('floor', value)}
            placeholder="Floor"
            value={form.floor}
          />
          <TextField
            label={t('customer.addressBook.apartmentLabel')}
            onChangeText={(value) => updateField('apartment', value)}
            placeholder="Apartment or unit"
            value={form.apartment}
          />
          <TextField
            label={t('customer.addressBook.landmarkLabel')}
            onChangeText={(value) => updateField('landmark', value)}
            placeholder="Closest landmark"
            value={form.landmark}
          />
          <TextField
            label={t('customer.addressBook.deliveryNotes')}
            multiline
            onChangeText={(value) => updateField('delivery_notes', value)}
            placeholder="How should the courier find you?"
            testID="address-delivery-notes"
            value={form.delivery_notes}
          />
          <TextField
            label={t('customer.addressBook.city')}
            onChangeText={(value) => updateField('city', value)}
            placeholder="City"
            testID="address-city"
            value={form.city}
          />
          <View style={screenStyles.inlinePanel}>
            <Text style={[screenStyles.muted, { textAlign, writingDirection }]}>
              {t('customer.addressBook.locationHelp')}
            </Text>
            <SecondaryButton
              disabled={isFindingLocation}
              label={
                isFindingLocation
                  ? t('customer.addressBook.findingCurrentLocation')
                  : t('customer.addressBook.useCurrentLocation')
              }
              onPress={handleUseCurrentLocation}
              testID="use-current-location"
            />
          </View>
          <TextField
            keyboardType="numeric"
            label={t('customer.addressBook.latitude')}
            onChangeText={(value) => updateField('latitude', value)}
            placeholder="24.7136"
            testID="address-latitude"
            value={form.latitude}
          />
          <TextField
            keyboardType="numeric"
            label={t('customer.addressBook.longitude')}
            onChangeText={(value) => updateField('longitude', value)}
            placeholder="46.6753"
            testID="address-longitude"
            value={form.longitude}
          />

          <View style={screenStyles.buttonRow}>
            <SecondaryButton
              disabled={saveMutation.isPending}
              label={
                form.is_default
                  ? t('customer.addressBook.defaultOn')
                  : t('customer.addressBook.markDefault')
              }
              onPress={() => updateField('is_default', !form.is_default)}
              testID="toggle-default-address"
            />
            <AccentButton
              disabled={saveMutation.isPending}
              label={
                saveMutation.isPending
                  ? t('customer.addressBook.saving')
                  : editingUuid
                    ? t('customer.addressBook.saveChanges')
                    : t('customer.addressBook.createSaved')
              }
              onPress={() => saveMutation.mutate()}
            />
            {editingUuid ? (
              <SecondaryButton
                disabled={saveMutation.isPending}
                label={t('customer.addressBook.cancelEdit')}
                onPress={() => {
                  setEditingUuid(null);
                  setForm(emptyAddressForm);
                }}
              />
            ) : null}
          </View>
          {feedback ? (
            <Text
              style={[screenStyles.helperText, { textAlign, writingDirection }]}
            >
              {feedback}
            </Text>
          ) : null}
        </View>
      </InfoCard>

      <View style={screenStyles.stacked}>
        {addresses.map((address) => (
          <InfoCard
            accent={address.is_default ? '#26a69a' : '#d9b675'}
            description={addressDescription(address)}
            eyebrow={
              address.is_default
                ? t('customer.addressBook.defaultAddress')
                : t('customer.addressBook.savedAddress')
            }
            key={address.uuid}
            title={address.label}
          >
            <Text style={[screenStyles.muted, { textAlign, writingDirection }]}>
              {addressDetailParts(address, t)}
            </Text>
            <Text style={[screenStyles.muted, { textAlign, writingDirection }]}>
              {address.landmark
                ? t('customer.addressBook.landmark', {
                    landmark: address.landmark,
                  })
                : t('customer.addressBook.noLandmark')}
            </Text>
            <Text style={[screenStyles.muted, { textAlign, writingDirection }]}>
              {address.delivery_notes
                ? t('customer.addressBook.notes', {
                    notes: address.delivery_notes,
                  })
                : t('customer.addressBook.noNotes')}
            </Text>
            <View style={screenStyles.buttonRow}>
              <SecondaryButton
                disabled={saveMutation.isPending || defaultMutation.isPending}
                label={t('customer.addressBook.edit')}
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
                      ? t('customer.addressBook.makingDefault')
                      : t('customer.addressBook.makeDefault')
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
