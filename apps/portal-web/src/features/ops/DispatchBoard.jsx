import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { startTransition, useState } from 'react';
import { useSession } from '../../use-session.js';

function buildMapBounds(assignments) {
  const allPoints = assignments.flatMap((assignment) => [
    assignment.riderLocation,
    assignment.pickupLocation,
    assignment.dropoffLocation,
  ]);
  const latitudes = allPoints.map((point) => point.latitude);
  const longitudes = allPoints.map((point) => point.longitude);
  const latitudeMin = Math.min(...latitudes);
  const latitudeMax = Math.max(...latitudes);
  const longitudeMin = Math.min(...longitudes);
  const longitudeMax = Math.max(...longitudes);

  return {
    latitudeMin,
    latitudeSpan: Math.max(0.01, latitudeMax - latitudeMin),
    longitudeMin,
    longitudeSpan: Math.max(0.01, longitudeMax - longitudeMin),
  };
}

function pointStyle(point, bounds) {
  const left =
    ((point.longitude - bounds.longitudeMin) / bounds.longitudeSpan) * 100;
  const top =
    ((bounds.latitudeMin + bounds.latitudeSpan - point.latitude) /
      bounds.latitudeSpan) *
    100;

  return {
    left: `${Math.max(6, Math.min(94, left))}%`,
    top: `${Math.max(8, Math.min(92, top))}%`,
  };
}

function shortOrderId(orderUuid) {
  return orderUuid.slice(0, 8).toUpperCase();
}

function slaTone(level) {
  if (level === 'breached') {
    return 'alert';
  }

  if (level === 'warning') {
    return 'warm';
  }

  return 'success';
}

function exceptionActionLabel(action) {
  switch (action) {
    case 'support_reassignment_required':
      return 'Support must resolve or reassign this order now.';
    case 'support_follow_up_due':
      return 'Support follow-up is due before this exception breaches.';
    case 'support_monitoring':
      return 'Support is monitoring the exception window.';
    default:
      return 'Support follow-up is required.';
  }
}

