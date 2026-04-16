import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { addBranchCatalogItemToCart, getBranchCatalog, getCartSummary } from '../customer-api';
import { AccentButton, InfoCard, ScreenFrame, SecondaryButton, screenStyles } from '../ui';

function defaultSelections(item) {
  return Object.fromEntries(
    (item.modifierGroups ?? []).map((group) => {
      const activeOptions = (group.options ?? []).filter((option) => option.isActive);
      const defaults = activeOptions.filter((option) => option.isDefault);
      const fallback = defaults.length > 0 ? defaults : activeOptions;
      const maxSelected =
        group.maxSelected ?? (group.selectionType === 'single' ? 1 : activeOptions.length);
      const minimumCount = Math.min(group.minSelected ?? 0, maxSelected ?? activeOptions.length);

      if (minimumCount <= 0) {
        return [group.uuid, defaults.map((option) => option.uuid).slice(0, maxSelected ?? defaults.length)];
      }

      return [group.uuid, fallback.slice(0, minimumCount).map((option) => option.uuid)];
    })
  );
}

function selectedModifierSummary(item, selectedOptionsByGroup) {
  return (item.modifierGroups ?? []).flatMap((group) =>
    (group.options ?? [])
      .filter((option) => (selectedOptionsByGroup[group.uuid] ?? []).includes(option.uuid))
      .map((option) => `${group.name}: ${option.name}`)
  );
}

function optionSelectionCount(item, selectedOptionsByGroup) {
  return (item.modifierGroups ?? []).reduce(
    (sum, group) => sum + (selectedOptionsByGroup[group.uuid] ?? []).length,
    0
  );
}

export function BranchCatalogScreen({ branchId, actions = null }) {
  const queryClient = useQueryClient();
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

  function toggleOption(item, group, optionUuid) {
    const itemKey = item.uuid ?? item.id;
    const currentSelections = selectedOptionsByItem[itemKey] ?? defaultSelections(item);
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
        : [...activeSelections, optionUuid].slice(0, group.maxSelected ?? undefined);

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
      description="Branch catalog now carries categories, image references, and item-level modifiers so the customer path can keep add-on pricing explicit before checkout."
      eyebrow="Branch catalog"
      title="Branch-ready catalog preview"
    >
      <View style={screenStyles.stacked}>
        {Object.entries(groupedItems).map(([categoryName, categoryItems]) => (
          <InfoCard
            accent="#112134"
            description={`${categoryItems.length} item${categoryItems.length === 1 ? '' : 's'} in this branch category.`}
            eyebrow="Catalog category"
            key={categoryName}
            title={categoryName}
          >
            <View style={screenStyles.stacked}>
              {categoryItems.map((item) => {
                const itemKey = item.uuid ?? item.id;
                const selections = selectedOptionsByItem[itemKey] ?? defaultSelections(item);
                const selectedSummary = selectedModifierSummary(item, selections);

                return (
                  <InfoCard
                    accent="#ff8c42"
                    description={item.description}
                    eyebrow="Catalog item"
                    key={itemKey}
                    title={item.name}
                  >
                    {item.imageUrl ? (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={{ borderRadius: 18, height: 144, width: '100%' }}
                      />
                    ) : null}
                    <Text style={screenStyles.statValue}>{(item.priceMinor / 100).toFixed(2)} SAR</Text>
                    <Text style={screenStyles.muted}>
                      {optionSelectionCount(item, selections)} modifier selection
                      {optionSelectionCount(item, selections) === 1 ? '' : 's'} active
                    </Text>

                    {(item.modifierGroups ?? []).map((group) => (
                      <View key={group.uuid} style={screenStyles.stacked}>
                        <Text style={screenStyles.helperText}>
                          {group.name} - {group.selectionType === 'single' ? 'pick one' : `pick up to ${group.maxSelected ?? 'many'}`}
                        </Text>
                        <View style={screenStyles.buttonRow}>
                          {group.options.map((option) => {
                            const selected = (selections[group.uuid] ?? []).includes(option.uuid);
                            const priceLabel =
                              option.priceDeltaMinor > 0
                                ? ` (+${(option.priceDeltaMinor / 100).toFixed(2)} SAR)`
                                : '';

                            return (
                              <SecondaryButton
                                key={option.uuid}
                                label={`${selected ? 'Selected: ' : ''}${option.name}${priceLabel}`}
                                onPress={() => toggleOption(item, group, option.uuid)}
                              />
                            );
                          })}
                        </View>
                      </View>
                    ))}

                    {selectedSummary.length > 0 ? (
                      <Text style={screenStyles.muted}>{selectedSummary.join(' • ')}</Text>
                    ) : null}

                    <View style={screenStyles.buttonRow}>
                      <AccentButton
                        label="Add to cart"
                        onPress={() =>
                          addToCartMutation.mutate({
                            catalogItemUuid: item.uuid,
                            modifierOptionUuids: Object.values(selections).flat(),
                          })
                        }
                        testID={`add-to-cart-${item.id ?? item.uuid}`}
                      />
                    </View>
                  </InfoCard>
                );
              })}
            </View>
          </InfoCard>
        ))}

        {items.length === 0 ? (
          <InfoCard
            accent="#d9b675"
            description="This branch does not have seeded demo items yet."
            eyebrow="No items"
            title="Catalog preview unavailable"
          />
        ) : null}

        {cart ? (
          <InfoCard
            accent="#26a69a"
            description="The cart now preserves modifier selections so checkout can send an explicit priced line snapshot."
            eyebrow="Current cart"
            title={`${cart.itemCount} cart item${cart.itemCount === 1 ? '' : 's'}`}
          >
            <Text style={screenStyles.muted}>
              {cart.totalMinor > 0
                ? `${(cart.totalMinor / 100).toFixed(2)} SAR total`
                : 'Cart is empty.'}
            </Text>
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
