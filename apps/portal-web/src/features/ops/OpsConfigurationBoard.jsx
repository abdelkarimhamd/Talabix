import React, { useEffect, useState } from 'react';
// i18n-audit: strict
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '../../use-i18n.js';
import { useSession } from '../../use-session.js';

function zoneFormFromBranch(branch, zone, defaultCity = '') {
  return {
    uuid: zone?.uuid ?? '',
    name: zone?.name ?? '',
    city: zone?.city ?? branch?.city ?? defaultCity,
    postal_code: zone?.postal_code ?? '',
    center_latitude: String(
      zone?.center_latitude ?? branch?.latitude ?? 24.7136
    ),
    center_longitude: String(
      zone?.center_longitude ?? branch?.longitude ?? 46.6753
    ),
    radius_meters: String(zone?.radius_meters ?? 5000),
    is_active: zone?.is_active ?? true,
  };
}

function feeBandFormFromValue(feeBand) {
  return {
    uuid: feeBand?.uuid ?? '',
    min_distance_meters: String(feeBand?.min_distance_meters ?? 0),
    max_distance_meters: String(feeBand?.max_distance_meters ?? 5000),
    fee_minor: String(feeBand?.fee_minor ?? 1500),
  };
}

function createEmptyStoreSetupForm(t) {
  return {
    name: '',
    slug: '',
    commission_percent: '12',
    branch_name: t('ops.configuration.defaults.branchName'),
    city: t('ops.configuration.defaults.city'),
    address_line: '',
    latitude: '24.7136',
    longitude: '46.6753',
    zone_name: t('ops.configuration.defaults.zoneName'),
    radius_meters: '5000',
    fee_minor: '1500',
    opens_at: '09:00',
    closes_at: '23:00',
  };
}

