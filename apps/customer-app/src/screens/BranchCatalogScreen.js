import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import {
  addBranchCatalogItemToCart,
  getBranchCatalog,
  getCartSummary,
} from '../customer-api';
import { useI18n } from '../i18n';
import {
  AccentButton,
  ActionPill,
  FoodArtwork,
  InfoCard,
  PriceSummaryRow,
  PromoBanner,
  ScreenFrame,
  SecondaryButton,
  SectionHeader,
  colors,
  screenStyles,
} from '../ui';

function defaultSelections(item) {
  return Object.fromEntries(
    (item.modifierGroups ?? []).map((group) => {
      const activeOptions = (group.options ?? []).filter(
        (option) => option.isActive
      );
      const defaults = activeOptions.filter((option) => option.isDefault);
      const fallback = defaults.length > 0 ? defaults : activeOptions;
      const maxSelected =
        group.maxSelected ??
        (group.selectionType === 'single' ? 1 : activeOptions.length);
      const minimumCount = Math.min(
        group.minSelected ?? 0,
        maxSelected ?? activeOptions.length
      );

      if (minimumCount <= 0) {
        return [
          group.uuid,
          defaults
            .map((option) => option.uuid)
            .slice(0, maxSelected ?? defaults.length),
        ];
      }

      return [
        group.uuid,
        fallback.slice(0, minimumCount).map((option) => option.uuid),
      ];
    })
  );
}

function selectedModifierSummary(item, selectedOptionsByGroup) {
  return (item.modifierGroups ?? []).flatMap((group) =>
    (group.options ?? [])
      .filter((option) =>
        (selectedOptionsByGroup[group.uuid] ?? []).includes(option.uuid)
      )
      .map((option) => `${group.name}: ${option.name}`)
  );
}

function optionSelectionCount(item, selectedOptionsByGroup) {
  return (item.modifierGroups ?? []).reduce(
    (sum, group) => sum + (selectedOptionsByGroup[group.uuid] ?? []).length,
    0
  );
}

