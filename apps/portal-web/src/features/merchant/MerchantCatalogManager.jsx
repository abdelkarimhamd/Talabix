import React, { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { startTransition, useDeferredValue, useState } from 'react';
import { useSession } from '../../use-session.js';

const emptyCreateForm = {
  name: '',
  category_name: '',
  sku: '',
  description: '',
  image_url: '',
  base_price_minor: '',
  base_stock: '',
  is_active: true,
};

function createEmptyModifierOption(isDefault = false, sortOrder = 0) {
  return {
    uuid: undefined,
    name: '',
    description: '',
    price_delta_minor: '0',
    is_default: isDefault,
    is_active: true,
    sort_order: sortOrder,
  };
}

const emptyModifierGroupForm = {
  name: '',
  description: '',
  selection_type: 'single',
  min_selected: '0',
  max_selected: '1',
  is_active: true,
  sort_order: '0',
  options: [createEmptyModifierOption(true, 0)],
};

function formatMoney(minor) {
  return `${(minor / 100).toFixed(2)} SAR`;
}

function textValue(value) {
  return value ?? '';
}

function numberDraft(value) {
  return value === null || value === undefined ? '' : String(value);
}

function itemDraft(item) {
  if (!item) {
    return {
      name: '',
      category_name: '',
      sku: '',
      description: '',
      image_url: '',
      base_price_minor: '',
      base_stock: '',
      is_active: true,
    };
  }

  return {
    name: item.name ?? '',
    category_name: textValue(item.category_name),
    sku: textValue(item.sku),
    description: textValue(item.description),
    image_url: textValue(item.image_url),
    base_price_minor: numberDraft(item.base_price_minor),
    base_stock: numberDraft(item.base_stock),
    is_active: item.is_active,
  };
}

function modifierGroupDraft(group) {
  if (!group) {
    return {
      ...emptyModifierGroupForm,
      options: emptyModifierGroupForm.options.map((option) => ({ ...option })),
    };
  }

  return {
    name: group.name ?? '',
    description: textValue(group.description),
    selection_type: group.selection_type ?? 'single',
    min_selected: numberDraft(group.min_selected ?? 0),
    max_selected: numberDraft(group.max_selected),
    is_active: group.is_active ?? true,
    sort_order: numberDraft(group.sort_order ?? 0),
    options: (group.options ?? []).map((option, index) => ({
      uuid: option.uuid,
      name: option.name ?? '',
      description: textValue(option.description),
      price_delta_minor: numberDraft(option.price_delta_minor ?? 0),
      is_default: option.is_default ?? false,
      is_active: option.is_active ?? true,
      sort_order: numberDraft(option.sort_order ?? index),
    })),
  };
}

function modifierGroupDrafts(item) {
  return Object.fromEntries(
    (item?.modifier_groups ?? []).map((group) => [group.uuid, modifierGroupDraft(group)])
  );
}

function overrideDrafts(item, branches = []) {
  return Object.fromEntries(
    branches.map((branch) => {
      const currentOverride = item?.branch_overrides.find(
        (entry) => entry.branch_uuid === branch.uuid
      );

      return [
        branch.uuid,
        {
          price_minor: numberDraft(currentOverride?.price_minor),
          stock_quantity: numberDraft(currentOverride?.stock_quantity),
          is_available: currentOverride?.is_available ?? item?.is_active ?? true,
        },
      ];
    })
  );
}

function parseNullableInteger(value) {
  const trimmedValue = String(value ?? '').trim();

  if (trimmedValue.length === 0) {
    return null;
  }

  return Number.parseInt(trimmedValue, 10);
}

function errorMessage(error) {
  return error?.issues?.[0]?.message ?? error?.message ?? 'Catalog action could not be completed.';
}

export function MerchantCatalogManager() {
  const { api, session } = useSession();
  const queryClient = useQueryClient();
  const [selectedMerchantUuid, setSelectedMerchantUuid] = useState();
  const [selectedItemUuid, setSelectedItemUuid] = useState();
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editForm, setEditForm] = useState(itemDraft());
  const [createGroupForm, setCreateGroupForm] = useState(modifierGroupDraft());
  const [modifierGroupForms, setModifierGroupForms] = useState({});
  const [overrideFormState, setOverrideFormState] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const canWrite = session.permissions.includes('merchant:catalog.write');

  const managedMerchantsQuery = useQuery({
    queryKey: ['managed-merchants'],
    queryFn: () => api.listManagedMerchants(),
  });

  const catalogItemsQuery = useQuery({
    queryKey: ['merchant-catalog-items', selectedMerchantUuid],
    enabled: Boolean(selectedMerchantUuid),
    queryFn: () => api.listCatalogItems({ merchant_uuid: selectedMerchantUuid }),
  });

  const createCatalogItemMutation = useMutation({
    mutationFn: (payload) => api.createCatalogItem(payload),
    onSuccess: async (item) => {
      setFeedback(`${item.name} created in the shared merchant catalog.`);
      setCreateForm(emptyCreateForm);
      setSelectedItemUuid(item.uuid);
      await queryClient.invalidateQueries({
        queryKey: ['merchant-catalog-items', selectedMerchantUuid],
      });
    },
    onError: (error) => {
      setFeedback(errorMessage(error));
    },
  });

  const updateCatalogItemMutation = useMutation({
    mutationFn: ({ catalogItemUuid, payload }) => api.updateCatalogItem(catalogItemUuid, payload),
    onSuccess: async (item) => {
      setFeedback(`${item.name} base item updated.`);
      await queryClient.invalidateQueries({
        queryKey: ['merchant-catalog-items', selectedMerchantUuid],
      });
    },
    onError: (error) => {
      setFeedback(errorMessage(error));
    },
  });

  const branchOverrideMutation = useMutation({
    mutationFn: ({ branchUuid, catalogItemUuid, payload }) =>
      api.upsertBranchOverride(branchUuid, catalogItemUuid, payload),
    onSuccess: async (result) => {
      setFeedback(`${result.override.branch_name} override saved.`);
      await queryClient.invalidateQueries({
        queryKey: ['merchant-catalog-items', selectedMerchantUuid],
      });
    },
    onError: (error) => {
      setFeedback(errorMessage(error));
    },
  });

  const createModifierGroupMutation = useMutation({
    mutationFn: ({ catalogItemUuid, payload }) => api.createModifierGroup(catalogItemUuid, payload),
    onSuccess: async (group) => {
      setFeedback(`${group.name} modifier group added.`);
      setCreateGroupForm(modifierGroupDraft());
      await queryClient.invalidateQueries({
        queryKey: ['merchant-catalog-items', selectedMerchantUuid],
      });
    },
    onError: (error) => {
      setFeedback(errorMessage(error));
    },
  });

  const updateModifierGroupMutation = useMutation({
    mutationFn: ({ catalogItemUuid, modifierGroupUuid, payload }) =>
      api.updateModifierGroup(catalogItemUuid, modifierGroupUuid, payload),
    onSuccess: async (group) => {
      setFeedback(`${group.name} modifier group updated.`);
      await queryClient.invalidateQueries({
        queryKey: ['merchant-catalog-items', selectedMerchantUuid],
      });
    },
    onError: (error) => {
      setFeedback(errorMessage(error));
    },
  });

  useEffect(() => {
    if (!selectedMerchantUuid && managedMerchantsQuery.data?.length) {
      setSelectedMerchantUuid(managedMerchantsQuery.data[0].uuid);
    }
  }, [managedMerchantsQuery.data, selectedMerchantUuid]);

  const selectedMerchant =
    managedMerchantsQuery.data?.find((merchant) => merchant.uuid === selectedMerchantUuid) ?? null;
  const allCatalogItems = catalogItemsQuery.data ?? [];
  const filteredCatalogItems = allCatalogItems.filter((item) => {
    const term = deferredSearchTerm.trim().toLowerCase();

    if (term.length === 0) {
      return true;
    }

    return [item.name, item.sku ?? '', item.category_name ?? ''].some((value) =>
      value.toLowerCase().includes(term)
    );
  });
  const selectedItem =
    allCatalogItems.find((item) => item.uuid === selectedItemUuid) ??
    filteredCatalogItems[0] ??
    allCatalogItems[0] ??
    null;

  useEffect(() => {
    if (!selectedItemUuid && filteredCatalogItems.length > 0) {
      setSelectedItemUuid(filteredCatalogItems[0].uuid);
    }
  }, [filteredCatalogItems, selectedItemUuid]);

  useEffect(() => {
    setEditForm(itemDraft(selectedItem));
    setOverrideFormState(overrideDrafts(selectedItem, selectedMerchant?.branches ?? []));
    setModifierGroupForms(modifierGroupDrafts(selectedItem));
    setCreateGroupForm(modifierGroupDraft());
  }, [selectedItem, selectedMerchant]);

  function parseModifierGroupPayload(draft) {
    return {
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      selection_type: draft.selection_type,
      min_selected: Number.parseInt(draft.min_selected || '0', 10),
      max_selected: parseNullableInteger(draft.max_selected),
      is_active: draft.is_active,
      sort_order: Number.parseInt(draft.sort_order || '0', 10),
      options: draft.options.map((option, index) => ({
        ...(option.uuid ? { uuid: option.uuid } : {}),
        name: option.name.trim(),
        description: option.description.trim() || null,
        price_delta_minor: Number.parseInt(option.price_delta_minor || '0', 10),
        is_default: option.is_default,
        is_active: option.is_active,
        sort_order: Number.parseInt(option.sort_order || String(index), 10),
      })),
    };
  }

  function handleCreateSubmit(event) {
    event.preventDefault();
    setFeedback('');

    createCatalogItemMutation.mutate({
      merchant_uuid: selectedMerchantUuid,
      name: createForm.name.trim(),
      category_name: createForm.category_name.trim() || null,
      sku: createForm.sku.trim() || null,
      description: createForm.description.trim() || null,
      image_url: createForm.image_url.trim() || null,
      base_price_minor: Number.parseInt(createForm.base_price_minor, 10),
      base_stock: parseNullableInteger(createForm.base_stock),
      is_active: createForm.is_active,
    });
  }

  function handleBaseItemSubmit(event) {
    event.preventDefault();

    if (!selectedItem) {
      return;
    }

    setFeedback('');
    updateCatalogItemMutation.mutate({
      catalogItemUuid: selectedItem.uuid,
      payload: {
        merchant_uuid: selectedMerchantUuid,
        name: editForm.name.trim(),
        category_name: editForm.category_name.trim() || null,
        sku: editForm.sku.trim() || null,
        description: editForm.description.trim() || null,
        image_url: editForm.image_url.trim() || null,
        base_price_minor: Number.parseInt(editForm.base_price_minor, 10),
        base_stock: parseNullableInteger(editForm.base_stock),
        is_active: editForm.is_active,
      },
    });
  }

  function handleCreateModifierGroupSubmit(event) {
    event.preventDefault();

    if (!selectedItem) {
      return;
    }

    setFeedback('');
    createModifierGroupMutation.mutate({
      catalogItemUuid: selectedItem.uuid,
      payload: parseModifierGroupPayload(createGroupForm),
    });
  }

  function handleSaveModifierGroup(groupUuid) {
    if (!selectedItem) {
      return;
    }

    setFeedback('');
    updateModifierGroupMutation.mutate({
      catalogItemUuid: selectedItem.uuid,
      modifierGroupUuid: groupUuid,
      payload: parseModifierGroupPayload(modifierGroupForms[groupUuid]),
    });
  }

  function updateGroupDraft(groupUuid, updater) {
    setModifierGroupForms((current) => ({
      ...current,
      [groupUuid]: updater(current[groupUuid]),
    }));
  }

  function appendGroupOption(groupUuid) {
    updateGroupDraft(groupUuid, (current) => ({
      ...current,
      options: [
        ...current.options,
        createEmptyModifierOption(false, current.options.length),
      ],
    }));
  }

  function appendCreateGroupOption() {
    setCreateGroupForm((current) => ({
      ...current,
      options: [...current.options, createEmptyModifierOption(false, current.options.length)],
    }));
  }

  function handleOverrideSubmit(branchUuid) {
    if (!selectedItem) {
      return;
    }

    const draft = overrideFormState[branchUuid];
    setFeedback('');
    branchOverrideMutation.mutate({
      branchUuid,
      catalogItemUuid: selectedItem.uuid,
      payload: {
        price_minor: parseNullableInteger(draft?.price_minor),
        stock_quantity: parseNullableInteger(draft?.stock_quantity),
        is_available: draft?.is_available ?? selectedItem.is_active,
      },
    });
  }

  if (managedMerchantsQuery.isLoading) {
    return (
      <section className="board panel">
        <div className="empty-state">
          <h2>Loading merchant catalog scope</h2>
          <p>Pulling merchant memberships and shared menu items into the portal.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="board panel">
      <div className="board-header">
        <div>
          <span className="eyebrow">Merchant catalog</span>
          <h2>Merchant-owned menu with branch overrides</h2>
        </div>
        <span className="status-pill" data-tone="success">
          {allCatalogItems.length} shared items
        </span>
      </div>

      <div className="toolbar">
        <select
          aria-label="Select managed merchant"
          onChange={(event) =>
            startTransition(() => {
              setSelectedMerchantUuid(event.target.value);
              setSelectedItemUuid(undefined);
            })
          }
          value={selectedMerchantUuid ?? ''}
        >
          {(managedMerchantsQuery.data ?? []).map((merchant) => (
            <option key={merchant.uuid} value={merchant.uuid}>
              {merchant.name}
            </option>
          ))}
        </select>
        <input
          aria-label="Search catalog items"
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by item name or SKU"
          type="search"
          value={searchTerm}
        />
        <button onClick={() => catalogItemsQuery.refetch()} type="button">
          {catalogItemsQuery.isFetching ? 'Refreshing...' : 'Refresh catalog'}
        </button>
      </div>

      <div className="insight-strip">
        <div className="panel">
          <span className="eyebrow">Shared source</span>
          <strong>One merchant menu</strong>
          <p>Base price, stock, and active state stay centralized so branch teams work from one canonical item.</p>
        </div>
        <div className="panel">
          <span className="eyebrow">Branch tuning</span>
          <strong>Override only where needed</strong>
          <p>Each branch can tune price, stock, and availability without duplicating the merchant menu structure.</p>
        </div>
      </div>

      {feedback ? <div className="inline-feedback">{feedback}</div> : null}

      <div className="catalog-layout">
        <aside className="catalog-sidebar">
          <section className="panel catalog-panel">
            <div className="lane-header">
              <div>
                <span className="eyebrow">Catalog items</span>
                <h3>{filteredCatalogItems.length} visible items</h3>
              </div>
              {selectedMerchant ? <p>{selectedMerchant.branches.length} branches in scope</p> : null}
            </div>

            {filteredCatalogItems.length === 0 ? (
              <div className="lane-empty">No catalog items match the current merchant or search term.</div>
            ) : (
              <div className="catalog-list">
                {filteredCatalogItems.map((item) => (
                  <article
                    className={`board-card${selectedItem?.uuid === item.uuid ? ' selected' : ''}`}
                    data-testid={`catalog-item-${item.uuid}`}
                    key={item.uuid}
                  >
                    <header>
                      <div>
                        <span className="eyebrow">Base item</span>
                        <h3>{item.name}</h3>
                      </div>
                      <span
                        className="status-pill"
                        data-tone={item.is_active ? 'success' : 'muted'}
                      >
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </header>

                    <div className="board-meta">
                      <span>{item.sku || 'No SKU'}</span>
                      <span>{item.branch_overrides.length} override{item.branch_overrides.length === 1 ? '' : 's'}</span>
                    </div>

                    <dl>
                      <div>
                        <dt>Base price</dt>
                        <dd>{formatMoney(item.base_price_minor)}</dd>
                      </div>
                      <div>
                        <dt>Base stock</dt>
                        <dd>{item.base_stock ?? 'Untracked'}</dd>
                      </div>
                    </dl>

                    {item.description ? <p className="board-note">{item.description}</p> : null}

                    <footer className="card-actions">
                      <button
                        className="action-button secondary"
                        onClick={() => setSelectedItemUuid(item.uuid)}
                        type="button"
                      >
                        Edit item
                      </button>
                    </footer>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="panel catalog-panel">
            <div className="lane-header">
              <div>
                <span className="eyebrow">Create item</span>
                <h3>Add to the shared merchant menu</h3>
              </div>
              <p>Every new item starts at the merchant level, then branches opt into overrides.</p>
            </div>

            {canWrite ? (
              <form className="catalog-form" onSubmit={handleCreateSubmit}>
                <div className="field-grid">
                  <label className="field-stack">
                    <span>New catalog item name</span>
                    <input
                      onChange={(event) =>
                        setCreateForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      required
                      type="text"
                      value={createForm.name}
                    />
                  </label>
                  <label className="field-stack">
                    <span>New catalog category</span>
                    <input
                      onChange={(event) =>
                        setCreateForm((current) => ({
                          ...current,
                          category_name: event.target.value,
                        }))
                      }
                      type="text"
                      value={createForm.category_name}
                    />
                  </label>
                  <label className="field-stack">
                    <span>New catalog item SKU</span>
                    <input
                      onChange={(event) =>
                        setCreateForm((current) => ({
                          ...current,
                          sku: event.target.value,
                        }))
                      }
                      type="text"
                      value={createForm.sku}
                    />
                  </label>
                  <label className="field-stack">
                    <span>New catalog base price</span>
                    <input
                      inputMode="numeric"
                      min="0"
                      onChange={(event) =>
                        setCreateForm((current) => ({
                          ...current,
                          base_price_minor: event.target.value,
                        }))
                      }
                      required
                      type="number"
                      value={createForm.base_price_minor}
                    />
                  </label>
                  <label className="field-stack">
                    <span>New catalog base stock</span>
                    <input
                      inputMode="numeric"
                      min="0"
                      onChange={(event) =>
                        setCreateForm((current) => ({
                          ...current,
                          base_stock: event.target.value,
                        }))
                      }
                      type="number"
                      value={createForm.base_stock}
                    />
                  </label>
                </div>

                <label className="field-stack">
                  <span>New catalog image URL</span>
                  <input
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        image_url: event.target.value,
                      }))
                    }
                    placeholder="https://images.example.com/menu/item.jpg"
                    type="url"
                    value={createForm.image_url}
                  />
                </label>

                <label className="field-stack">
                  <span>New catalog item description</span>
                  <textarea
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    rows={3}
                    value={createForm.description}
                  />
                </label>

                <label className="checkbox-row">
                  <input
                    checked={createForm.is_active}
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        is_active: event.target.checked,
                      }))
                    }
                    type="checkbox"
                  />
                  <span>New catalog item active</span>
                </label>

                <button
                  className="action-button"
                  disabled={createCatalogItemMutation.isPending || !selectedMerchantUuid}
                  type="submit"
                >
                  {createCatalogItemMutation.isPending ? 'Creating...' : 'Create catalog item'}
                </button>
              </form>
            ) : (
              <div className="lane-empty">This session can review catalog data but cannot create new base items.</div>
            )}
          </section>
        </aside>

        <section className="panel catalog-panel catalog-detail">
          <div className="lane-header">
            <div>
              <span className="eyebrow">Selected item</span>
              <h3>{selectedItem ? selectedItem.name : 'Choose a catalog item'}</h3>
            </div>
            {selectedItem ? (
              <span className="status-pill" data-tone={selectedItem.is_active ? 'success' : 'muted'}>
                {selectedItem.is_active ? 'Active base item' : 'Inactive base item'}
              </span>
            ) : null}
          </div>

          {selectedItem ? (
            <>
              <div className="catalog-summary">
                <div className="summary-pairs">
                  <div>
                    <span className="eyebrow">Base price</span>
                    <strong>{formatMoney(selectedItem.base_price_minor)}</strong>
                  </div>
                  <div>
                    <span className="eyebrow">Category</span>
                    <strong>{selectedItem.category_name || 'Uncategorized'}</strong>
                  </div>
                  <div>
                    <span className="eyebrow">Base stock</span>
                    <strong>{selectedItem.base_stock ?? 'Untracked'}</strong>
                  </div>
                  <div>
                    <span className="eyebrow">SKU</span>
                    <strong>{selectedItem.sku || 'Unset'}</strong>
                  </div>
                  <div>
                    <span className="eyebrow">Modifiers</span>
                    <strong>{selectedItem.modifier_groups.length}</strong>
                  </div>
                  <div>
                    <span className="eyebrow">Branch overrides</span>
                    <strong>{selectedItem.branch_overrides.length}</strong>
                  </div>
                </div>
                {selectedItem.image_url ? (
                  <p className="board-note">
                    <strong>Image URL:</strong> {selectedItem.image_url}
                  </p>
                ) : null}
              </div>

              {canWrite ? (
                <form className="catalog-form" onSubmit={handleBaseItemSubmit}>
                  <div className="field-grid">
                    <label className="field-stack">
                      <span>Catalog item name</span>
                      <input
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        required
                        type="text"
                        value={editForm.name}
                      />
                    </label>
                    <label className="field-stack">
                      <span>Catalog category</span>
                      <input
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            category_name: event.target.value,
                          }))
                        }
                        type="text"
                        value={editForm.category_name}
                      />
                    </label>
                    <label className="field-stack">
                      <span>Catalog item SKU</span>
                      <input
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            sku: event.target.value,
                          }))
                        }
                        type="text"
                        value={editForm.sku}
                      />
                    </label>
                    <label className="field-stack">
                      <span>Catalog base price</span>
                      <input
                        inputMode="numeric"
                        min="0"
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            base_price_minor: event.target.value,
                          }))
                        }
                        required
                        type="number"
                        value={editForm.base_price_minor}
                      />
                    </label>
                    <label className="field-stack">
                      <span>Catalog base stock</span>
                      <input
                        inputMode="numeric"
                        min="0"
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            base_stock: event.target.value,
                          }))
                        }
                        type="number"
                        value={editForm.base_stock}
                      />
                    </label>
                  </div>

                  <label className="field-stack">
                    <span>Catalog image URL</span>
                    <input
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          image_url: event.target.value,
                        }))
                      }
                      placeholder="https://images.example.com/menu/item.jpg"
                      type="url"
                      value={editForm.image_url}
                    />
                  </label>

                  <label className="field-stack">
                    <span>Catalog item description</span>
                    <textarea
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      rows={4}
                      value={editForm.description}
                    />
                  </label>

                  <label className="checkbox-row">
                    <input
                      checked={editForm.is_active}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          is_active: event.target.checked,
                        }))
                      }
                      type="checkbox"
                    />
                    <span>Catalog item active</span>
                  </label>

                  <button
                    className="action-button"
                    disabled={updateCatalogItemMutation.isPending}
                    type="submit"
                  >
                    {updateCatalogItemMutation.isPending ? 'Saving...' : 'Save base item'}
                  </button>
                </form>
              ) : (
                <div className="lane-empty">This session can inspect the base item but cannot edit merchant catalog data.</div>
              )}

              <div className="lane-header">
                <div>
                  <span className="eyebrow">Modifier groups</span>
                  <h3>Set option groups and add-on pricing for this item</h3>
                </div>
                <p>Modifier groups stay item-specific in v1 so checkout validation and pricing remain explicit.</p>
              </div>

              {canWrite ? (
                <section className="catalog-panel modifier-section">
                  <form className="catalog-form" onSubmit={handleCreateModifierGroupSubmit}>
                    <div className="field-grid">
                      <label className="field-stack">
                        <span>New modifier group name</span>
                        <input
                          onChange={(event) =>
                            setCreateGroupForm((current) => ({
                              ...current,
                              name: event.target.value,
                            }))
                          }
                          required
                          type="text"
                          value={createGroupForm.name}
                        />
                      </label>
                      <label className="field-stack">
                        <span>Selection type</span>
                        <select
                          onChange={(event) =>
                            setCreateGroupForm((current) => ({
                              ...current,
                              selection_type: event.target.value,
                              max_selected:
                                event.target.value === 'single'
                                  ? '1'
                                  : current.max_selected,
                            }))
                          }
                          value={createGroupForm.selection_type}
                        >
                          <option value="single">Single</option>
                          <option value="multiple">Multiple</option>
                        </select>
                      </label>
                      <label className="field-stack">
                        <span>Minimum selected</span>
                        <input
                          inputMode="numeric"
                          min="0"
                          onChange={(event) =>
                            setCreateGroupForm((current) => ({
                              ...current,
                              min_selected: event.target.value,
                            }))
                          }
                          type="number"
                          value={createGroupForm.min_selected}
                        />
                      </label>
                      <label className="field-stack">
                        <span>Maximum selected</span>
                        <input
                          inputMode="numeric"
                          min="1"
                          onChange={(event) =>
                            setCreateGroupForm((current) => ({
                              ...current,
                              max_selected: event.target.value,
                            }))
                          }
                          type="number"
                          value={createGroupForm.max_selected}
                        />
                      </label>
                    </div>

                    <label className="field-stack">
                      <span>New modifier group description</span>
                      <textarea
                        onChange={(event) =>
                          setCreateGroupForm((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                        rows={2}
                        value={createGroupForm.description}
                      />
                    </label>

                    <div className="catalog-modifier-list">
                      {createGroupForm.options.map((option, index) => (
                        <article className="catalog-modifier-card" key={option.uuid ?? `new-${index}`}>
                          <div className="field-grid">
                            <label className="field-stack">
                              <span>Option name</span>
                              <input
                                onChange={(event) =>
                                  setCreateGroupForm((current) => ({
                                    ...current,
                                    options: current.options.map((entry, optionIndex) =>
                                      optionIndex === index
                                        ? { ...entry, name: event.target.value }
                                        : entry
                                    ),
                                  }))
                                }
                                required
                                type="text"
                                value={option.name}
                              />
                            </label>
                            <label className="field-stack">
                              <span>Price delta</span>
                              <input
                                inputMode="numeric"
                                min="0"
                                onChange={(event) =>
                                  setCreateGroupForm((current) => ({
                                    ...current,
                                    options: current.options.map((entry, optionIndex) =>
                                      optionIndex === index
                                        ? { ...entry, price_delta_minor: event.target.value }
                                        : entry
                                    ),
                                  }))
                                }
                                required
                                type="number"
                                value={option.price_delta_minor}
                              />
                            </label>
                          </div>
                          <div className="field-grid">
                            <label className="field-stack">
                              <span>Option description</span>
                              <input
                                onChange={(event) =>
                                  setCreateGroupForm((current) => ({
                                    ...current,
                                    options: current.options.map((entry, optionIndex) =>
                                      optionIndex === index
                                        ? { ...entry, description: event.target.value }
                                        : entry
                                    ),
                                  }))
                                }
                                type="text"
                                value={option.description}
                              />
                            </label>
                            <label className="field-stack">
                              <span>Sort order</span>
                              <input
                                inputMode="numeric"
                                min="0"
                                onChange={(event) =>
                                  setCreateGroupForm((current) => ({
                                    ...current,
                                    options: current.options.map((entry, optionIndex) =>
                                      optionIndex === index
                                        ? { ...entry, sort_order: event.target.value }
                                        : entry
                                    ),
                                  }))
                                }
                                type="number"
                                value={option.sort_order}
                              />
                            </label>
                          </div>
                          <label className="checkbox-row">
                            <input
                              checked={option.is_default}
                              onChange={(event) =>
                                setCreateGroupForm((current) => ({
                                  ...current,
                                  options: current.options.map((entry, optionIndex) =>
                                    optionIndex === index
                                      ? { ...entry, is_default: event.target.checked }
                                      : entry
                                  ),
                                }))
                              }
                              type="checkbox"
                            />
                            <span>Default option</span>
                          </label>
                        </article>
                      ))}
                    </div>

                    <div className="card-actions">
                      <button className="action-button secondary" onClick={appendCreateGroupOption} type="button">
                        Add option
                      </button>
                      <button
                        className="action-button"
                        disabled={createModifierGroupMutation.isPending}
                        type="submit"
                      >
                        {createModifierGroupMutation.isPending ? 'Saving group...' : 'Create modifier group'}
                      </button>
                    </div>
                  </form>
                </section>
              ) : null}

              {selectedItem.modifier_groups.length === 0 ? (
                <div className="lane-empty">No modifier groups are configured for this item yet.</div>
              ) : (
                <div className="catalog-modifier-list">
                  {selectedItem.modifier_groups.map((group) => {
                    const groupDraft = modifierGroupForms[group.uuid] ?? modifierGroupDraft(group);
                    const isSavingGroup =
                      updateModifierGroupMutation.isPending &&
                      updateModifierGroupMutation.variables?.modifierGroupUuid === group.uuid;

                    return (
                      <article className="catalog-modifier-card" key={group.uuid}>
                        <header>
                          <div>
                            <span className="eyebrow">Modifier group</span>
                            <h3>{group.name}</h3>
                          </div>
                          <span className="status-pill" data-tone={group.is_active ? 'success' : 'muted'}>
                            {group.is_active ? 'Active' : 'Hidden'}
                          </span>
                        </header>

                        <div className="field-grid">
                          <label className="field-stack">
                            <span>Group name</span>
                            <input
                              onChange={(event) =>
                                updateGroupDraft(group.uuid, (current) => ({
                                  ...current,
                                  name: event.target.value,
                                }))
                              }
                              type="text"
                              value={groupDraft.name}
                            />
                          </label>
                          <label className="field-stack">
                            <span>Selection type</span>
                            <select
                              onChange={(event) =>
                                updateGroupDraft(group.uuid, (current) => ({
                                  ...current,
                                  selection_type: event.target.value,
                                  max_selected:
                                    event.target.value === 'single' ? '1' : current.max_selected,
                                }))
                              }
                              value={groupDraft.selection_type}
                            >
                              <option value="single">Single</option>
                              <option value="multiple">Multiple</option>
                            </select>
                          </label>
                          <label className="field-stack">
                            <span>Minimum selected</span>
                            <input
                              inputMode="numeric"
                              min="0"
                              onChange={(event) =>
                                updateGroupDraft(group.uuid, (current) => ({
                                  ...current,
                                  min_selected: event.target.value,
                                }))
                              }
                              type="number"
                              value={groupDraft.min_selected}
                            />
                          </label>
                          <label className="field-stack">
                            <span>Maximum selected</span>
                            <input
                              inputMode="numeric"
                              min="1"
                              onChange={(event) =>
                                updateGroupDraft(group.uuid, (current) => ({
                                  ...current,
                                  max_selected: event.target.value,
                                }))
                              }
                              type="number"
                              value={groupDraft.max_selected}
                            />
                          </label>
                        </div>

                        <label className="field-stack">
                          <span>Group description</span>
                          <textarea
                            onChange={(event) =>
                              updateGroupDraft(group.uuid, (current) => ({
                                ...current,
                                description: event.target.value,
                              }))
                            }
                            rows={2}
                            value={groupDraft.description}
                          />
                        </label>

                        <div className="catalog-modifier-list">
                          {groupDraft.options.map((option, index) => (
                            <article className="catalog-modifier-card nested" key={option.uuid ?? `${group.uuid}-${index}`}>
                              <div className="field-grid">
                                <label className="field-stack">
                                  <span>Option name</span>
                                  <input
                                    onChange={(event) =>
                                      updateGroupDraft(group.uuid, (current) => ({
                                        ...current,
                                        options: current.options.map((entry, optionIndex) =>
                                          optionIndex === index
                                            ? { ...entry, name: event.target.value }
                                            : entry
                                        ),
                                      }))
                                    }
                                    type="text"
                                    value={option.name}
                                  />
                                </label>
                                <label className="field-stack">
                                  <span>Price delta</span>
                                  <input
                                    inputMode="numeric"
                                    min="0"
                                    onChange={(event) =>
                                      updateGroupDraft(group.uuid, (current) => ({
                                        ...current,
                                        options: current.options.map((entry, optionIndex) =>
                                          optionIndex === index
                                            ? { ...entry, price_delta_minor: event.target.value }
                                            : entry
                                        ),
                                      }))
                                    }
                                    type="number"
                                    value={option.price_delta_minor}
                                  />
                                </label>
                              </div>
                              <div className="field-grid">
                                <label className="field-stack">
                                  <span>Option description</span>
                                  <input
                                    onChange={(event) =>
                                      updateGroupDraft(group.uuid, (current) => ({
                                        ...current,
                                        options: current.options.map((entry, optionIndex) =>
                                          optionIndex === index
                                            ? { ...entry, description: event.target.value }
                                            : entry
                                        ),
                                      }))
                                    }
                                    type="text"
                                    value={option.description}
                                  />
                                </label>
                                <label className="field-stack">
                                  <span>Sort order</span>
                                  <input
                                    inputMode="numeric"
                                    min="0"
                                    onChange={(event) =>
                                      updateGroupDraft(group.uuid, (current) => ({
                                        ...current,
                                        options: current.options.map((entry, optionIndex) =>
                                          optionIndex === index
                                            ? { ...entry, sort_order: event.target.value }
                                            : entry
                                        ),
                                      }))
                                    }
                                    type="number"
                                    value={option.sort_order}
                                  />
                                </label>
                              </div>
                              <div className="field-grid">
                                <label className="checkbox-row">
                                  <input
                                    checked={option.is_default}
                                    onChange={(event) =>
                                      updateGroupDraft(group.uuid, (current) => ({
                                        ...current,
                                        options: current.options.map((entry, optionIndex) =>
                                          optionIndex === index
                                            ? { ...entry, is_default: event.target.checked }
                                            : entry
                                        ),
                                      }))
                                    }
                                    type="checkbox"
                                  />
                                  <span>Default option</span>
                                </label>
                                <label className="checkbox-row">
                                  <input
                                    checked={option.is_active}
                                    onChange={(event) =>
                                      updateGroupDraft(group.uuid, (current) => ({
                                        ...current,
                                        options: current.options.map((entry, optionIndex) =>
                                          optionIndex === index
                                            ? { ...entry, is_active: event.target.checked }
                                            : entry
                                        ),
                                      }))
                                    }
                                    type="checkbox"
                                  />
                                  <span>Option active</span>
                                </label>
                              </div>
                            </article>
                          ))}
                        </div>

                        {canWrite ? (
                          <div className="card-actions">
                            <button
                              className="action-button secondary"
                              onClick={() => appendGroupOption(group.uuid)}
                              type="button"
                            >
                              Add option
                            </button>
                            <button
                              className="action-button"
                              disabled={isSavingGroup}
                              onClick={() => handleSaveModifierGroup(group.uuid)}
                              type="button"
                            >
                              {isSavingGroup ? 'Saving group...' : `Save ${group.name}`}
                            </button>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              )}

              <div className="lane-header">
                <div>
                  <span className="eyebrow">Branch overrides</span>
                  <h3>Override price, stock, and availability per branch</h3>
                </div>
                <p>Overrides only touch branch-level delivery behavior and do not fork the item itself.</p>
              </div>

              <div className="catalog-override-grid">
                {(selectedMerchant?.branches ?? []).map((branch) => {
                  const currentOverride = selectedItem.branch_overrides.find(
                    (entry) => entry.branch_uuid === branch.uuid
                  );
                  const draft = overrideFormState[branch.uuid] ?? {
                    price_minor: '',
                    stock_quantity: '',
                    is_available: selectedItem.is_active,
                  };

                  return (
                    <article className="catalog-override-card" key={branch.uuid}>
                      <header>
                        <div>
                          <span className="eyebrow">Branch</span>
                          <h3>{branch.name}</h3>
                        </div>
                        <span
                          className="status-pill"
                          data-tone={currentOverride?.is_available ?? selectedItem.is_active ? 'success' : 'muted'}
                        >
                          {currentOverride ? 'Override active' : 'Using base item'}
                        </span>
                      </header>

                      <div className="board-meta">
                        <span>{branch.city}</span>
                        <span>{branch.address_line}</span>
                      </div>

                      <div className="field-grid">
                        <label className="field-stack">
                          <span>{branch.name} override price</span>
                          <input
                            inputMode="numeric"
                            min="0"
                            onChange={(event) =>
                              setOverrideFormState((current) => ({
                                ...current,
                                [branch.uuid]: {
                                  ...current[branch.uuid],
                                  price_minor: event.target.value,
                                },
                              }))
                            }
                            type="number"
                            value={draft.price_minor}
                          />
                        </label>
                        <label className="field-stack">
                          <span>{branch.name} override stock</span>
                          <input
                            inputMode="numeric"
                            min="0"
                            onChange={(event) =>
                              setOverrideFormState((current) => ({
                                ...current,
                                [branch.uuid]: {
                                  ...current[branch.uuid],
                                  stock_quantity: event.target.value,
                                },
                              }))
                            }
                            type="number"
                            value={draft.stock_quantity}
                          />
                        </label>
                      </div>

                      <label className="checkbox-row">
                        <input
                          checked={draft.is_available}
                          onChange={(event) =>
                            setOverrideFormState((current) => ({
                              ...current,
                              [branch.uuid]: {
                                ...current[branch.uuid],
                                is_available: event.target.checked,
                              },
                            }))
                          }
                          type="checkbox"
                        />
                        <span>{branch.name} availability</span>
                      </label>

                      <div className="board-note">
                        <strong>Current override:</strong>{' '}
                        {currentOverride
                          ? `${currentOverride.price_minor ?? selectedItem.base_price_minor} minor units, ${
                              currentOverride.stock_quantity ?? selectedItem.base_stock ?? 'untracked'
                            } stock, ${currentOverride.is_available ? 'available' : 'hidden'}`
                          : 'No override yet. This branch is still inheriting the base item values.'}
                      </div>

                      {canWrite ? (
                        <button
                          className="action-button"
                          disabled={
                            branchOverrideMutation.isPending &&
                            branchOverrideMutation.variables?.branchUuid === branch.uuid
                          }
                          onClick={() => handleOverrideSubmit(branch.uuid)}
                          type="button"
                        >
                          {branchOverrideMutation.isPending &&
                          branchOverrideMutation.variables?.branchUuid === branch.uuid
                            ? 'Saving...'
                            : `Save ${branch.name} override`}
                        </button>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="lane-empty">Pick a catalog item from the left column to edit it and manage branch overrides.</div>
          )}
        </section>
      </div>
    </section>
  );
}
