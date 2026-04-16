import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../use-session.js';

function zoneFormFromBranch(branch, zone) {
  return {
    uuid: zone?.uuid ?? '',
    name: zone?.name ?? '',
    city: zone?.city ?? branch?.city ?? 'Riyadh',
    postal_code: zone?.postal_code ?? '',
    center_latitude: String(zone?.center_latitude ?? branch?.latitude ?? 24.7136),
    center_longitude: String(zone?.center_longitude ?? branch?.longitude ?? 46.6753),
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
  const [feedback, setFeedback] = useState('');

  const { data: merchants = [] } = useQuery({
    queryKey: ['ops-configuration'],
    queryFn: () => api.listMerchantConfigurations(),
  });

  const selectedMerchant = merchants.find((merchant) => merchant.uuid === selectedMerchantUuid) ?? merchants[0];
  const selectedBranch =
    selectedMerchant?.branches.find((branch) => branch.uuid === selectedBranchUuid)
    ?? selectedMerchant?.branches[0]
    ?? null;

  useEffect(() => {
    if (!selectedMerchantUuid && merchants[0]) {
      setSelectedMerchantUuid(merchants[0].uuid);
    }
  }, [merchants, selectedMerchantUuid]);

  useEffect(() => {
    if (selectedMerchant && selectedMerchant.uuid !== selectedMerchantUuid) {
      setSelectedMerchantUuid(selectedMerchant.uuid);
    }

    if (selectedMerchant?.branches.length) {
      const branchStillExists = selectedMerchant.branches.some((branch) => branch.uuid === selectedBranchUuid);

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

  const merchantMutation = useMutation({
    mutationFn: () =>
      api.updateMerchantConfiguration(selectedMerchant.uuid, {
        status: merchantStatus,
        platform_commission_bps: Number(commissionBps),
      }),
    onSuccess: (merchant) => {
      queryClient.invalidateQueries({ queryKey: ['ops-configuration'] });
      setFeedback(`${merchant.name} commission saved at ${(merchant.platform_commission_bps / 100).toFixed(2)}%.`);
    },
    onError: (error) => {
      setFeedback(error.message ?? 'Merchant configuration could not be saved.');
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
      setFeedback(`Fee band ${feeBand.min_distance_meters}-${feeBand.max_distance_meters} meters saved.`);
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
        <p>Create merchants and branches before configuring zones, fees, and commission rules.</p>
      </section>
    );
  }

  return (
    <section className="board panel">
      <div className="board-header">
        <div>
          <span className="eyebrow">Ops configuration</span>
          <h2>Control commissions, branch order-taking, service zones, and fees</h2>
        </div>
        <span className="status-pill" data-tone="info">
          {merchants.length} merchants
        </span>
      </div>

      <div className="catalog-layout">
        <aside className="catalog-sidebar">
          <section className="catalog-panel panel">
            <span className="eyebrow">Scope</span>
            <div className="field-stack">
              <span>Select merchant</span>
              <select
                aria-label="Select merchant configuration"
                onChange={(event) => setSelectedMerchantUuid(event.target.value)}
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
                  <strong>{(selectedMerchant.platform_commission_bps / 100).toFixed(2)}%</strong>
                </div>
                <div>
                  <span className="eyebrow">Branch status</span>
                  <strong>{selectedBranch.status}</strong>
                </div>
                <div>
                  <span className="eyebrow">Accepting orders</span>
                  <strong>{selectedBranch.accepts_orders ? 'Yes' : 'No'}</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="catalog-panel panel">
            <span className="eyebrow">Current rules</span>
            <p>{selectedBranch.service_zones.length} active zone entries and {selectedBranch.fee_bands.length} fee bands shape this branch’s delivery coverage.</p>
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
              <span className="status-pill" data-tone={selectedBranch.accepts_orders ? 'success' : 'alert'}>
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
                  onChange={(event) => setBranchAcceptsOrders(event.target.checked)}
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
              <span className="status-pill">{selectedBranch.service_zones.length} zones</span>
            </div>

            <div className="board-grid">
              {selectedBranch.service_zones.map((zone) => (
                <article className="board-card" key={zone.uuid}>
                  <header>
                    <div>
                      <span className="eyebrow">{zone.city}</span>
                      <h3>{zone.name}</h3>
                    </div>
                    <span className="status-pill" data-tone={zone.is_active ? 'success' : 'muted'}>
                      {zone.is_active ? 'active' : 'inactive'}
                    </span>
                  </header>
                  <p>{zone.radius_meters.toLocaleString()} meters</p>
                  <footer className="card-actions">
                    <button
                      className="action-button secondary"
                      onClick={() => setZoneForm(zoneFormFromBranch(selectedBranch, zone))}
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
                  onChange={(event) => setZoneForm((current) => ({ ...current, name: event.target.value }))}
                  value={zoneForm.name}
                />
              </label>
              <label className="field-stack">
                <span>Service zone city</span>
                <input
                  aria-label="Service zone city"
                  onChange={(event) => setZoneForm((current) => ({ ...current, city: event.target.value }))}
                  value={zoneForm.city}
                />
              </label>
              <label className="field-stack">
                <span>Postal code</span>
                <input
                  aria-label="Service zone postal code"
                  onChange={(event) => setZoneForm((current) => ({ ...current, postal_code: event.target.value }))}
                  value={zoneForm.postal_code}
                />
              </label>
              <label className="field-stack">
                <span>Center latitude</span>
                <input
                  aria-label="Service zone center latitude"
                  onChange={(event) => setZoneForm((current) => ({ ...current, center_latitude: event.target.value }))}
                  value={zoneForm.center_latitude}
                />
              </label>
              <label className="field-stack">
                <span>Center longitude</span>
                <input
                  aria-label="Service zone center longitude"
                  onChange={(event) => setZoneForm((current) => ({ ...current, center_longitude: event.target.value }))}
                  value={zoneForm.center_longitude}
                />
              </label>
              <label className="field-stack">
                <span>Radius meters</span>
                <input
                  aria-label="Service zone radius meters"
                  onChange={(event) => setZoneForm((current) => ({ ...current, radius_meters: event.target.value }))}
                  value={zoneForm.radius_meters}
                />
              </label>
              <label className="checkbox-row">
                <input
                  aria-label="Service zone active"
                  checked={zoneForm.is_active}
                  onChange={(event) => setZoneForm((current) => ({ ...current, is_active: event.target.checked }))}
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
                  onClick={() => setZoneForm(zoneFormFromBranch(selectedBranch))}
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
              <span className="status-pill">{selectedBranch.fee_bands.length} bands</span>
            </div>

            <div className="board-grid">
              {selectedBranch.fee_bands.map((feeBand) => (
                <article className="board-card" key={feeBand.uuid}>
                  <header>
                    <div>
                      <span className="eyebrow">Distance</span>
                      <h3>
                        {feeBand.min_distance_meters}-{feeBand.max_distance_meters}m
                      </h3>
                    </div>
                    <span className="status-pill" data-tone="warm">
                      {(feeBand.fee_minor / 100).toFixed(2)} SAR
                    </span>
                  </header>
                  <footer className="card-actions">
                    <button
                      className="action-button secondary"
                      onClick={() => setFeeBandForm(feeBandFormFromValue(feeBand))}
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
                  onChange={(event) => setFeeBandForm((current) => ({ ...current, min_distance_meters: event.target.value }))}
                  value={feeBandForm.min_distance_meters}
                />
              </label>
              <label className="field-stack">
                <span>Fee band max distance</span>
                <input
                  aria-label="Fee band maximum distance meters"
                  onChange={(event) => setFeeBandForm((current) => ({ ...current, max_distance_meters: event.target.value }))}
                  value={feeBandForm.max_distance_meters}
                />
              </label>
              <label className="field-stack">
                <span>Fee amount (minor)</span>
                <input
                  aria-label="Fee band fee minor"
                  onChange={(event) => setFeeBandForm((current) => ({ ...current, fee_minor: event.target.value }))}
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

      {feedback ? <p className="inline-feedback">{feedback}</p> : null}
    </section>
  );
}
