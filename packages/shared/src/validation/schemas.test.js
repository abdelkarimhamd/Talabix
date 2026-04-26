import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deliveryExceptionSchema,
  dispatchAssignmentSchema,
  mapsProviderConfigurationSchema,
  updateMapsProviderConfigurationSchema,
} from './schemas.js';

const exceptionSla = {
  level: 'breached',
  label: 'Exception response breached',
  target_minutes: 10,
  elapsed_minutes: 15,
  minutes_remaining: -5,
  escalation_action: 'support_reassignment_required',
};

test('delivery exceptions preserve response SLA timeout snapshots', () => {
  const parsed = deliveryExceptionSchema.parse({
    reason_code: 'address_issue',
    reason_label: 'Address issue',
    note: 'Rider is waiting by the side entrance.',
    reported_at: '2026-04-19T12:00:00Z',
    reported_by: 'rider',
    response_sla: exceptionSla,
  });

  assert.equal(parsed.response_sla.level, 'breached');
  assert.equal(parsed.response_sla.target_minutes, 10);
  assert.equal(
    parsed.response_sla.escalation_action,
    'support_reassignment_required'
  );
});

test('dispatch assignments accept exception response SLA snapshots', () => {
  const parsed = dispatchAssignmentSchema.parse({
    orderUuid: '3bdb4618-3d6c-4736-b94f-c7e17f0ff972',
    orderStatus: 'picked_up',
    zone: 'Central Riyadh',
    riderUuid: '9da24492-7fd6-41dd-8f0b-24099f084001',
    riderName: 'Yousef Al-Anzi',
    riderAvailability: 'available',
    assignmentStatus: 'exception_reported',
    assignmentType: 'auto',
    score: 91,
    activeLoad: 1,
    distanceBucket: '<2km',
    pickupEtaMinutes: 6,
    dropoffEtaMinutes: 15,
    riderLocation: {
      label: 'Rider live position',
      latitude: 24.7045,
      longitude: 46.664,
    },
    pickupLocation: {
      label: 'Olaya Branch',
      latitude: 24.7136,
      longitude: 46.6753,
    },
    dropoffLocation: {
      label: 'Customer drop-off',
      latitude: 24.716,
      longitude: 46.681,
    },
    exception: {
      reason_code: 'address_issue',
      reason_label: 'Address issue',
      note: 'Rider is waiting by the side entrance.',
      reported_at: '2026-04-19T12:00:00Z',
      reported_by: 'rider',
      response_sla: exceptionSla,
    },
    eligibleRiders: [],
  });

  assert.equal(parsed.exception.response_sla.elapsed_minutes, 15);
});

test('maps provider configuration masks key state and accepts key rotation input', () => {
  const parsed = mapsProviderConfigurationSchema.parse({
    provider: 'google_maps',
    google_maps: {
      api_key_configured: true,
      api_key_source: 'admin',
      api_key_preview: '••••••••1234',
      region: 'sa',
      location_bias: 'circle:50000@24.7136,46.6753',
      timeout_seconds: 2.5,
      fallback_to_demo: true,
    },
    runtime: {
      ready: true,
      fallback_active: false,
      message: 'Google Maps is ready for live traffic.',
    },
  });

  assert.equal(parsed.provider, 'google_maps');
  assert.equal(parsed.google_maps.api_key_preview, '••••••••1234');

  const update = updateMapsProviderConfigurationSchema.parse({
    provider: 'google_maps',
    google_maps_api_key: 'AIzaSyTestKey1234',
    google_maps_region: 'sa',
    google_maps_location_bias: 'circle:50000@24.7136,46.6753',
    google_maps_timeout_seconds: 2.5,
    google_maps_fallback_to_demo: true,
  });

  assert.equal(update.google_maps_api_key, 'AIzaSyTestKey1234');
});
