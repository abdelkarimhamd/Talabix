import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  addBranchCatalogItemToCart,
  getBranchCatalog,
  getCustomerAddresses,
  getMerchantDetail,
} from '../customer-api';
import { useI18n } from '../i18n';
import {
  ActionPill,
  FoodArtwork,
  PageIntro,
  ScreenFrame,
  SecondaryButton,
  SectionHeader,
  UiIcon,
  colors,
  screenStyles,
  withDesignFrame,
} from '../ui';

export function MerchantDetailScreen({
  merchantId,
  branchActionRenderer = null,
}) {
  const {
    formatCurrency,
    rowDirection,
    t,
    textAlign,
    tp,
    writingDirection,
  } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedAddressUuid, setSelectedAddressUuid] = useState();
  const [addFeedback, setAddFeedback] = useState();

  const { data: addresses = [] } = useQuery({
    queryKey: ['customer-addresses'],
    queryFn: getCustomerAddresses,
  });

  useEffect(() => {
    if (!selectedAddressUuid && addresses.length > 0) {
      setSelectedAddressUuid(
        addresses.find((address) => address.is_default)?.uuid ??
          addresses[0].uuid
      );
    }
  }, [addresses, selectedAddressUuid]);

  const { data: merchant } = useQuery({
    enabled: Boolean(merchantId),
    queryKey: ['customer-merchant-detail', merchantId, selectedAddressUuid],
    queryFn: () =>
      getMerchantDetail(merchantId, {
        address_uuid: selectedAddressUuid,
      }),
  });
  const leadBranch = useMemo(() => {
    return (
      merchant?.branches.find(
        (branch) => branch.serviceability?.is_serviceable
      ) ??
      merchant?.branches[0] ??
      null
    );
  }, [merchant]);
  const { data: catalogItems = [] } = useQuery({
    enabled: Boolean(leadBranch?.uuid),
    queryKey: ['customer-branch-catalog', leadBranch?.uuid],
    queryFn: () => getBranchCatalog(leadBranch.uuid),
  });
  const addToCartMutation = useMutation({
    mutationFn: (catalogItemUuid) =>
      addBranchCatalogItemToCart(leadBranch.uuid, catalogItemUuid),
    onSuccess: (_cart, catalogItemUuid) => {
      queryClient.invalidateQueries({ queryKey: ['customer-cart'] });
      const addedItem = catalogItems.find(
        (item) => item.uuid === catalogItemUuid
      );
      setAddFeedback(
        t('customer.merchant.addedToCart', {
          item: addedItem?.name ?? t('customer.merchant.menuTitle'),
        })
      );
    },
    onError: (error) => {
      setAddFeedback(error.message);
    },
  });
  const openLabel = merchant?.is_open_now
    ? t('customer.merchant.openNow')
    : t('customer.merchant.closedNow');

  return (
    <ScreenFrame
      activeTab="home"
      description={t('customer.merchant.screenDescription')}
      eyebrow={t('customer.merchant.screenEyebrow')}
      preserveHeaderText={false}
      showHeader={false}
      title={t('customer.merchant.screenTitle')}
    >
      <FoodArtwork
        badge={
          merchant?.is_open_now
            ? t('customer.merchant.openNow')
            : t('customer.merchant.discountBadge')
        }
        label={
          merchant ? merchant.name : t('customer.merchant.fallbackMerchant')
        }
        style={{ height: 186 }}
      />

      <View style={screenStyles.section}>
        <View style={[styles.merchantHeader, { flexDirection: rowDirection }]}>
          <View
            style={[
              styles.logo,
              {
                backgroundColor: merchant?.is_open_now
                  ? colors.primary
                  : '#f2e2b8',
              },
            ]}
          >
            <Text style={styles.logoText}>
              {(merchant?.name ?? 'T').slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <PageIntro
            description={leadBranch ? leadBranch.address_line : null}
            kicker={t('customer.merchant.pageKicker')}
            title={
              merchant ? merchant.name : t('customer.merchant.loadingTitle')
            }
          />
        </View>
        <View style={[screenStyles.row, { flexDirection: rowDirection }]}>
          <ActionPill
            label={openLabel}
            tone={merchant?.is_open_now ? 'success' : 'warning'}
          />
          <ActionPill label={t('customer.merchant.deliveryBadge')} />
          <ActionPill label={t('customer.merchant.freeDeliveryBadge')} />
        </View>
      </View>

      <View style={[screenStyles.buttonRow, { flexDirection: rowDirection }]}>
        <SecondaryButton active label={t('customer.merchant.delivery')} />
        <SecondaryButton label={t('customer.merchant.pickup')} />
      </View>

      <View style={screenStyles.section}>
        <SectionHeader title={t('customer.merchant.menuTitle')} />
        <View style={screenStyles.stacked}>
          {catalogItems.slice(0, 5).map((item) => (
            <MenuItemRow
              disabled={addToCartMutation.isPending}
              formatCurrency={formatCurrency}
              item={item}
              key={item.uuid ?? item.id}
              onAdd={() => addToCartMutation.mutate(item.uuid)}
              rowDirection={rowDirection}
              textAlign={textAlign}
              writingDirection={writingDirection}
            />
          ))}
        </View>
        {addFeedback ? (
          <Text
            style={[screenStyles.helperText, { textAlign, writingDirection }]}
          >
            {addFeedback}
          </Text>
        ) : null}
      </View>

      <View style={[screenStyles.buttonRow, { flexDirection: rowDirection }]}>
        <SecondaryButton
          label={t('customer.merchant.back')}
          onPress={() => router.push(withDesignFrame('/'))}
          testID="merchant-back"
        />
        {leadBranch && branchActionRenderer
          ? branchActionRenderer(leadBranch)
          : null}
      </View>

      <View style={styles.hiddenCompatibility}>
        <Text>{t('customer.merchant.chooseBranch')}</Text>
        {merchant?.branches.map((branch) => (
          <View key={branch.uuid}>
            <Text>{branch.name}</Text>
            <Text>
              {branch.serviceability?.is_serviceable
                ? t('customer.merchant.serviceableBranch')
                : t('customer.merchant.outOfRange')}
            </Text>
            {branch.serviceability?.estimated_duration_minutes ? (
              <Text>
                {branch.serviceability.maps_provider
                  ? t('customer.merchant.etaVia', {
                      minutes: branch.serviceability.estimated_duration_minutes,
                      provider: branch.serviceability.maps_provider,
                    })
                  : t('customer.merchant.eta', {
                      minutes: branch.serviceability.estimated_duration_minutes,
                    })}
              </Text>
            ) : null}
            <Text>
              {branch.serviceability
                ? t('customer.merchant.distanceFromAddress', {
                    distance: branch.serviceability.distance_meters,
                  })
                : t('customer.merchant.selectAddressForServiceability')}
            </Text>
          </View>
        ))}
        {merchant ? (
          <Text>
            {merchant.is_serviceable
              ? tp(
                  'customer.merchant.serviceableBranches',
                  merchant.serviceable_branch_count
                )
              : t('customer.merchant.notServiceable')}
          </Text>
        ) : null}
      </View>
    </ScreenFrame>
  );
}