function reasonLabel(reasonCode) {
  return reasonCode
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatRelativeMinutes(value) {
  if (value === undefined || value === null) {
    return 'unknown';
  }

  return `${value} min ago`;
}

function DispatchMap({ assignments }) {
  if (assignments.length === 0) {
    return (
      <section className="dispatch-map panel">
        <div className="board-header">
          <div>
            <span className="eyebrow">Ops map</span>
            <h2>Live coverage map</h2>
          </div>
        </div>
        <p className="board-note">
          No dispatch candidates match the current zone filter.
        </p>
      </section>
    );
  }

  const bounds = buildMapBounds(assignments);

  return (
    <section className="dispatch-map panel" data-testid="dispatch-map">
      <div className="board-header">
        <div>
          <span className="eyebrow">Ops map</span>
          <h2>Live coverage map</h2>
        </div>
        <div className="dispatch-map-legend">
          <span className="legend-item rider">Rider</span>
          <span className="legend-item pickup">Pickup</span>
          <span className="legend-item dropoff">Drop-off</span>
        </div>
      </div>

      <div className="dispatch-map-canvas">
        {assignments
          .flatMap((assignment) => [
            {
              key: `${assignment.orderUuid}-rider`,
              label: `${assignment.riderName} rider position`,
              point: assignment.riderLocation,
              tone: 'rider',
            },
            {
              key: `${assignment.orderUuid}-pickup`,
              label: `${assignment.orderUuid.slice(0, 8).toUpperCase()} pickup`,
              point: assignment.pickupLocation,
              tone: 'pickup',
            },
            {
              key: `${assignment.orderUuid}-dropoff`,
              label: `${assignment.orderUuid.slice(0, 8).toUpperCase()} drop-off`,
              point: assignment.dropoffLocation,
              tone: 'dropoff',
            },
          ])
          .map((marker) => (
            <div
              aria-label={marker.label}
              className={`dispatch-marker ${marker.tone}`}
              key={marker.key}
              style={pointStyle(marker.point, bounds)}
              title={`${marker.point.label} - ${marker.label}`}
            >
              <span>{marker.point.label}</span>
            </div>
          ))}
      </div>

      <div className="dispatch-route-strip">
        {assignments.map((assignment) => (
          <div className="dispatch-route-card" key={assignment.orderUuid}>
            <span className="eyebrow">
              {shortOrderId(assignment.orderUuid)}
            </span>
            <strong>
              {assignment.pickupLocation.label} to{' '}
              {assignment.dropoffLocation.label}
            </strong>
            <span
              className="status-pill"
              data-tone={slaTone(assignment.sla?.level)}
            >
              {assignment.sla?.label ?? 'SLA pending'}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DispatchBoard() {
  const { api } = useSession();
  const queryClient = useQueryClient();
  const [zoneFilter, setZoneFilter] = useState('all');
  const [activeReassignmentOrder, setActiveReassignmentOrder] = useState(null);
  const [reassignmentForms, setReassignmentForms] = useState({});
  const [feedback, setFeedback] = useState(null);
  const { data = [] } = useQuery({
    queryKey: ['ops-dispatch'],
    queryFn: () => api.listDispatchAssignments(),
  });

  const filteredAssignments =
    zoneFilter === 'all'
      ? data
      : data.filter((assignment) => assignment.zone === zoneFilter);

  const uniqueZones = Array.from(
    new Set(data.map((assignment) => assignment.zone))
  );
  const realtime = data[0]?.realtime;
  const alertCount = filteredAssignments.filter((assignment) =>
    ['warning', 'breached'].includes(assignment.sla?.level)
  ).length;
  const exceptionCount = filteredAssignments.filter(
    (assignment) => assignment.exception
  ).length;
  const reassignmentMutation = useMutation({
    mutationFn: ({ orderUuid, payload }) =>
      api.reassignDispatchOrder(orderUuid, payload),
    onSuccess: (result, variables) => {
      const assignment = data.find(
        (entry) => entry.orderUuid === variables.orderUuid
      );
      const rider = assignment?.eligibleRiders.find(
        (candidate) => candidate.riderUuid === variables.payload.rider_uuid
      );
      const message =
        result?.message ??
        `Reassigned ${shortOrderId(variables.orderUuid)} to ${rider?.riderName ?? 'selected rider'} for ${reasonLabel(variables.payload.reason_code)}.`;

      setFeedback(message);
      setActiveReassignmentOrder(null);
      queryClient.invalidateQueries({ queryKey: ['ops-dispatch'] });
    },
  });

  function formForAssignment(assignment) {
    return (
      reassignmentForms[assignment.orderUuid] ?? {
        rider_uuid: assignment.eligibleRiders[0]?.riderUuid ?? '',
        reason_code:
          assignment.reassignment?.reasonCodes?.[0] ?? 'ops_override',
        reason_note: '',
      }
    );
  }

  function openReassignmentForm(assignment) {
    setActiveReassignmentOrder(assignment.orderUuid);
    setReassignmentForms((current) => ({
      ...current,
      [assignment.orderUuid]: formForAssignment(assignment),
    }));
  }

  function updateReassignmentForm(orderUuid, field, value) {
    setReassignmentForms((current) => ({
      ...current,
      [orderUuid]: {
        ...current[orderUuid],
        [field]: value,
      },
    }));
  }

  function submitReassignment(assignment) {
    const form = formForAssignment(assignment);

    reassignmentMutation.mutate({
      orderUuid: assignment.orderUuid,
      payload: {
        rider_uuid: form.rider_uuid,
        reason_code: form.reason_code,
        reason_note: form.reason_note || null,
      },
    });
  }

  return (
    <section className="board panel">
      <div className="board-header">
        <div>
          <span className="eyebrow">Ops dispatch</span>
          <h2>Auto-assignment with manual override</h2>
        </div>
        <span className="status-pill" data-tone="alert">
          {alertCount} SLA alerts
        </span>
        {exceptionCount > 0 ? (
          <span className="status-pill" data-tone="warm">
            {exceptionCount} delivery issues
          </span>
        ) : null}
      </div>

      {feedback ? (
        <p aria-live="polite" className="inline-feedback" role="status">
          {feedback}
        </p>
      ) : null}

      <div className="toolbar">
        <select
          aria-label="Filter dispatch board by zone"
          onChange={(event) =>
            startTransition(() => setZoneFilter(event.target.value))
          }
          value={zoneFilter}
        >
          <option value="all">all zones</option>
          {uniqueZones.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
        <button type="button">Run dispatch sweep</button>
        <button className="secondary" type="button">
          Freeze assignments
        </button>
      </div>

      {realtime ? (
        <p className="board-note">
          Realtime map updates listen on {realtime.channel} and refresh when{' '}
          {realtime.event} is broadcast.
        </p>
      ) : null}

      <DispatchMap assignments={filteredAssignments} />

      <div className="board-grid">
        {filteredAssignments.map((assignment) => (
          <article
            className={`board-card ${assignment.sla?.level === 'breached' ? 'selected' : ''}`}
            data-testid={`dispatch-assignment-${assignment.orderUuid}`}
            key={assignment.orderUuid}
          >
            <header>
              <div>
                <span className="eyebrow">Order</span>
                <h3>{shortOrderId(assignment.orderUuid)}</h3>
              </div>
              <div className="status-stack">
                <span
                  className="status-pill"
                  data-tone={slaTone(assignment.sla?.level)}
                >
                  {assignment.sla?.label ?? 'SLA pending'}
                </span>
                <span
                  className="status-pill"
                  data-tone={
                    assignment.riderAvailability === 'available'
                      ? 'success'
                      : 'alert'
                  }
                >
                  {assignment.riderAvailability}
                </span>
              </div>
            </header>

            <dl>
              <div>
                <dt>Order state</dt>
                <dd>{assignment.orderStatus ?? 'unknown'}</dd>
              </div>
              <div>
                <dt>Assignment</dt>
                <dd>
                  {assignment.assignmentType ?? 'auto'} /{' '}
                  {assignment.assignmentStatus ?? 'active'}
                </dd>
              </div>
              <div>
                <dt>Rider</dt>
                <dd>{assignment.riderName}</dd>
              </div>
              <div>
                <dt>Zone</dt>
                <dd>{assignment.zone}</dd>
              </div>
              <div>
                <dt>Distance</dt>
                <dd>{assignment.distanceBucket}</dd>
              </div>
              <div>
                <dt>Score</dt>
                <dd>{assignment.score}</dd>
              </div>
              <div>
                <dt>Pickup ETA</dt>
                <dd>{assignment.pickupEtaMinutes} min</dd>
              </div>
              <div>
                <dt>Drop-off ETA</dt>
                <dd>{assignment.dropoffEtaMinutes} min</dd>
              </div>
              <div>
                <dt>Active load</dt>
                <dd>{assignment.activeLoad}</dd>
              </div>
              <div>
                <dt>Last rider ping</dt>
                <dd>
                  {formatRelativeMinutes(assignment.riderLocationAgeMinutes)}
                </dd>
              </div>
              <div>
                <dt>SLA window</dt>
                <dd>
                  {assignment.sla?.elapsedMinutes ?? 0}/
                  {assignment.sla?.targetMinutes ?? 30} min
                </dd>
              </div>
            </dl>

            <p className="board-note">
              {assignment.pickupLocation.label} to{' '}
              {assignment.dropoffLocation.label}
              {assignment.mapsProvider ? ` via ${assignment.mapsProvider}` : ''}
            </p>

            {assignment.exception ? (
              <div className="board-note">
                <p>
                  <strong>Delivery issue</strong>{' '}
                  {assignment.exception.reason_label}:{' '}
                  {assignment.exception.note ?? 'No rider note provided.'}
                </p>
                {assignment.exception.response_sla ? (
                  <p>
                    <span
                      className="status-pill"
                      data-tone={slaTone(
                        assignment.exception.response_sla.level
                      )}
                    >
                      {assignment.exception.response_sla.label}
                    </span>{' '}
                    Response window{' '}
                    {assignment.exception.response_sla.elapsed_minutes}/
                    {assignment.exception.response_sla.target_minutes} min.{' '}
                    {exceptionActionLabel(
                      assignment.exception.response_sla.escalation_action
                    )}
                  </p>
                ) : null}
              </div>
            ) : null}

            {assignment.eligibleRiders.length > 0 ? (
              <div className="candidate-list">
                {assignment.eligibleRiders.map((candidate) => (
                  <div className="candidate-row" key={candidate.riderUuid}>
                    <strong>Reassign to {candidate.riderName}</strong>
                    <span>
                      {candidate.pickupEtaMinutes} min pickup, score{' '}
                      {candidate.score}, load {candidate.activeLoad}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="board-note">
                No eligible backup rider is currently available.
              </p>
            )}

            {activeReassignmentOrder === assignment.orderUuid ? (
              <div className="reassignment-form">
                <label className="field-stack">
                  <span>New rider</span>
                  <select
                    onChange={(event) =>
                      updateReassignmentForm(
                        assignment.orderUuid,
                        'rider_uuid',
                        event.target.value
                      )
                    }
                    value={formForAssignment(assignment).rider_uuid}
                  >
                    {assignment.eligibleRiders.map((candidate) => (
                      <option
                        key={candidate.riderUuid}
                        value={candidate.riderUuid}
                      >
                        {candidate.riderName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field-stack">
                  <span>Reassignment reason</span>
                  <select
                    onChange={(event) =>
                      updateReassignmentForm(
                        assignment.orderUuid,
                        'reason_code',
                        event.target.value
                      )
                    }
                    value={formForAssignment(assignment).reason_code}
                  >
                    {(
                      assignment.reassignment?.reasonCodes ?? ['ops_override']
                    ).map((reasonCode) => (
                      <option key={reasonCode} value={reasonCode}>
                        {reasonLabel(reasonCode)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field-stack">
                  <span>Reassignment note</span>
                  <textarea
                    onChange={(event) =>
                      updateReassignmentForm(
                        assignment.orderUuid,
                        'reason_note',
                        event.target.value
                      )
                    }
                    value={formForAssignment(assignment).reason_note}
                  />
                </label>
                <button
                  className="action-button"
                  disabled={
                    !formForAssignment(assignment).rider_uuid ||
                    reassignmentMutation.isPending
                  }
                  onClick={() => submitReassignment(assignment)}
                  type="button"
                >
                  Confirm reassignment
                </button>
              </div>
            ) : null}

            <footer className="card-actions">
              <button
                className="action-button"
                disabled={
                  !assignment.reassignment?.canReassign ||
                  assignment.eligibleRiders.length === 0
                }
                onClick={() => openReassignmentForm(assignment)}
                type="button"
              >
                Manual reassign
              </button>
              <button className="action-button secondary" type="button">
                Open order detail
              </button>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