function slugFromName(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function createStorePayload(form) {
  const opensAt = form.opens_at.trim() || null;
  const closesAt = form.closes_at.trim() || null;

  return {
    name: form.name.trim(),
    slug: (form.slug.trim() || slugFromName(form.name)).toLowerCase(),
    platform_commission_bps: Math.round(Number(form.commission_percent) * 100),
    branch: {
      name: form.branch_name.trim(),
      city: form.city.trim(),
      address_line: form.address_line.trim(),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      hours: Array.from({ length: 7 }, (_, dayOfWeek) => ({
        day_of_week: dayOfWeek,
        opens_at: opensAt,
        closes_at: closesAt,
      })),
      zones: [
        {
          name: form.zone_name.trim(),
          city: form.city.trim(),
          postal_code: null,
          center_latitude: Number(form.latitude),
          center_longitude: Number(form.longitude),
          radius_meters: Number(form.radius_meters),
        },
      ],
      fee_bands: [
        {
          min_distance_meters: 0,
          max_distance_meters: Number(form.radius_meters),
          fee_minor: Number(form.fee_minor),
        },
      ],
    },
  };
}

function StoreSetupForm({
  form,
  isSubmitting,
  onCancel,
  onFieldChange,
  onSubmit,
  t,
}) {
  return (
    <form
      className="catalog-panel panel first-store-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="board-header">
        <div>
          <span className="eyebrow">
            {t('ops.configuration.setup.eyebrow')}
          </span>
          <h3>{t('ops.configuration.setup.title')}</h3>
        </div>
      </div>

      <div className="field-grid">
        <label className="field-stack">
          <span>{t('ops.configuration.fields.storeName')}</span>
          <input
            onChange={(event) => onFieldChange('name', event.target.value)}
            required
            value={form.name}
          />
        </label>
        <label className="field-stack">
          <span>{t('ops.configuration.fields.storeSlug')}</span>
          <input
            onChange={(event) => onFieldChange('slug', event.target.value)}
            required
            value={form.slug}
          />
        </label>
        <label className="field-stack">
          <span>{t('ops.configuration.fields.commissionPercent')}</span>
          <input
            inputMode="decimal"
            min="0"
            max="100"
            onChange={(event) =>
              onFieldChange('commission_percent', event.target.value)
            }
            required
            type="number"
            value={form.commission_percent}
          />
        </label>
        <label className="field-stack">
          <span>{t('ops.configuration.fields.branchName')}</span>
          <input
            onChange={(event) =>
              onFieldChange('branch_name', event.target.value)
            }
            required
            value={form.branch_name}
          />
        </label>
        <label className="field-stack">
          <span>{t('ops.configuration.fields.city')}</span>
          <input
            onChange={(event) => onFieldChange('city', event.target.value)}
            required
            value={form.city}
          />
        </label>
        <label className="field-stack">
          <span>{t('ops.configuration.fields.branchAddress')}</span>
          <input
            onChange={(event) =>
              onFieldChange('address_line', event.target.value)
            }
            required
            value={form.address_line}
          />
        </label>
        <label className="field-stack">
          <span>{t('ops.configuration.fields.latitude')}</span>
          <input
            inputMode="decimal"
            onChange={(event) => onFieldChange('latitude', event.target.value)}
            required
            type="number"
            value={form.latitude}
          />
        </label>
        <label className="field-stack">
          <span>{t('ops.configuration.fields.longitude')}</span>
          <input
            inputMode="decimal"
            onChange={(event) => onFieldChange('longitude', event.target.value)}
            required
            type="number"
            value={form.longitude}
          />
        </label>
      </div>

      <div className="field-grid">
        <label className="field-stack">
          <span>{t('ops.configuration.fields.openingTime')}</span>
          <input
            onChange={(event) => onFieldChange('opens_at', event.target.value)}
            type="time"
            value={form.opens_at}
          />
        </label>
        <label className="field-stack">
          <span>{t('ops.configuration.fields.closingTime')}</span>
          <input
            onChange={(event) => onFieldChange('closes_at', event.target.value)}
            type="time"
            value={form.closes_at}
          />
        </label>
        <label className="field-stack">
          <span>{t('ops.configuration.fields.serviceZoneName')}</span>
          <input
            onChange={(event) => onFieldChange('zone_name', event.target.value)}
            required
            value={form.zone_name}
          />
        </label>
        <label className="field-stack">
          <span>{t('ops.configuration.fields.deliveryRadiusMeters')}</span>
          <input
            inputMode="numeric"
            min="100"
            onChange={(event) =>
              onFieldChange('radius_meters', event.target.value)
            }
            required
            type="number"
            value={form.radius_meters}
          />
        </label>
        <label className="field-stack">
          <span>{t('ops.configuration.fields.deliveryFeeMinorUnits')}</span>
          <input
            inputMode="numeric"
            min="0"
            onChange={(event) => onFieldChange('fee_minor', event.target.value)}
            required
            type="number"
            value={form.fee_minor}
          />
        </label>
      </div>

      <div className="card-actions">
        <button className="action-button" disabled={isSubmitting} type="submit">
          {isSubmitting
            ? t('ops.configuration.actions.creatingStore')
            : t('ops.configuration.actions.createStore')}
        </button>
        {onCancel ? (
          <button
            className="action-button secondary"
            onClick={onCancel}
            type="button"
          >
            {t('ops.configuration.actions.cancel')}
          </button>
        ) : null}
      </div>
    </form>
  );
}

export function OpsConfigurationBoard() {
  const { api } = useSession();
  const { formatCurrency, formatNumber, t, tp } = useI18n();
  const queryClient = useQueryClient();
  const defaultCity = t('ops.configuration.defaults.city');
  const [selectedMerchantUuid, setSelectedMerchantUuid] = useState('');
  const [selectedBranchUuid, setSelectedBranchUuid] = useState('');
  const [merchantStatus, setMerchantStatus] = useState('active');
  const [commissionBps, setCommissionBps] = useState('1200');
  const [branchStatus, setBranchStatus] = useState('active');
  const [branchAcceptsOrders, setBranchAcceptsOrders] = useState(true);
  const [zoneForm, setZoneForm] = useState(() =>
    zoneFormFromBranch(undefined, undefined, defaultCity)
  );
  const [feeBandForm, setFeeBandForm] = useState(feeBandFormFromValue());
  const [mapsApiKey, setMapsApiKey] = useState('');
  const [mapsForm, setMapsForm] = useState({
    provider: 'google_maps',
    region: 'sa',
    location_bias: 'circle:50000@24.7136,46.6753',
    timeout_seconds: '2.5',
    fallback_to_demo: true,
    clearApiKey: false,
  });
  const [storeSetupForm, setStoreSetupForm] = useState(() =>
    createEmptyStoreSetupForm(t)
  );
  const [showStoreSetupForm, setShowStoreSetupForm] = useState(false);
  const [feedback, setFeedback] = useState('');

  const { data: merchants = [] } = useQuery({
    queryKey: ['ops-configuration'],
    queryFn: () => api.listMerchantConfigurations(),
  });

  const { data: mapsProviderConfiguration } = useQuery({
    queryKey: ['ops-maps-provider-configuration'],
    queryFn: () => api.getMapsProviderConfiguration(),
  });

  const updateStoreSetupField = (field, value) => {
    setStoreSetupForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'name' && !current.slug
        ? { slug: slugFromName(value) }
        : {}),
    }));
  };

  const selectedMerchant =
    merchants.find((merchant) => merchant.uuid === selectedMerchantUuid) ??
    merchants[0];
  const selectedBranch =
    selectedMerchant?.branches.find(
      (branch) => branch.uuid === selectedBranchUuid
    ) ??
    selectedMerchant?.branches[0] ??
    null;

  useEffect(() => {
    if (!selectedMerchantUuid && merchants[0]) {
      setSelectedMerchantUuid(merchants[0].uuid);
    }
  }, [merchants, selectedMerchantUuid]);

  useEffect(() => {
    if (!mapsProviderConfiguration) {
      return;
    }

    setMapsForm({
      provider: mapsProviderConfiguration.provider,
      region: mapsProviderConfiguration.google_maps.region,
      location_bias: mapsProviderConfiguration.google_maps.location_bias ?? '',
      timeout_seconds: String(
        mapsProviderConfiguration.google_maps.timeout_seconds
      ),
      fallback_to_demo: mapsProviderConfiguration.google_maps.fallback_to_demo,
      clearApiKey: false,
    });
  }, [mapsProviderConfiguration]);

  useEffect(() => {
    if (selectedMerchant && selectedMerchant.uuid !== selectedMerchantUuid) {
      setSelectedMerchantUuid(selectedMerchant.uuid);
    }

    if (selectedMerchant?.branches.length) {
      const branchStillExists = selectedMerchant.branches.some(
        (branch) => branch.uuid === selectedBranchUuid
      );

      if (!branchStillExists) {
        setSelectedBranchUuid(selectedMerchant.branches[0].uuid);
      }
    }
  }, [selectedBranchUuid, selectedMerchant, selectedMerchantUuid]);

  useEffect(() => {
    if (!selectedMerchant) {
      return;
    }

    setMerchantStatus(selectedMerchant.status);
    setCommissionBps(String(selectedMerchant.platform_commission_bps));
  }, [selectedMerchant]);

  useEffect(() => {
    if (!selectedBranch) {
      return;
    }

    setBranchStatus(selectedBranch.status);
    setBranchAcceptsOrders(selectedBranch.accepts_orders);
    setZoneForm(zoneFormFromBranch(selectedBranch, undefined, defaultCity));
    setFeeBandForm(feeBandFormFromValue());
  }, [defaultCity, selectedBranch]);

  const mapsMutation = useMutation({
    mutationFn: () =>
      api.updateMapsProviderConfiguration({
        provider: mapsForm.provider,
        google_maps_api_key: mapsApiKey.trim() || undefined,
        clear_google_maps_api_key: mapsForm.clearApiKey,
        google_maps_region: mapsForm.region,
        google_maps_location_bias: mapsForm.location_bias || null,
        google_maps_timeout_seconds: Number(mapsForm.timeout_seconds),
        google_maps_fallback_to_demo: mapsForm.fallback_to_demo,
      }),
    onSuccess: (configuration) => {
      queryClient.setQueryData(
        ['ops-maps-provider-configuration'],
        configuration
      );
      setMapsApiKey('');
      setMapsForm((current) => ({
        ...current,
        clearApiKey: false,
      }));
      setFeedback(t('ops.configuration.feedback.mapsSaved'));
    },
    onError: (error) => {
      setFeedback(
        error.message ?? t('ops.configuration.feedback.mapsSaveFailed')
      );
    },
  });

  const createMerchantMutation = useMutation({
    mutationFn: () => api.createMerchant(createStorePayload(storeSetupForm)),
    onSuccess: async (merchant) => {
      setSelectedMerchantUuid(merchant.uuid);
      setStoreSetupForm(createEmptyStoreSetupForm(t));
      setShowStoreSetupForm(false);
      await queryClient.invalidateQueries({ queryKey: ['ops-configuration'] });
      await queryClient.invalidateQueries({ queryKey: ['managed-merchants'] });
      setFeedback(
        t('ops.configuration.feedback.storeCreated', {
          merchant: merchant.name,
        })
      );
    },
    onError: (error) => {
      setFeedback(
        error.message ?? t('ops.configuration.feedback.storeCreateFailed')
      );
    },
  });

  const merchantMutation = useMutation({
    mutationFn: () =>
      api.updateMerchantConfiguration(selectedMerchant.uuid, {
        status: merchantStatus,
        platform_commission_bps: Number(commissionBps),
      }),
    onSuccess: (merchant) => {
      queryClient.invalidateQueries({ queryKey: ['ops-configuration'] });
      setFeedback(
        t('ops.configuration.feedback.merchantSaved', {
          merchant: merchant.name,
          commission: (merchant.platform_commission_bps / 100).toFixed(2),
        })
      );
    },
    onError: (error) => {
      setFeedback(
        error.message ?? t('ops.configuration.feedback.merchantSaveFailed')
      );
    },
  });

  const branchMutation = useMutation({
    mutationFn: () =>
      api.updateBranchConfiguration(selectedBranch.uuid, {
        status: branchStatus,
        accepts_orders: branchAcceptsOrders,
      }),
    onSuccess: (branch) => {
      queryClient.invalidateQueries({ queryKey: ['ops-configuration'] });
      setFeedback(
        t('ops.configuration.feedback.branchSaved', {
          branch: branch.name,
        })
      );
    },
    onError: (error) => {
      setFeedback(
        error.message ?? t('ops.configuration.feedback.branchSaveFailed')
      );
    },
  });

  const serviceZoneMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: zoneForm.name,
        city: zoneForm.city,
        postal_code: zoneForm.postal_code || null,
        center_latitude: Number(zoneForm.center_latitude),
        center_longitude: Number(zoneForm.center_longitude),
        radius_meters: Number(zoneForm.radius_meters),
        is_active: zoneForm.is_active,
      };

      if (zoneForm.uuid) {
        return api.updateServiceZone(zoneForm.uuid, payload);
      }

      return api.createServiceZone(selectedBranch.uuid, payload);
    },
    onSuccess: (zone) => {
      queryClient.invalidateQueries({ queryKey: ['ops-configuration'] });
      setFeedback(
        t('ops.configuration.feedback.serviceZoneSaved', {
          zone: zone.name,
        })
      );
      setZoneForm(zoneFormFromBranch(selectedBranch, undefined, defaultCity));
    },
    onError: (error) => {
      setFeedback(
        error.message ?? t('ops.configuration.feedback.serviceZoneSaveFailed')
      );
    },
  });

  const feeBandMutation = useMutation({
    mutationFn: () => {
      const payload = {
        min_distance_meters: Number(feeBandForm.min_distance_meters),
        max_distance_meters: Number(feeBandForm.max_distance_meters),
        fee_minor: Number(feeBandForm.fee_minor),
      };

      if (feeBandForm.uuid) {
        return api.updateFeeBand(feeBandForm.uuid, payload);
      }

      return api.createFeeBand(selectedBranch.uuid, payload);
    },
    onSuccess: (feeBand) => {
      queryClient.invalidateQueries({ queryKey: ['ops-configuration'] });
      setFeedback(
        t('ops.configuration.feedback.feeBandSaved', {
          min: feeBand.min_distance_meters,
          max: feeBand.max_distance_meters,
        })
      );
      setFeeBandForm(feeBandFormFromValue());
    },
    onError: (error) => {
      setFeedback(
        error.message ?? t('ops.configuration.feedback.feeBandSaveFailed')
      );
    },
  });

  const mapsProviderLabel = (provider) =>
    provider === 'demo'
      ? t('ops.configuration.maps.providerDemo')
      : t('ops.configuration.maps.providerGoogleMaps');
  const statusLabel = (status) =>
    status === 'inactive'
      ? t('ops.configuration.values.inactive')
      : t('ops.configuration.values.active');
  const mapsStatusLabel =
    mapsProviderConfiguration?.google_maps.api_key_source === 'admin'
      ? t('ops.configuration.maps.configuredViaAdmin')
      : mapsProviderConfiguration?.google_maps.api_key_source === 'env'
        ? t('ops.configuration.maps.configuredViaEnvironment')
        : t('ops.configuration.maps.apiKeyNotConfigured');
  const mapsRuntimeMessage = !mapsProviderConfiguration
    ? t('ops.configuration.maps.loading')
    : mapsProviderConfiguration.runtime.ready
      ? t('ops.configuration.maps.runtimeGoogleReady')
      : mapsProviderConfiguration.provider === 'demo'
        ? t('ops.configuration.maps.runtimeDemoActive')
        : t('ops.configuration.maps.runtimeFallback');

  if (!selectedMerchant || !selectedBranch) {
    return (
      <section className="board panel">
        <div className="board-header">
          <div>
            <span className="eyebrow">
              {t('ops.configuration.page.eyebrow')}
            </span>
            <h2>{t('ops.configuration.empty.title')}</h2>
          </div>
          <span className="status-pill" data-tone="warm">
            {t('ops.configuration.empty.badge')}
          </span>
        </div>

        <p>{t('ops.configuration.empty.description')}</p>

        {feedback ? (
          <div aria-live="polite" className="inline-feedback" role="status">
            {feedback}
          </div>
        ) : null}

        <StoreSetupForm
          form={storeSetupForm}
          isSubmitting={createMerchantMutation.isPending}
          onFieldChange={updateStoreSetupField}
          onSubmit={() => createMerchantMutation.mutate()}
          t={t}
        />
      </section>
    );
  }

  return (
    <section className="board panel">
      <div className="board-header">
        <div>
          <span className="eyebrow">{t('ops.configuration.page.eyebrow')}</span>
          <h2>{t('ops.configuration.page.title')}</h2>
        </div>
        <div className="card-actions">
          <span className="status-pill" data-tone="info">
            {tp('ops.configuration.counts.merchants', merchants.length)}
          </span>
          <button
            className="action-button secondary"
            onClick={() => setShowStoreSetupForm((current) => !current)}
            type="button"
          >
            {showStoreSetupForm
              ? t('ops.configuration.actions.hideStoreForm')
              : t('ops.configuration.actions.addStore')}
          </button>
        </div>
      </div>

      {showStoreSetupForm ? (
        <StoreSetupForm
          form={storeSetupForm}
          isSubmitting={createMerchantMutation.isPending}
          onCancel={() => setShowStoreSetupForm(false)}
          onFieldChange={updateStoreSetupField}
          onSubmit={() => createMerchantMutation.mutate()}
          t={t}
        />
      ) : null}

      <section className="catalog-panel panel">
        <div className="board-header">
          <div>
            <span className="eyebrow">
              {t('ops.configuration.maps.eyebrow')}
            </span>
            <h3>{t('ops.configuration.maps.title')}</h3>
          </div>
          <span
            className="status-pill"
            data-tone={
              mapsProviderConfiguration?.runtime.ready ? 'success' : 'warning'
            }
          >
            {mapsStatusLabel}
          </span>
        </div>

        <div className="summary-pairs">
          <div>
            <span className="eyebrow">
              {t('ops.configuration.maps.provider')}
            </span>
            <strong>
              {mapsProviderLabel(
                mapsProviderConfiguration?.provider ?? mapsForm.provider
              )}
            </strong>
          </div>
          <div>
            <span className="eyebrow">
              {t('ops.configuration.maps.keyPreview')}
            </span>
            <strong>
              {mapsProviderConfiguration?.google_maps.api_key_preview ??
                t('ops.configuration.maps.notStored')}
            </strong>
          </div>
          <div>
            <span className="eyebrow">
              {t('ops.configuration.maps.runtime')}
            </span>
            <strong>{mapsRuntimeMessage}</strong>
          </div>
        </div>

        <div className="field-grid">
          <label className="field-stack">
            <span>{t('ops.configuration.fields.mapsProvider')}</span>
            <select
              aria-label={t('ops.configuration.fields.mapsProvider')}
              onChange={(event) =>
                setMapsForm((current) => ({
                  ...current,
                  provider: event.target.value,
                }))
              }
              value={mapsForm.provider}
            >
              <option value="google_maps">
                {t('ops.configuration.maps.providerGoogleMaps')}
              </option>
              <option value="demo">
                {t('ops.configuration.maps.providerDemo')}
              </option>
            </select>
          </label>
          <label className="field-stack">
            <span>{t('ops.configuration.fields.googleMapsApiKey')}</span>
            <input
              aria-label={t('ops.configuration.fields.googleMapsApiKey')}
              autoComplete="off"
              onChange={(event) => setMapsApiKey(event.target.value)}
              placeholder={t('ops.configuration.maps.apiKeyPlaceholder')}
              type="password"
              value={mapsApiKey}
            />
          </label>
          <label className="field-stack">
            <span>{t('ops.configuration.fields.googleMapsRegion')}</span>
            <input
              aria-label={t('ops.configuration.fields.googleMapsRegion')}
              onChange={(event) =>
                setMapsForm((current) => ({
                  ...current,
                  region: event.target.value,
                }))
              }
              value={mapsForm.region}
            />
          </label>
          <label className="field-stack">
            <span>{t('ops.configuration.fields.locationBias')}</span>
            <input
              aria-label={t('ops.configuration.fields.googleMapsLocationBias')}
              onChange={(event) =>
                setMapsForm((current) => ({
                  ...current,
                  location_bias: event.target.value,
                }))
              }
              value={mapsForm.location_bias}
            />
          </label>
          <label className="field-stack">
            <span>{t('ops.configuration.fields.timeoutSeconds')}</span>
            <input
              aria-label={t(
                'ops.configuration.fields.googleMapsTimeoutSeconds'
              )}
              onChange={(event) =>
                setMapsForm((current) => ({
                  ...current,
                  timeout_seconds: event.target.value,
                }))
              }
              value={mapsForm.timeout_seconds}
            />
          </label>
          <label className="checkbox-row">
            <input
              aria-label={t('ops.configuration.fields.googleMapsFallback')}
              checked={mapsForm.fallback_to_demo}
              onChange={(event) =>
                setMapsForm((current) => ({
                  ...current,
                  fallback_to_demo: event.target.checked,
                }))
              }
              type="checkbox"
            />
            <span>{t('ops.configuration.maps.useDemoFallback')}</span>
          </label>
          <label className="checkbox-row">
            <input
              aria-label={t('ops.configuration.fields.clearStoredMapsKey')}
              checked={mapsForm.clearApiKey}
              onChange={(event) =>
                setMapsForm((current) => ({
                  ...current,
                  clearApiKey: event.target.checked,
                }))
              }
              type="checkbox"
            />
            <span>{t('ops.configuration.maps.clearStoredApiKey')}</span>
          </label>
        </div>

        <div className="card-actions">
          <button
            className="action-button"
            disabled={mapsMutation.isPending}
            onClick={() => mapsMutation.mutate()}
            type="button"
          >
            {t('ops.configuration.actions.saveMapsProvider')}
          </button>
        </div>
      </section>

      <div className="catalog-layout">
        <aside className="catalog-sidebar">
          <section className="catalog-panel panel">
            <span className="eyebrow">
              {t('ops.configuration.scope.eyebrow')}
            </span>
            <div className="field-stack">
              <span>{t('ops.configuration.scope.selectMerchant')}</span>
              <select
                aria-label={t(
                  'ops.configuration.scope.selectMerchantConfiguration'
                )}
                onChange={(event) =>
                  setSelectedMerchantUuid(event.target.value)
                }
                value={selectedMerchant.uuid}
              >
                {merchants.map((merchant) => (
                  <option key={merchant.uuid} value={merchant.uuid}>
                    {merchant.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-stack">
              <span>{t('ops.configuration.scope.selectBranch')}</span>
              <select
                aria-label={t(
                  'ops.configuration.scope.selectBranchConfiguration'
                )}
                onChange={(event) => setSelectedBranchUuid(event.target.value)}
                value={selectedBranch.uuid}
              >
                {selectedMerchant.branches.map((branch) => (
                  <option key={branch.uuid} value={branch.uuid}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="catalog-summary">
              <div className="summary-pairs">
                <div>
                  <span className="eyebrow">
                    {t('ops.configuration.fields.merchantStatus')}
                  </span>
                  <strong>{statusLabel(selectedMerchant.status)}</strong>
                </div>
                <div>
                  <span className="eyebrow">
                    {t('ops.configuration.scope.commission')}
                  </span>
                  <strong>
                    {(selectedMerchant.platform_commission_bps / 100).toFixed(
                      2
                    )}
                    %
                  </strong>
                </div>
                <div>
                  <span className="eyebrow">
                    {t('ops.configuration.fields.branchStatus')}
                  </span>
                  <strong>{statusLabel(selectedBranch.status)}</strong>
                </div>
                <div>
                  <span className="eyebrow">
                    {t('ops.configuration.scope.acceptingOrders')}
                  </span>
                  <strong>
                    {selectedBranch.accepts_orders
                      ? t('ops.configuration.values.yes')
                      : t('ops.configuration.values.no')}
                  </strong>
                </div>
              </div>
            </div>
          </section>

          <section className="catalog-panel panel">
            <span className="eyebrow">
              {t('ops.configuration.rules.currentRules')}
            </span>
            <p>
              {t('ops.configuration.rules.currentRulesText', {
                zones: tp(
                  'ops.configuration.counts.activeZoneEntries',
                  selectedBranch.service_zones.length
                ),
                bands: tp(
                  'ops.configuration.counts.feeBands',
                  selectedBranch.fee_bands.length
                ),
              })}
            </p>
          </section>
        </aside>

        <div className="catalog-detail">
          <section className="catalog-panel panel">
            <div className="board-header">
              <div>
                <span className="eyebrow">
                  {t('ops.configuration.merchant.eyebrow')}
                </span>
                <h3>
                  {t('ops.configuration.merchant.financeDefaultsFor', {
                    merchant: selectedMerchant.name,
                  })}
                </h3>
              </div>
              <span className="status-pill">{selectedMerchant.slug}</span>
            </div>

            <div className="field-grid">
              <label className="field-stack">
                <span>{t('ops.configuration.fields.merchantStatus')}</span>
                <select
                  aria-label={t(
                    'ops.configuration.fields.merchantConfigurationStatus'
                  )}
                  onChange={(event) => setMerchantStatus(event.target.value)}
                  value={merchantStatus}
                >
                  <option value="active">
                    {t('ops.configuration.values.active')}
                  </option>
                  <option value="inactive">
                    {t('ops.configuration.values.inactive')}
                  </option>
                </select>
              </label>
              <label className="field-stack">
                <span>
                  {t('ops.configuration.fields.platformCommissionBps')}
                </span>
                <input
                  aria-label={t(
                    'ops.configuration.fields.merchantPlatformCommissionBps'
                  )}
                  onChange={(event) => setCommissionBps(event.target.value)}
                  value={commissionBps}
                />
              </label>
            </div>

            <div className="card-actions">
              <button
                className="action-button"
                onClick={() => merchantMutation.mutate()}
                type="button"
              >
                {t('ops.configuration.actions.saveMerchant')}
              </button>
            </div>
          </section>

          <section className="catalog-panel panel">
            <div className="board-header">
              <div>
                <span className="eyebrow">
                  {t('ops.configuration.branch.eyebrow')}
                </span>
                <h3>{selectedBranch.name}</h3>
              </div>
              <span
                className="status-pill"
                data-tone={selectedBranch.accepts_orders ? 'success' : 'alert'}
              >
                {selectedBranch.accepts_orders
                  ? t('ops.configuration.values.acceptingOrders')
                  : t('ops.configuration.values.paused')}
              </span>
            </div>

            <div className="field-grid">
              <label className="field-stack">
                <span>{t('ops.configuration.fields.branchStatus')}</span>
                <select
                  aria-label={t(
                    'ops.configuration.fields.branchConfigurationStatus'
                  )}
                  onChange={(event) => setBranchStatus(event.target.value)}
                  value={branchStatus}
                >
                  <option value="active">
                    {t('ops.configuration.values.active')}
                  </option>
                  <option value="inactive">
                    {t('ops.configuration.values.inactive')}
                  </option>
                </select>
              </label>
              <label className="checkbox-row">
                <input
                  aria-label={t('ops.configuration.fields.branchAcceptsOrders')}
                  checked={branchAcceptsOrders}
                  onChange={(event) =>
                    setBranchAcceptsOrders(event.target.checked)
                  }
                  type="checkbox"
                />
                <span>{t('ops.configuration.branch.acceptOrders')}</span>
              </label>
            </div>

            <div className="card-actions">
              <button
                className="action-button"
                onClick={() => branchMutation.mutate()}
                type="button"
              >
                {t('ops.configuration.actions.saveBranch')}
              </button>
            </div>
          </section>

          <section className="catalog-panel panel">
            <div className="board-header">
              <div>
                <span className="eyebrow">
                  {t('ops.configuration.zones.eyebrow')}
                </span>
                <h3>
                  {t('ops.configuration.zones.title', {
                    branch: selectedBranch.name,
                  })}
                </h3>
              </div>
              <span className="status-pill">
                {tp(
                  'ops.configuration.counts.zones',
                  selectedBranch.service_zones.length
                )}
              </span>
            </div>

            <div className="board-grid">
              {selectedBranch.service_zones.map((zone) => (
                <article className="board-card" key={zone.uuid}>
                  <header>
                    <div>
                      <span className="eyebrow">{zone.city}</span>
                      <h3>{zone.name}</h3>
                    </div>
                    <span
                      className="status-pill"
                      data-tone={zone.is_active ? 'success' : 'muted'}
                    >
                      {zone.is_active
                        ? t('ops.configuration.values.active')
                        : t('ops.configuration.values.inactive')}
                    </span>
                  </header>
                  <p>
                    {t('ops.configuration.zones.meters', {
                      count: formatNumber(zone.radius_meters),
                    })}
                  </p>
                  <footer className="card-actions">
                    <button
                      className="action-button secondary"
                      onClick={() =>
                        setZoneForm(
                          zoneFormFromBranch(selectedBranch, zone, defaultCity)
                        )
                      }
                      type="button"
                    >
                      {t('ops.configuration.actions.editZone')}
                    </button>
                  </footer>
                </article>
              ))}
            </div>

            <div className="field-grid">
              <label className="field-stack">
                <span>{t('ops.configuration.fields.serviceZoneName')}</span>
                <input
                  aria-label={t('ops.configuration.fields.serviceZoneName')}
                  onChange={(event) =>
                    setZoneForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  value={zoneForm.name}
                />
              </label>
              <label className="field-stack">
                <span>{t('ops.configuration.fields.serviceZoneCity')}</span>
                <input
                  aria-label={t('ops.configuration.fields.serviceZoneCity')}
                  onChange={(event) =>
                    setZoneForm((current) => ({
                      ...current,
                      city: event.target.value,
                    }))
                  }
                  value={zoneForm.city}
                />
              </label>
              <label className="field-stack">
                <span>{t('ops.configuration.fields.postalCode')}</span>
                <input
                  aria-label={t(
                    'ops.configuration.fields.serviceZonePostalCode'
                  )}
                  onChange={(event) =>
                    setZoneForm((current) => ({
                      ...current,
                      postal_code: event.target.value,
                    }))
                  }
                  value={zoneForm.postal_code}
                />
              </label>
              <label className="field-stack">
                <span>{t('ops.configuration.fields.centerLatitude')}</span>
                <input
                  aria-label={t(
                    'ops.configuration.fields.serviceZoneCenterLatitude'
                  )}
                  onChange={(event) =>
                    setZoneForm((current) => ({
                      ...current,
                      center_latitude: event.target.value,
                    }))
                  }
                  value={zoneForm.center_latitude}
                />
              </label>
              <label className="field-stack">
                <span>{t('ops.configuration.fields.centerLongitude')}</span>
                <input
                  aria-label={t(
                    'ops.configuration.fields.serviceZoneCenterLongitude'
                  )}
                  onChange={(event) =>
                    setZoneForm((current) => ({
                      ...current,
                      center_longitude: event.target.value,
                    }))
                  }
                  value={zoneForm.center_longitude}
                />
              </label>
              <label className="field-stack">
                <span>{t('ops.configuration.fields.radiusMeters')}</span>
                <input
                  aria-label={t(
                    'ops.configuration.fields.serviceZoneRadiusMeters'
                  )}
                  onChange={(event) =>
                    setZoneForm((current) => ({
                      ...current,
                      radius_meters: event.target.value,
                    }))
                  }
                  value={zoneForm.radius_meters}
                />
              </label>
              <label className="checkbox-row">
                <input
                  aria-label={t('ops.configuration.fields.serviceZoneActive')}
                  checked={zoneForm.is_active}
                  onChange={(event) =>
                    setZoneForm((current) => ({
                      ...current,
                      is_active: event.target.checked,
                    }))
                  }
                  type="checkbox"
                />
                <span>{t('ops.configuration.zones.zoneIsActive')}</span>
              </label>
            </div>

            <div className="card-actions">
              <button
                className="action-button"
                onClick={() => serviceZoneMutation.mutate()}
                type="button"
              >
                {zoneForm.uuid
                  ? t('ops.configuration.actions.saveServiceZone')
                  : t('ops.configuration.actions.createServiceZone')}
              </button>
              {zoneForm.uuid ? (
                <button
                  className="action-button secondary"
                  onClick={() =>
                    setZoneForm(
                      zoneFormFromBranch(selectedBranch, undefined, defaultCity)
                    )
                  }
                  type="button"
                >
                  {t('ops.configuration.actions.newZone')}
                </button>
              ) : null}
            </div>
          </section>

          <section className="catalog-panel panel">
            <div className="board-header">
              <div>
                <span className="eyebrow">
                  {t('ops.configuration.fees.eyebrow')}
                </span>
                <h3>{t('ops.configuration.fees.title')}</h3>
              </div>
              <span className="status-pill">
                {tp(
                  'ops.configuration.counts.bands',
                  selectedBranch.fee_bands.length
                )}
              </span>
            </div>

            <div className="board-grid">
              {selectedBranch.fee_bands.map((feeBand) => (
                <article className="board-card" key={feeBand.uuid}>
                  <header>
                    <div>
                      <span className="eyebrow">
                        {t('ops.configuration.fees.distance')}
                      </span>
                      <h3>
                        {t('ops.configuration.fees.distanceRange', {
                          min: formatNumber(feeBand.min_distance_meters),
                          max: formatNumber(feeBand.max_distance_meters),
                        })}
                      </h3>
                    </div>
                    <span className="status-pill" data-tone="warm">
                      {formatCurrency(feeBand.fee_minor)}
                    </span>
                  </header>
                  <footer className="card-actions">
                    <button
                      className="action-button secondary"
                      onClick={() =>
                        setFeeBandForm(feeBandFormFromValue(feeBand))
                      }
                      type="button"
                    >
                      {t('ops.configuration.actions.editFeeBand')}
                    </button>
                  </footer>
                </article>
              ))}
            </div>

            <div className="field-grid">
              <label className="field-stack">
                <span>{t('ops.configuration.fields.feeBandMinDistance')}</span>
                <input
                  aria-label={t(
                    'ops.configuration.fields.feeBandMinimumDistanceMeters'
                  )}
                  onChange={(event) =>
                    setFeeBandForm((current) => ({
                      ...current,
                      min_distance_meters: event.target.value,
                    }))
                  }
                  value={feeBandForm.min_distance_meters}
                />
              </label>
              <label className="field-stack">
                <span>{t('ops.configuration.fields.feeBandMaxDistance')}</span>
                <input
                  aria-label={t(
                    'ops.configuration.fields.feeBandMaximumDistanceMeters'
                  )}
                  onChange={(event) =>
                    setFeeBandForm((current) => ({
                      ...current,
                      max_distance_meters: event.target.value,
                    }))
                  }
                  value={feeBandForm.max_distance_meters}
                />
              </label>
              <label className="field-stack">
                <span>{t('ops.configuration.fields.feeAmountMinor')}</span>
                <input
                  aria-label={t('ops.configuration.fields.feeBandFeeMinor')}
                  onChange={(event) =>
                    setFeeBandForm((current) => ({
                      ...current,
                      fee_minor: event.target.value,
                    }))
                  }
                  value={feeBandForm.fee_minor}
                />
              </label>
            </div>

            <div className="card-actions">
              <button
                className="action-button"
                onClick={() => feeBandMutation.mutate()}
                type="button"
              >
                {feeBandForm.uuid
                  ? t('ops.configuration.actions.saveFeeBand')
                  : t('ops.configuration.actions.createFeeBand')}
              </button>
              {feeBandForm.uuid ? (
                <button
                  className="action-button secondary"
                  onClick={() => setFeeBandForm(feeBandFormFromValue())}
                  type="button"
                >
                  {t('ops.configuration.actions.newFeeBand')}
                </button>
              ) : null}
            </div>
          </section>
        </div>
      </div>

      {feedback ? (
        <p aria-live="polite" className="inline-feedback" role="status">
          {feedback}
        </p>
      ) : null}
    </section>
  );
}
