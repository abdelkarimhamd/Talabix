import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { getCurrentCustomer, updateCustomerProfile } from '../customer-api';
import { useI18n } from '../i18n';
import {
  AccentButton,
  InfoCard,
  MenuListItem,
  PageIntro,
  ScreenFrame,
  TextField,
  colors,
  screenStyles,
} from '../ui';

function getErrorMessage(error, fallback) {
  if (error?.issues?.length) {
    return fallback;
  }

  return error?.message ?? fallback;
}

export function CustomerProfileScreen() {
  const queryClient = useQueryClient();
  const { rowDirection, t, textAlign, writingDirection } = useI18n();
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
      setFeedback(t('customer.profile.saved', { name: user.name }));
      queryClient.invalidateQueries({ queryKey: ['customer-session'] });
    },
    onError: (error) => {
      setFeedback(
        getErrorMessage(error, t('customer.profile.reviewDetails'))
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
      description={t('customer.profile.screenDescription')}
      eyebrow={t('customer.profile.screenEyebrow')}
      preserveHeaderText={false}
      showHeader={false}
      title={t('customer.profile.screenTitle')}
    >
      <PageIntro
        description={
          customer ? customer.email : t('customer.profile.waitingCustomer')
        }
        kicker={t('customer.profile.account')}
        title={customer ? customer.name : t('customer.profile.loadingProfile')}
      />

      <View style={[screenStyles.walletRail, { flexDirection: rowDirection }]}>
        {[
          ['H+', t('customer.profile.walletHPlus')],
          ['Pay', t('customer.profile.walletPay')],
          ['9K', t('customer.profile.walletRewards')],
          ['%', t('customer.profile.walletVouchers')],
        ].map(([icon, label]) => (
          <View key={label} style={screenStyles.walletTile}>
            <View style={screenStyles.walletIcon}>
              <Text style={screenStyles.walletIconText}>{icon}</Text>
            </View>
            <Text
              style={[
                screenStyles.walletLabel,
                { textAlign, writingDirection },
              ]}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>

      <InfoCard
        accent={colors.primaryDeep}
        description={t('customer.profile.accountDescription')}
        eyebrow={t('customer.profile.currentAccount')}
        title={t('customer.profile.signedInAccount')}
      >
        <Text style={[screenStyles.muted, { textAlign, writingDirection }]}>
          {customer
            ? t('customer.profile.roles', { roles: customer.roles.join(', ') })
            : t('customer.profile.waitingCustomer')}
        </Text>
      </InfoCard>

      <View style={screenStyles.section}>
        <MenuListItem
          icon="account-outline"
          label={t('customer.profile.myProfile')}
          value={t('customer.profile.active')}
        />
        <MenuListItem
          icon="heart-outline"
          label={t('customer.profile.favorites')}
        />
        <MenuListItem
          icon="receipt-text-outline"
          label={t('customer.profile.invoices')}
        />
        <MenuListItem
          icon="bell-outline"
          label={t('customer.profile.notifications')}
        />
        <MenuListItem
          icon="cog-outline"
          label={t('customer.profile.settings')}
        />
        <MenuListItem icon="lifebuoy" label={t('customer.profile.help')} />
      </View>

      <InfoCard
        accent="#26a69a"
        description={t('customer.profile.formDescription')}
        eyebrow={t('customer.profile.profileForm')}
        title={t('customer.profile.editNamePhone')}
      >
        <View style={screenStyles.form}>
          <TextField
            label={t('customer.profile.fullName')}
            onChangeText={(value) => updateField('name', value)}
            testID="profile-name"
            value={form.name}
          />
          <TextField
            label={t('customer.profile.phone')}
            onChangeText={(value) => updateField('phone', value)}
            testID="profile-phone"
            value={form.phone}
          />
          <AccentButton
            disabled={mutation.isPending}
            label={
              mutation.isPending
                ? t('customer.profile.saving')
                : t('customer.profile.save')
            }
            onPress={() => mutation.mutate(form)}
            testID="submit-profile"
          />
          {feedback ? (
            <Text
              style={[screenStyles.helperText, { textAlign, writingDirection }]}
            >
              {feedback}
            </Text>
          ) : null}
        </View>
      </InfoCard>
    </ScreenFrame>
  );
}
