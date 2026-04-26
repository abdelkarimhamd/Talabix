import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../use-session.js';

const emptyPromotionForm = {
  branch_uuid: '',
  catalog_item_uuid: '',
  title: '',
  discount_label: '',
  discount_type: 'delivery',
  percent: '',
  amount_minor: '',
  min_spend_minor: '0',
  code: '',
  requires_promo_code: false,
  is_active: true,
};

function numberDraft(value) {
  return value === null || value === undefined ? '' : String(value);
}

function integerOrNull(value) {
  const trimmedValue = String(value ?? '').trim();

  if (trimmedValue.length === 0) {
    return null;
  }

  return Number.parseInt(trimmedValue, 10);
}

function offerDraft(offer) {
  if (!offer) {
    return { ...emptyPromotionForm };
  }

  return {
    branch_uuid: offer.branch_uuid,
    catalog_item_uuid: offer.catalog_item_uuid ?? '',
    title: offer.title ?? '',
    discount_label: offer.discount_label ?? '',
    discount_type: offer.discount_type ?? 'delivery',
    percent: numberDraft(offer.percent),
    amount_minor: numberDraft(offer.amount_minor),
    min_spend_minor: numberDraft(offer.min_spend_minor ?? 0),
    code: offer.code ?? '',
    requires_promo_code: offer.requires_promo_code ?? false,
    is_active: offer.is_active ?? true,
  };
}

function errorMessage(error) {
  return (
    error?.issues?.[0]?.message ??
    error?.message ??
    'Promotion offer action could not be completed.'
  );
}

function formatMoney(minor) {
  return `${(minor / 100).toFixed(2)} SAR`;
}

function promotionPayload(form, fallbackBranchUuid) {
  const discountType = form.discount_type;

  return {
    branch_uuid: form.branch_uuid || fallbackBranchUuid,
    catalog_item_uuid: form.catalog_item_uuid || null,
    code: form.code.trim() || null,
    title: form.title.trim(),
    discount_label: form.discount_label.trim(),
    discount_type: discountType,
    percent: discountType === 'item_percent' ? integerOrNull(form.percent) : null,
    amount_minor: discountType === 'item_fixed' ? integerOrNull(form.amount_minor) : null,
    min_spend_minor: integerOrNull(form.min_spend_minor) ?? 0,
    requires_promo_code: form.requires_promo_code,
    is_active: form.is_active,
    starts_at: null,
    expires_at: null,
  };
}