export function BranchCatalogScreen({
  actions = null,
  branchId,
  highlightCatalogItemUuid = null,
  highlightOfferId = null,
}) {
  const { formatCurrency } = useI18n();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedOptionsByItem, setSelectedOptionsByItem] = useState({});
  const { data: items = [] } = useQuery({
    enabled: Boolean(branchId),
    queryKey: ['customer-branch-catalog', branchId],
    queryFn: () => getBranchCatalog(branchId),
  });
  const { data: cart } = useQuery({
    queryKey: ['customer-cart'],
    queryFn: getCartSummary,
  });
  const addToCartMutation = useMutation({
    mutationFn: ({ catalogItemUuid, modifierOptionUuids }) =>
      addBranchCatalogItemToCart(branchId, {
        catalog_item_uuid: catalogItemUuid,
        modifier_option_uuids: modifierOptionUuids,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-cart'] });
    },
  });

  useEffect(() => {
    setSelectedOptionsByItem((current) => {
      let changed = false;
      const nextState = {};

      for (const item of items) {
        const itemKey = item.uuid ?? item.id;
        const existingSelections = current[itemKey];

        if (existingSelections) {
          nextState[itemKey] = existingSelections;
          continue;
        }

        nextState[itemKey] = defaultSelections(item);
        changed = true;
      }

      if (!changed && Object.keys(current).length === items.length) {
        return current;
      }

      return nextState;
    });
  }, [items]);

  const groupedItems = useMemo(() => {
    return items.reduce((groups, item) => {
      const category = item.categoryName || 'Uncategorized';
      groups[category] = [...(groups[category] ?? []), item];
      return groups;
    }, {});
  }, [items]);
  const categoryNames = useMemo(
    () => ['all', ...Object.keys(groupedItems)],
    [groupedItems]
  );
  const visibleCategoryEntries = useMemo(() => {
    if (selectedCategory === 'all') {
      return Object.entries(groupedItems);
    }

    return Object.entries(groupedItems).filter(
      ([categoryName]) => categoryName === selectedCategory
    );
  }, [groupedItems, selectedCategory]);

  const highlightedItem = useMemo(() => {
    if (!highlightCatalogItemUuid) {
      return null;
    }

    return (
      items.find((item) => item.uuid === highlightCatalogItemUuid) ?? null
    );
  }, [highlightCatalogItemUuid, items]);

  useEffect(() => {
    if (highlightedItem?.categoryName) {
      setSelectedCategory(highlightedItem.categoryName);
    }
  }, [highlightedItem]);

  function toggleOption(item, group, optionUuid) {
    const itemKey = item.uuid ?? item.id;
    const currentSelections =
      selectedOptionsByItem[itemKey] ?? defaultSelections(item);
    const activeSelections = currentSelections[group.uuid] ?? [];

    setSelectedOptionsByItem((current) => {
      if (group.selectionType === 'single') {
        return {
          ...current,
          [itemKey]: {
            ...currentSelections,
            [group.uuid]: [optionUuid],
          },
        };
      }

      const nextSelections = activeSelections.includes(optionUuid)
        ? activeSelections.filter((entry) => entry !== optionUuid)
        : [...activeSelections, optionUuid].slice(
            0,
            group.maxSelected ?? undefined
          );

      return {
        ...current,
        [itemKey]: {
          ...currentSelections,
          [group.uuid]: nextSelections,
        },
      };
    });
  }

  return (
    <ScreenFrame
      activeTab="offers"
      description="Browse menu sections, customize modifiers, and keep a cart summary visible before checkout."
      eyebrow="Menu"
      title="Branch menu"
    >
      <PromoBanner
        description={
          highlightedItem
            ? `${highlightedItem.name} is selected from ${highlightOfferId ?? 'the current offer'}.`
            : 'Modifiers are priced before checkout so every cart line keeps a clear order snapshot.'
        }
        eyebrow={highlightedItem ? 'Offer selected' : 'Fast add'}
        title={
          highlightedItem
            ? 'Add the offer item to your cart'
            : 'Pick favorites, adjust options, then continue to cart'
        }
      />

      <View style={screenStyles.stacked}>
        <View style={screenStyles.section}>
          <SectionHeader title="Categories" />
          <View style={screenStyles.buttonRow}>
            {categoryNames.map((categoryName) => (
              <SecondaryButton
                active={selectedCategory === categoryName}
                key={categoryName}
                label={categoryName === 'all' ? 'All items' : categoryName}
                onPress={() => setSelectedCategory(categoryName)}
                testID={`catalog-category-${categoryName}`}
              />
            ))}
          </View>
        </View>

        {visibleCategoryEntries.map(([categoryName, categoryItems]) => (
          <View key={categoryName} style={screenStyles.section}>
            <SectionHeader title={categoryName} />
            <Text style={screenStyles.muted}>
              {categoryItems.length} item{categoryItems.length === 1 ? '' : 's'}{' '}
              in this menu section.
            </Text>
            <View style={screenStyles.stacked}>
              {categoryItems.map((item) => {
                const itemKey = item.uuid ?? item.id;
                const selections =
                  selectedOptionsByItem[itemKey] ?? defaultSelections(item);
                const selectedSummary = selectedModifierSummary(
                  item,
                  selections
                );
                const isHighlighted = item.uuid === highlightCatalogItemUuid;

                return (
                  <InfoCard
                    accent={isHighlighted ? colors.rose : colors.primaryDeep}
                    description={item.description}
                    eyebrow={
                      isHighlighted
                        ? 'Selected offer item'
                        : (item.categoryName ?? 'Catalog item')
                    }
                    key={itemKey}
                    title={item.name}
                  >
                    <FoodArtwork
                      badge={isHighlighted ? 'Offer' : '30% off'}
                      label={item.name}
                      style={{ height: 138 }}
                    />
                    <PriceSummaryRow
                      label="Item price"
                      strong
                      value={formatCurrency(item.priceMinor)}
                    />
                    <View style={screenStyles.row}>
                      <ActionPill
                        label={`${optionSelectionCount(item, selections)} modifier selection${
                          optionSelectionCount(item, selections) === 1
                            ? ''
                            : 's'
                        } active`}
                      />
                      {isHighlighted ? (
                        <ActionPill label="Offer item" tone="warning" />
                      ) : null}
                    </View>

                    {(item.modifierGroups ?? []).map((group) => (
                      <View key={group.uuid} style={screenStyles.stacked}>
                        <Text style={screenStyles.helperText}>
                          {group.name} -{' '}
                          {group.selectionType === 'single'
                            ? 'pick one'
                            : `pick up to ${group.maxSelected ?? 'many'}`}
                        </Text>
                        <View style={screenStyles.buttonRow}>
                          {group.options.map((option) => {
                            const selected = (
                              selections[group.uuid] ?? []
                            ).includes(option.uuid);
                            const priceLabel =
                              option.priceDeltaMinor > 0
                                ? ` (+${formatCurrency(option.priceDeltaMinor)})`
                                : '';

                            return (
                              <SecondaryButton
                                active={selected}
                                key={option.uuid}
                                label={`${option.name}${priceLabel}`}
                                onPress={() =>
                                  toggleOption(item, group, option.uuid)
                                }
                              />
                            );
                          })}
                        </View>
                      </View>
                    ))}

                    {selectedSummary.length > 0 ? (
                      <Text style={screenStyles.muted}>
                        {selectedSummary.join(' - ')}
                      </Text>
                    ) : null}

                    <View style={screenStyles.buttonRow}>
                      <AccentButton
                        label="Add to cart"
                        onPress={() =>
                          addToCartMutation.mutate({
                            catalogItemUuid: item.uuid,
                            modifierOptionUuids:
                              Object.values(selections).flat(),
                          })
                        }
                        testID={`add-to-cart-${item.id ?? item.uuid}`}
                      />
                    </View>
                  </InfoCard>
                );
              })}
            </View>
          </View>
        ))}

        {items.length === 0 ? (
          <InfoCard
            accent={colors.primaryDeep}
            description="This branch does not have seeded demo items yet."
            eyebrow="No items"
            title="Catalog preview unavailable"
          />
        ) : null}

        {cart ? (
          <InfoCard
            accent={colors.green}
            description="Modifier selections stay attached to each cart line."
            eyebrow="Current cart"
            title={`${cart.itemCount} cart item${cart.itemCount === 1 ? '' : 's'}`}
          >
            <PriceSummaryRow
              label="Subtotal"
              value={formatCurrency(cart.subtotalMinor)}
            />
            <PriceSummaryRow
              label="Delivery"
              value={formatCurrency(cart.deliveryFeeMinor)}
            />
            {cart.discountMinor ? (
              <PriceSummaryRow
                label="Offer discounts"
                value={`-${formatCurrency(cart.discountMinor)}`}
              />
            ) : null}
            <PriceSummaryRow
              label="Total"
              strong
              value={formatCurrency(cart.totalMinor)}
            />
          </InfoCard>
        ) : null}

        {actions ? (
          <View style={screenStyles.buttonRow}>{actions}</View>
        ) : (
          <SecondaryButton label="Open cart" />
        )}
      </View>
    </ScreenFrame>
  );
}
