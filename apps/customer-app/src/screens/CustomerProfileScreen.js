import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { getCurrentCustomer, updateCustomerProfile } from '../customer-api';
import { AccentButton, InfoCard, ScreenFrame, TextField, screenStyles } from '../ui';

function getErrorMessage(error, fallback) {
  if (error?.issues?.length) {
    return fallback;
  }

  return error?.message ?? fallback;
}

export function CustomerProfileScreen() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState();
  const [form, setForm] = useState({ name: '', phone: '' });

  const { data: customer } = useQuery({
    queryKey: ['customer-session'],
    queryFn: getCurrentCustomer,
  });

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name,
        phone: customer.phone ?? '',
      });
    }
  }, [customer]);

  const mutation = useMutation({
    mutationFn: updateCustomerProfile,
    onSuccess: (user) => {
      setFeedback(`Saved profile for ${user.name}.`);
      queryClient.invalidateQueries({ queryKey: ['customer-session'] });
    },
    onError: (error) => {
      setFeedback(getErrorMessage(error, 'Please review the profile details.'));
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
      description="Customer profile editing stays intentionally small in this slice: name and phone are writable, and the same payload shape is used by the backend patch endpoint."
      eyebrow="Customer profile"
      title="Update profile basics"
    >
      <InfoCard
        accent="#112134"
        description="The signed-in customer surface stays separate from merchant, rider, and ops profile work."
        eyebrow="Current account"
        title={customer ? customer.email : 'Loading profile'}
      >
        <Text style={screenStyles.muted}>
          {customer ? `Roles: ${customer.roles.join(', ')}` : 'Waiting for the current customer.'}
        </Text>
      </InfoCard>

      <InfoCard
        accent="#26a69a"
        description="This form hits the same contract exposed by PATCH /customer/auth/me."
        eyebrow="Profile form"
        title="Edit name and phone"
      >
        <View style={screenStyles.form}>
          <TextField
            label="Full name"
            onChangeText={(value) => updateField('name', value)}
            testID="profile-name"
            value={form.name}
          />
          <TextField
            label="Phone"
            onChangeText={(value) => updateField('phone', value)}
            testID="profile-phone"
            value={form.phone}
          />
          <AccentButton
            label="Save profile"
            onPress={() => mutation.mutate(form)}
            testID="submit-profile"
          />
          {feedback ? <Text style={screenStyles.helperText}>{feedback}</Text> : null}
        </View>
      </InfoCard>
    </ScreenFrame>
  );
}