export function PromotionOffersBoard({ scope = 'ops' }) {
  const { api, session } = useSession();
  const queryClient = useQueryClient();
  const [selectedMerchantUuid, setSelectedMerchantUuid] = useState('');
  const [editingOfferUuid, setEditingOfferUuid] = useState(null);
  const [form, setForm] = useState(emptyPromotionForm);
  const [feedback, setFeedback] = useState('');
  const canWrite =
    scope === 'ops'
      ? session.permissions.includes('ops:merchants.manage')
      : session.permissions.includes('merchant:catalog.write');

  const merchantsQuery = useQuery({
    queryKey: ['promotion-offer-merchants'],
    queryFn: () => api.listMerchantConfigurations(),
  });

  const offersQuery = useQuery({
    queryKey: ['promotion-offers'],
    queryFn: () => api.listPromotionOffers(),
  });

  useEffect(() => {
    if (!selectedMerchantUuid && merchantsQuery.data?.length) {
      setSelectedMerchantUuid(merchantsQuery.data[0].uuid);
    }
  }, [merchantsQuery.data, selectedMerchantUuid]);

  const selectedMerchant =
    merchantsQuery.data?.find((merchant) => merchant.uuid === selectedMerchantUuid) ??
    merchantsQuery.data?.[0] ??
    null;
  const branches = selectedMerchant?.branches ?? [];
  const fallbackBranchUuid = branches[0]?.uuid ?? '';

  useEffect(() => {
    if (!form.branch_uuid && fallbackBranchUuid) {
      setForm((current) => ({
        ...current,
        branch_uuid: fallbackBranchUuid,
      }));
    }
  }, [fallbackBranchUuid, form.branch_uuid]);

  const catalogItemsQuery = useQuery({
    queryKey: ['merchant-catalog-items', selectedMerchant?.uuid],
    enabled: Boolean(selectedMerchant?.uuid),
    queryFn: () => api.listCatalogItems({ merchant_uuid: selectedMerchant.uuid }),
  });

  const catalogItems = catalogItemsQuery.data ?? [];
  const visibleOffers = useMemo(() => {
    const promotionOffers = offersQuery.data ?? [];

    if (!selectedMerchant?.uuid) {
      return promotionOffers;
    }

    return promotionOffers.filter((offer) => offer.merchant_uuid === selectedMerchant.uuid);
  }, [offersQuery.data, selectedMerchant]);

  const createPromotionMutation = useMutation({
    mutationFn: (payload) => api.createPromotionOffer(payload),
    onSuccess: async (offer) => {
      setFeedback(`${offer.title} promotion saved.`);
      setEditingOfferUuid(null);
      setForm({
        ...emptyPromotionForm,
        branch_uuid: fallbackBranchUuid,
      });
      await queryClient.invalidateQueries({ queryKey: ['promotion-offers'] });
    },
    onError: (error) => {
      setFeedback(errorMessage(error));
    },
  });

  const updatePromotionMutation = useMutation({
    mutationFn: ({ promotionOfferUuid, payload }) =>
      api.updatePromotionOffer(promotionOfferUuid, payload),
    onSuccess: async (offer) => {
      setFeedback(`${offer.title} promotion saved.`);
      setEditingOfferUuid(offer.uuid);
      setForm(offerDraft(offer));
      await queryClient.invalidateQueries({ queryKey: ['promotion-offers'] });
    },
    onError: (error) => {
      setFeedback(errorMessage(error));
    },
  });

  const deletePromotionMutation = useMutation({
    mutationFn: (offer) => api.deletePromotionOffer(offer.uuid).then(() => offer),
    onSuccess: async (offer) => {
      setFeedback(`${offer.title} promotion deleted.`);

      if (editingOfferUuid === offer.uuid) {
        setEditingOfferUuid(null);
        setForm({
          ...emptyPromotionForm,
          branch_uuid: fallbackBranchUuid,
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['promotion-offers'] });
    },
    onError: (error) => {
      setFeedback(errorMessage(error));
    },
  });

  function handleSubmit(event) {
    event.preventDefault();
    setFeedback('');

    const payload = promotionPayload(form, fallbackBranchUuid);

    if (editingOfferUuid) {
      updatePromotionMutation.mutate({
        promotionOfferUuid: editingOfferUuid,
        payload,
      });
      return;
    }

    createPromotionMutation.mutate(payload);
  }

  function handleEditOffer(offer) {
    setEditingOfferUuid(offer.uuid);
    setSelectedMerchantUuid(offer.merchant_uuid ?? selectedMerchantUuid);
    setForm(offerDraft(offer));
    setFeedback('');
  }

  function handleNewOffer() {
    setEditingOfferUuid(null);
    setForm({
      ...emptyPromotionForm,
      branch_uuid: fallbackBranchUuid,
    });
    setFeedback('');
  }

  if (merchantsQuery.isLoading || offersQuery.isLoading) {
    return (
      <section className="board panel">
        <div className="empty-state">
          <h2>Loading promotion offers</h2>
          <p>Pulling merchant branches, menu items, and active offer rules into the portal.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="board panel">
      <div className="board-header">
        <div>
          <span className="eyebrow">
            {scope === 'ops' ? 'Ops promotions' : 'Merchant promotions'}
          </span>
          <h2>Promotion offer rules</h2>
          {!feedback ? <p>Manage promo-code and auto-apply offers</p> : null}
        </div>
        <span className="status-pill" data-tone="success">
          {visibleOffers.length} configured
        </span>
      </div>

      <div className="toolbar">
        <select
          aria-label="Promotion merchant"
          onChange={(event) => {
            setSelectedMerchantUuid(event.target.value);
            setEditingOfferUuid(null);
            setForm(emptyPromotionForm);
          }}
          value={selectedMerchant?.uuid ?? ''}
        >
          {(merchantsQuery.data ?? []).map((merchant) => (
            <option key={merchant.uuid} value={merchant.uuid}>
              {merchant.name}
            </option>
          ))}
        </select>
        <button onClick={() => offersQuery.refetch()} type="button">
          {offersQuery.isFetching ? 'Refreshing...' : 'Refresh offers'}
        </button>
        <button className="secondary" onClick={handleNewOffer} type="button">
          New promotion
        </button>
      </div>

      {feedback ? (
        <div aria-live="polite" className="inline-feedback" role="status">
          {feedback}
        </div>
      ) : null}

      <div className="catalog-layout">
        <aside className="catalog-sidebar">
          <section className="panel catalog-panel">
            <div className="lane-header">
              <div>
                <span className="eyebrow">Offer list</span>
                <h3>{visibleOffers.length} promotion offers</h3>
              </div>
              <p>Promo-code and automatic discounts share the same rules table.</p>
            </div>

            {visibleOffers.length === 0 ? (
              <div className="lane-empty">No promotion offers exist for this merchant yet.</div>
            ) : (
              <div className="catalog-list">
                {visibleOffers.map((offer) => (
                  <article
                    className={`board-card${editingOfferUuid === offer.uuid ? ' selected' : ''}`}
                    key={offer.uuid}
                  >
                    <header>
                      <div>
                        <span className="eyebrow">{offer.branch_name ?? 'Branch offer'}</span>
                        <h3>{offer.title}</h3>
                      </div>
                      <span
                        className="status-pill"
                        data-tone={offer.is_active ? 'success' : 'muted'}
                      >
                        {offer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </header>

                    <div className="board-meta">
                      <span>
                        {offer.requires_promo_code
                          ? offer.code
                          : editingOfferUuid === offer.uuid
                            ? 'auto-apply'
                            : 'automatic'}
                      </span>
                      <span>{offer.discount_label}</span>
                    </div>

                    <dl>
                      <div>
                        <dt>Type</dt>
                        <dd>{offer.discount_type.replace('_', ' ')}</dd>
                      </div>
                      <div>
                        <dt>Minimum spend</dt>
                        <dd>{formatMoney(offer.min_spend_minor)}</dd>
                      </div>
                    </dl>

                    {offer.catalog_item_name ? (
                      <p className="board-note">Limited to {offer.catalog_item_name}.</p>
                    ) : (
                      <p className="board-note">Applies to eligible cart totals for this branch.</p>
                    )}

                    {canWrite ? (
                      <footer className="card-actions">
                        <button
                          className="action-button secondary"
                          onClick={() => handleEditOffer(offer)}
                          type="button"
                        >
                          Edit {offer.title}
                        </button>
                        <button
                          className="action-button secondary"
                          disabled={deletePromotionMutation.isPending}
                          onClick={() => deletePromotionMutation.mutate(offer)}
                          type="button"
                        >
                          Delete {offer.title}
                        </button>
                      </footer>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        </aside>

        <section className="panel catalog-panel">
          <div className="lane-header">
            <div>
              <span className="eyebrow">
                {editingOfferUuid ? 'Edit promotion' : 'Create promotion'}
              </span>
              <h3>Define checkout discount behavior</h3>
            </div>
            <p>Ops can create seeded-equivalent rules without touching demo data.</p>
          </div>

          {canWrite ? (
            <form className="catalog-form" onSubmit={handleSubmit}>
              <div className="field-grid">
                <label className="field-stack">
                  <span>Promotion branch</span>
                  <select
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        branch_uuid: event.target.value,
                      }))
                    }
                    required
                    value={form.branch_uuid || fallbackBranchUuid}
                  >
                    {branches.map((branch) => (
                      <option key={branch.uuid} value={branch.uuid}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field-stack">
                  <span>Promotion catalog item</span>
                  <select
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        catalog_item_uuid: event.target.value,
                      }))
                    }
                    value={form.catalog_item_uuid}
                  >
                    <option value="">Any eligible item</option>
                    {catalogItems.map((item) => (
                      <option key={item.uuid} value={item.uuid}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="field-grid">
                <label className="field-stack">
                  <span>Promotion title</span>
                  <input
                    onChange={(event) =>
                      setForm((current) => ({ ...current, title: event.target.value }))
                    }
                    required
                    type="text"
                    value={form.title}
                  />
                </label>
                <label className="field-stack">
                  <span>Promotion discount label</span>
                  <input
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        discount_label: event.target.value,
                      }))
                    }
                    required
                    type="text"
                    value={form.discount_label}
                  />
                </label>
              </div>

              <div className="field-grid">
                <label className="field-stack">
                  <span>Promotion discount type</span>
                  <select
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        discount_type: event.target.value,
                      }))
                    }
                    value={form.discount_type}
                  >
                    <option value="delivery">Free delivery</option>
                    <option value="item_percent">Percent off item</option>
                    <option value="item_fixed">SAR amount off item</option>
                  </select>
                </label>
                <label className="field-stack">
                  <span>Promotion percent</span>
                  <input
                    inputMode="numeric"
                    max="100"
                    min="1"
                    onChange={(event) =>
                      setForm((current) => ({ ...current, percent: event.target.value }))
                    }
                    type="number"
                    value={form.percent}
                  />
                </label>
                <label className="field-stack">
                  <span>Promotion amount minor</span>
                  <input
                    inputMode="numeric"
                    min="0"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        amount_minor: event.target.value,
                      }))
                    }
                    type="number"
                    value={form.amount_minor}
                  />
                </label>
                <label className="field-stack">
                  <span>Promotion minimum spend minor</span>
                  <input
                    inputMode="numeric"
                    min="0"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        min_spend_minor: event.target.value,
                      }))
                    }
                    type="number"
                    value={form.min_spend_minor}
                  />
                </label>
              </div>

              <div className="field-grid">
                <label className="field-stack">
                  <span>Promotion promo code</span>
                  <input
                    onChange={(event) =>
                      setForm((current) => ({ ...current, code: event.target.value }))
                    }
                    type="text"
                    value={form.code}
                  />
                </label>
                <label className="checkbox-row">
                  <input
                    checked={form.requires_promo_code}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        requires_promo_code: event.target.checked,
                      }))
                    }
                    type="checkbox"
                  />
                  <span>Promotion requires promo code</span>
                </label>
                <label className="checkbox-row">
                  <input
                    checked={form.is_active}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        is_active: event.target.checked,
                      }))
                    }
                    type="checkbox"
                  />
                  <span>Promotion active</span>
                </label>
              </div>

              <div className="card-actions">
                <button
                  className="action-button"
                  disabled={createPromotionMutation.isPending || updatePromotionMutation.isPending}
                  type="submit"
                >
                  {editingOfferUuid ? 'Save promotion' : 'Create promotion'}
                </button>
              </div>
            </form>
          ) : (
            <div className="lane-empty">This session can view promotion offers but cannot change them.</div>
          )}
        </section>
      </div>
    </section>
  );
}
