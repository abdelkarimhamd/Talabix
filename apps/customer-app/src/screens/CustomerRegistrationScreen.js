import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { getCurrentCustomer, registerCustomer } from '../customer-api';
import { useI18n } from '../i18n';
import {
  AccentButton,
  InfoCard,
  PageIntro,
  ScreenFrame,
  SecondaryButton,
  TextField,
  screenStyles,
} from '../ui';

const initialRegisterForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  password_confirmation: '',
  device_name: 'expo-demo-phone',
};

function getErrorMessage(error, fallback) {
  if (error?.issues?.length) {
    return fallback;
  }

  return error?.message ?? fallback;
}

export function CustomerRegistrationScreen({ footer = null }) {
  const queryClient = useQueryClient();
  const { rowDirection, t, textAlign, writingDirection } = useI18n();
  const [form, setForm] = useState(initialRegisterForm);
  const [feedback, setFeedback] = useState();
  const [issuedToken, setIssuedToken] = useState();

  const { data: customer } = useQuery({
    queryKey: ['customer-session'],
    queryFn: getCurrentCustomer,
  });

  const mutation = useMutation({
    mutationFn: registerCustomer,
    onSuccess: (session) => {
      setIssuedToken(session.token);
      setFeedback(
        t('customer.registration.registered', {
          email: session.user.email,
        })
      );
      queryClient.invalidateQueries({ queryKey: ['customer-session'] });
      setForm({
        ...initialRegisterForm,
        name: session.user.name,
        email: session.user.email,
        phone: session.user.phone ?? '',
      });
    },
    onError: (error) => {
      setFeedback(
        getErrorMessage(error, t('customer.registration.reviewDetails'))
      );
    },
  });

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  return (
    <ScreenFrame
      activeTab="profile"
      description={t('customer.registration.screenDescription')}
      eyebrow={t('customer.registration.screenEyebrow')}
      preserveHeaderText={false}
      showHeader={false}
      title={t('customer.registration.screenTitle')}
    >
      <PageIntro
        kicker={t('customer.registration.pageKicker')}
        title={t('customer.registration.pageTitle')}
      />

      <InfoCard
        accent="#26a69a"
        description={t('customer.registration.sessionDescription')}
        eyebrow={t('customer.registration.currentSession')}
        title={customer ? customer.name : t('customer.registration.noCustomerLoaded')}
      >
        <Text style={[screenStyles.muted, { textAlign, writingDirection }]}>
          {customer?.email ?? t('customer.registration.sessionLoading')}
        </Text>
        {issuedToken ? (
          <Text
            style={[screenStyles.helperText, { textAlign, writingDirection }]}
          >
            {t('customer.registration.issuedToken')}: {issuedToken.slice(0, 18)}
            ...
          </Text>
        ) : null}
      </InfoCard>

      <InfoCard
        accent="#ff8c42"
        description={t('customer.registration.formDescription')}
        eyebrow={t('customer.registration.registrationForm')}
        title={t('customer.registration.registerCredentials')}
      >
        <View style={screenStyles.form}>
          <TextField
            label={t('customer.registration.fullName')}
            onChangeText={(value) => updateField('name', value)}
            placeholder="Customer name"
            testID="register-name"
            value={form.name}
          />
          <TextField
            label={t('customer.registration.email')}
            onChangeText={(value) => updateField('email', value)}
            placeholder="customer@talabix.test"
            testID="register-email"
            value={form.email}
          />
          <TextField
            label={t('customer.registration.phone')}
            onChangeText={(value) => updateField('phone', value)}
            placeholder="+9665..."
            testID="register-phone"
            value={form.phone}
          />
          <TextField
            label={t('customer.registration.deviceName')}
            onChangeText={(value) => updateField('device_name', value)}
            placeholder="iphone-15"
            value={form.device_name}
          />
          <TextField
            label={t('customer.registration.password')}
            onChangeText={(value) => updateField('password', value)}
            placeholder="Minimum 8 characters"
            testID="register-password"
            value={form.password}
          />
          <TextField
            label={t('customer.registration.confirmPassword')}
            onChangeText={(value) => updateField('password_confirmation', value)}
            placeholder="Repeat password"
            testID="register-password-confirmation"
            value={form.password_confirmation}
          />

          <View style={[screenStyles.buttonRow, { flexDirection: rowDirection }]}>
            <AccentButton
              label={t('customer.registration.createAccount')}
              onPress={() => mutation.mutate(form)}
              testID="submit-register"
            />
            <SecondaryButton
              label={t('customer.registration.resetForm')}
              onPress={() => {
                setForm(initialRegisterForm);
                setFeedback(undefined);
              }}
            />
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

      {footer}
    </ScreenFrame>
  );
}