function MenuItemRow({
  disabled,
  formatCurrency,
  item,
  onAdd,
  rowDirection,
  textAlign,
  writingDirection,
}) {
  return (
    <View style={[styles.menuItem, { flexDirection: rowDirection }]}>
      <View style={styles.menuItemCopy}>
        <Text
          numberOfLines={1}
          style={[styles.menuItemTitle, { textAlign, writingDirection }]}
        >
          {item.name}
        </Text>
        {item.description ? (
          <Text
            numberOfLines={2}
            style={[
              styles.menuItemDescription,
              { textAlign, writingDirection },
            ]}
          >
            {item.description}
          </Text>
        ) : null}
        <Text style={[styles.menuItemPrice, { textAlign, writingDirection }]}>
          {formatCurrency(item.priceMinor)}
        </Text>
      </View>
      <Pressable
        disabled={disabled}
        onPress={onAdd}
        style={[styles.addButton, disabled ? styles.addButtonDisabled : null]}
        testID={`merchant-add-to-cart-${item.id ?? item.uuid}`}
      >
        <UiIcon color={colors.ink} name="plus" size={24} />
      </Pressable>
    </View>
  );
}

const PlatformShadow = {
  elevation: 1,
  shadowColor: '#000000',
  shadowOffset: { height: 5, width: 0 },
  shadowOpacity: 0.04,
  shadowRadius: 14,
};

const styles = StyleSheet.create({
  merchantHeader: {
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    alignItems: 'center',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  logoText: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  menuItem: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...PlatformShadow,
  },
  menuItemCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  menuItemTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  menuItemDescription: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  menuItemPrice: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  hiddenCompatibility: {
    height: 0,
    opacity: 0,
    overflow: 'hidden',
  },
});
