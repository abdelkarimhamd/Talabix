import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { getCurrentCustomer, registerCustomer } from '../customer-api';
import {
  AccentButton,
  InfoCard,
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
      setFeedback(`Registered ${session.user.email}.`);
      queryClient.invalidateQueries({ queryKey: ['customer-session'] });
      setForm({
        ...initialRegisterForm,
        name: session.user.name,
        email: session.user.email,
        phone: session.user.phone ?? '',
      });
    },
    onError: (error) => {
      setFeedback(getErrorMessage(error, 'Please review the registration details.'));
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
      description="Customer registration issues the same token-and-user envelope as login, so the mobile shell can move straight into discovery and profile editing."
      eyebrow="Customer registration"
      title="Create or replace the current customer session"
    >
      <InfoCard
        accent="#26a69a"
        description="The mobile form validates against the same register schema mirrored in the shared package."
        eyebrow="Current session"
        title={customer ? customer.name : 'No customer loaded'}
      >
        <Text style={screenStyles.muted}>{customer?.email ?? 'Customer session is loading.'}</Text>
        {issuedToken ? (
          <Text style={screenStyles.helperText}>Issued token: {issuedToken.slice(0, 18)}...</Text>
        ) : null}
      </InfoCard>

      <InfoCard
        accent="#ff8c42"
        description="Email/password stays the only auth mode in this phase, and the customer role is implicit on successful registration."
        eyebrow="Registration form"
        title="Register customer credentials"
      >
        <View style={screenStyles.form}>
          <TextField
            label="Full name"
            onChangeText={(value) => updateField('name', value)}
            placeholder="Customer name"
            testID="register-name"
            value={form.name}
          />
          <TextField
            label="Email"
            onChangeText={(value) => updateField('email', value)}
            placeholder="customer@talabix.test"
            testID="register-email"
            value={form.email}
          />
          <TextField
            label="Phone"
            onChangeText={(value) => updateField('phone', value)}
            placeholder="+9665..."
            testID="register-phone"
            value={form.phone}
          />
          <TextField
            label="Device name"
            onChangeText={(value) => updateField('device_name', value)}
            placeholder="iphone-15"
            value={form.device_name}
          />
          <TextField
            label="Password"
            onChangeText={(value) => updateField('password', value)}
            placeholder="Minimum 8 characters"
            testID="register-password"
            value={form.password}
          />
          <TextField
            label="Confirm password"
            onChangeText={(value) => updateField('password_confirmation', value)}
            placeholder="Repeat password"
            testID="register-password-confirmation"
            value={form.password_confirmation}
          />

          <View style={screenStyles.buttonRow}>
            <AccentButton
              label="Create customer account"
              onPress={() => mutation.mutate(form)}
              testID="submit-register"
            />
            <SecondaryButton
              label="Reset form"
              onPress={() => {
                setForm(initialRegisterForm);
                setFeedback(undefined);
              }}
            />
          </View>
          {feedback ? <Text style={screenStyles.helperText}>{feedback}</Text> : null}
        </View>
      </InfoCard>

      {footer}
    </ScreenFrame>
  );
}
