import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../use-session.js';

function zoneFormFromBranch(branch, zone) {
  return {
    uuid: zone?.uuid ?? '',
    name: zone?.name ?? '',
    city: zone?.city ?? branch?.city ?? 'Riyadh',
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

export function OpsConfigurationBoard() {
  const { api } = useSession();
  const queryClient = useQueryClient();
  const [selectedMerchantUuid, setSelectedMerchantUuid] = useState('');
  const [selectedBranchUuid, setSelectedBranchUuid] = useState('');
  const [merchantStatus, setMerchantStatus] = useState('active');
  const [commissionBps, setCommissionBps] = useState('1200');
  const [branchStatus, setBranchStatus] = useState('active');
  const [branchAcceptsOrders, setBranchAcceptsOrders] = useState(true);
  const [zoneForm, setZoneForm] = useState(zoneFormFromBranch());
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
  const [feedback, setFeedback] = useState('');

  const { data: merchants = [] } = useQuery({
    queryKey: ['ops-configuration'],
    queryFn: () => api.listMerchantConfigurations(),
  });

  const { data: mapsProviderConfiguration } = useQuery({
    queryKey: ['ops-maps-provider-configuration'],
    queryFn: () => api.getMapsProviderConfiguration(),
  });

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
    setZoneForm(zoneFormFromBranch(selectedBranch));
    setFeeBandForm(feeBandFormFromValue());
  }, [selectedBranch]);

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
      setFeedback('Google Maps configuration saved.');
    },
    onError: (error) => {
      setFeedback(
        error.message ?? 'Google Maps configuration could not be saved.'
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
        `${merchant.name} commission saved at ${(merchant.platform_commission_bps / 100).toFixed(2)}%.`
      );
    },
    onError: (error) => {
      setFeedback(
        error.message ?? 'Merchant configuration could not be saved.'
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
      setFeedback(`${branch.name} branch settings saved.`);
    },
    onError: (error) => {
      setFeedback(error.message ?? 'Branch configuration could not be saved.');
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
      setFeedback(`${zone.name} service zone saved.`);
      setZoneForm(zoneFormFromBranch(selectedBranch));
    },
    onError: (error) => {
      setFeedback(error.message ?? 'Service zone could not be saved.');
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
        `Fee band ${feeBand.min_distance_meters}-${feeBand.max_distance_meters} meters saved.`
      );
      setFeeBandForm(feeBandFormFromValue());
    },
    onError: (error) => {
      setFeedback(error.message ?? 'Fee band could not be saved.');
    },
  });

  if (!selectedMerchant || !selectedBranch) {
    return (
      <section className="board panel empty-state">
        <span className="eyebrow">Ops configuration</span>
        <h2>No merchant configuration loaded</h2>
        <p>
          Create merchants and branches before configuring zones, fees, and
          commission rules.
        </p>
      </section>
    );
  }

  return (
    <section className="board panel">
      <div className="board-header">
        <div>
          <span className="eyebrow">Ops configuration</span>
          <h2>
            Control commissions, branch order-taking, service zones, and fees
          </h2>
        </div>
        <span className="status-pill" data-tone="info">
          {merchants.length} merchants
        </span>
      </div>

      <section className="catalog-panel panel">
        <div className="board-header">
          <div>
            <span className="eyebrow">Maps provider</span>
            <h3>Google Maps provider</h3>
          </div>
          <span
            className="status-pill"
            data-tone={
              mapsProviderConfiguration?.runtime.ready ? 'success' : 'warning'
            }
          >
            {mapsProviderConfiguration?.google_maps.api_key_source === 'admin'
              ? 'Configured via admin'
              : mapsProviderConfiguration?.google_maps.api_key_source === 'env'
                ? 'Configured via environment'
                : 'API key not configured'}
          </span>
        </div>

        <div className="summary-pairs">
          <div>
            <span className="eyebrow">Provider</span>
            <strong>
              {mapsProviderConfiguration?.provider ?? 'google_maps'}
            </strong>
          </div>
          <div>
            <span className="eyebrow">Key preview</span>
            <strong>
              {mapsProviderConfiguration?.google_maps.api_key_preview ??
                'Not stored'}
            </strong>
          </div>
          <div>
            <span className="eyebrow">Runtime</span>
            <strong>
              {mapsProviderConfiguration?.runtime.message ??
                'Loading maps configuration.'}
            </strong>
          </div>
        </div>

        <div className="field-grid">
          <label className="field-stack">
            <span>Maps provider</span>
            <select
              aria-label="Maps provider"
              onChange={(event) =>
                setMapsForm((current) => ({
                  ...current,
                  provider: event.target.value,
                }))
              }
              value={mapsForm.provider}
            >
              <option value="google_maps">google_maps</option>
              <option value="demo">demo</option>
            </select>
          </label>
          <label className="field-stack">
            <span>Google Maps API key</span>
            <input
              aria-label="Google Maps API key"
              autoComplete="off"
              onChange={(event) => setMapsApiKey(event.target.value)}
              placeholder="Paste key when ready"
              type="password"
              value={mapsApiKey}
            />
          </label>
          <label className="field-stack">
            <span>Google Maps region</span>
            <input
              aria-label="Google Maps region"
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
            <span>Location bias</span>
            <input
              aria-label="Google Maps location bias"
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
            <span>Timeout seconds</span>
            <input
              aria-label="Google Maps timeout seconds"
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
              aria-label="Google Maps fallback to demo"
              checked={mapsForm.fallback_to_demo}
              onChange={(event) =>
                setMapsForm((current) => ({
                  ...current,
                  fallback_to_demo: event.target.checked,
                }))
              }
              type="checkbox"
            />
            <span>Use demo fallback when Google Maps fails</span>
          </label>
          <label className="checkbox-row">
            <input
              aria-label="Clear stored maps key"
              checked={mapsForm.clearApiKey}
              onChange={(event) =>
                setMapsForm((current) => ({
                  ...current,
                  clearApiKey: event.target.checked,
                }))
              }
              type="checkbox"
            />
            <span>Clear stored API key</span>
          </label>
        </div>

        <div className="card-actions">
          <button
            className="action-button"
            disabled={mapsMutation.isPending}
            onClick={() => mapsMutation.mutate()}
            type="button"
          >
            Save maps provider configuration
          </button>
        </div>
      </section>

      <div className="catalog-layout">
        <aside className="catalog-sidebar">
          <section className="catalog-panel panel">
            <span className="eyebrow">Scope</span>
            <div className="field-stack">
              <span>Select merchant</span>
              <select
                aria-label="Select merchant configuration"
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
              <span>Select branch</span>
              <select
                aria-label="Select branch configuration"
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
                  <span className="eyebrow">Merchant status</span>
                  <strong>{selectedMerchant.status}</strong>
                </div>
                <div>
                  <span className="eyebrow">Commission</span>
                  <strong>
                    {(selectedMerchant.platform_commission_bps / 100).toFixed(
                      2
                    )}
                    %
                  </strong>
                </div>
                <div>
                  <span className="eyebrow">Branch status</span>
                  <strong>{selectedBranch.status}</strong>
                </div>
                <div>
                  <span className="eyebrow">Accepting orders</span>
                  <strong>
                    {selectedBranch.accepts_orders ? 'Yes' : 'No'}
                  </strong>
                </div>
              </div>
            </div>
          </section>

          <section className="catalog-panel panel">
            <span className="eyebrow">Current rules</span>
            <p>
              {selectedBranch.service_zones.length} active zone entries and{' '}
              {selectedBranch.fee_bands.length} fee bands shape this branch’s
              delivery coverage.
            </p>
          </section>
        </aside>

        <div className="catalog-detail">
          <section className="catalog-panel panel">
            <div className="board-header">
              <div>
                <span className="eyebrow">Merchant commission</span>
                <h3>Finance defaults for {selectedMerchant.name}</h3>
              </div>
              <span className="status-pill">{selectedMerchant.slug}</span>
            </div>

            <div className="field-grid">
              <label className="field-stack">
                <span>Merchant status</span>
                <select
                  aria-label="Merchant configuration status"
                  onChange={(event) => setMerchantStatus(event.target.value)}
                  value={merchantStatus}
                >
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
              </label>
              <label className="field-stack">
                <span>Platform commission (bps)</span>
                <input
                  aria-label="Merchant platform commission bps"
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
                Save merchant configuration
              </button>
            </div>
          </section>

          <section className="catalog-panel panel">
            <div className="board-header">
              <div>
                <span className="eyebrow">Branch controls</span>
                <h3>{selectedBranch.name}</h3>
              </div>
              <span
                className="status-pill"
                data-tone={selectedBranch.accepts_orders ? 'success' : 'alert'}
              >
                {selectedBranch.accepts_orders ? 'accepting orders' : 'paused'}
              </span>
            </div>

            <div className="field-grid">
              <label className="field-stack">
                <span>Branch status</span>
                <select
                  aria-label="Branch configuration status"
                  onChange={(event) => setBranchStatus(event.target.value)}
                  value={branchStatus}
                >
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
              </label>
              <label className="checkbox-row">
                <input
                  aria-label="Branch accepts orders"
                  checked={branchAcceptsOrders}
                  onChange={(event) =>
                    setBranchAcceptsOrders(event.target.checked)
                  }
                  type="checkbox"
                />
                <span>Accept orders for this branch</span>
              </label>
            </div>

            <div className="card-actions">
              <button
                className="action-button"
                onClick={() => branchMutation.mutate()}
                type="button"
              >
                Save branch configuration
              </button>
            </div>
          </section>

          <section className="catalog-panel panel">
            <div className="board-header">
              <div>
                <span className="eyebrow">Service zones</span>
                <h3>Delivery coverage for {selectedBranch.name}</h3>
              </div>
              <span className="status-pill">
                {selectedBranch.service_zones.length} zones
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
                      {zone.is_active ? 'active' : 'inactive'}
                    </span>
                  </header>
                  <p>{zone.radius_meters.toLocaleString()} meters</p>
                  <footer className="card-actions">
                    <button
                      className="action-button secondary"
                      onClick={() =>
                        setZoneForm(zoneFormFromBranch(selectedBranch, zone))
                      }
                      type="button"
                    >
                      Edit zone
                    </button>
                  </footer>
                </article>
              ))}
            </div>

            <div className="field-grid">
              <label className="field-stack">
                <span>Service zone name</span>
                <input
                  aria-label="Service zone name"
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
                <span>Service zone city</span>
                <input
                  aria-label="Service zone city"
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
                <span>Postal code</span>
                <input
                  aria-label="Service zone postal code"
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
                <span>Center latitude</span>
                <input
                  aria-label="Service zone center latitude"
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
                <span>Center longitude</span>
                <input
                  aria-label="Service zone center longitude"
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
                <span>Radius meters</span>
                <input
                  aria-label="Service zone radius meters"
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
                  aria-label="Service zone active"
                  checked={zoneForm.is_active}
                  onChange={(event) =>
                    setZoneForm((current) => ({
                      ...current,
                      is_active: event.target.checked,
                    }))
                  }
                  type="checkbox"
                />
                <span>Zone is active</span>
              </label>
            </div>

            <div className="card-actions">
              <button
                className="action-button"
                onClick={() => serviceZoneMutation.mutate()}
                type="button"
              >
                {zoneForm.uuid ? 'Save service zone' : 'Create service zone'}
              </button>
              {zoneForm.uuid ? (
                <button
                  className="action-button secondary"
                  onClick={() =>
                    setZoneForm(zoneFormFromBranch(selectedBranch))
                  }
                  type="button"
                >
                  New zone
                </button>
              ) : null}
            </div>
          </section>

          <section className="catalog-panel panel">
            <div className="board-header">
              <div>
                <span className="eyebrow">Fee bands</span>
                <h3>Distance-based delivery pricing</h3>
              </div>
              <span className="status-pill">
                {selectedBranch.fee_bands.length} bands
              </span>
            </div>

            <div className="board-grid">
              {selectedBranch.fee_bands.map((feeBand) => (
                <article className="board-card" key={feeBand.uuid}>
                  <header>
                    <div>
                      <span className="eyebrow">Distance</span>
                      <h3>
                        {feeBand.min_distance_meters}-
                        {feeBand.max_distance_meters}m
                      </h3>
                    </div>
                    <span className="status-pill" data-tone="warm">
                      {(feeBand.fee_minor / 100).toFixed(2)} SAR
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
                      Edit fee band
                    </button>
                  </footer>
                </article>
              ))}
            </div>

            <div className="field-grid">
              <label className="field-stack">
                <span>Fee band min distance</span>
                <input
                  aria-label="Fee band minimum distance meters"
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
                <span>Fee band max distance</span>
                <input
                  aria-label="Fee band maximum distance meters"
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
                <span>Fee amount (minor)</span>
                <input
                  aria-label="Fee band fee minor"
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
                {feeBandForm.uuid ? 'Save fee band' : 'Create fee band'}
              </button>
              {feeBandForm.uuid ? (
                <button
                  className="action-button secondary"
                  onClick={() => setFeeBandForm(feeBandFormFromValue())}
                  type="button"
                >
                  New fee band
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
