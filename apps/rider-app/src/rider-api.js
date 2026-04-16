import {
  actorNotificationQuerySchema,
  deliveryProofSchema,
  navigationHandoffSchema,
  notificationDeliverySchema,
  notificationInboxMetaSchema,
  routeEstimateSchema,
  riderAvailabilitySchema,
  riderEarningsReportQuerySchema,
  riderEarningsReportSchema,
  riderOrderSchema,
} from '@talabix/shared/validation/schemas';
import {
  buildGoogleMapsDirectionsUrl,
  createDemoMapsProvider,
} from '@talabix/shared/maps/provider';
import {
  riderSeedAvailability,
  riderSeedEarningsReport,
  riderSeedNotifications,
  riderSeedOrder,
} from './mock-data';

const mapsProvider = createDemoMapsProvider();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createInitialState() {
  return {
    availability: riderSeedAvailability,
    currentOrder: clone(riderSeedOrder),
    earningsReport: clone(riderSeedEarningsReport),
    notifications: clone(riderSeedNotifications),
    orders: [clone(riderSeedOrder)],
  };
}

let state = createInitialState();

export function resetRiderApiState() {
  state = createInitialState();
}

function nowIso() {
  return new Date().toISOString();
}

function compactQuery(query = {}) {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== '')
  );
}

function currentOrderIsActive(order) {
  return Boolean(order && ['assigned', 'picked_up'].includes(order.status));
}

function riderActionsFor(order) {
  if (!order) {
    return [];
  }

  if (order.status === 'assigned') {
    return order.delivery_assignment?.accepted_at ? ['confirm_pickup'] : ['accept_assignment'];
  }

  if (order.status === 'picked_up') {
    return ['complete_delivery'];
  }

  return [];
}

function parseRiderOrder(order) {
  if (!order) {
    return null;
  }

  return riderOrderSchema.parse({
    ...order,
    item_count:
      order.item_count ??
      order.items.reduce((count, item) => count + Number(item.quantity ?? 0), 0),
    rider_actions: riderActionsFor(order),
  });
}

function parseRiderEarningsReport(report) {
  return riderEarningsReportSchema.parse({
    ...report,
    rider: {
      ...report.rider,
      availability: state.availability,
    },
  });
}

function syncOrder(nextOrder) {
  const parsedOrder = parseRiderOrder(nextOrder);

  state.currentOrder = parsedOrder;
  state.orders = [parsedOrder, ...state.orders.filter((order) => order.uuid !== parsedOrder.uuid)];

  return parsedOrder;
}

function lookupOrder(orderUuid) {
  if (state.currentOrder?.uuid === orderUuid) {
    return state.currentOrder;
  }

  return state.orders.find((order) => order.uuid === orderUuid) ?? null;
}

function patchCurrentOrder(updater) {
  const currentOrder = state.currentOrder;

  if (!currentOrder) {
    throw new Error('No rider order is currently active.');
  }

  return syncOrder(updater(clone(currentOrder)));
}

function appendTimeline(order, event) {
  order.timeline = [
    ...order.timeline,
    {
      actor_role: 'rider',
      metadata: null,
      ...event,
    },
  ];
}

function dropoffLabel(order) {
  if (!order?.delivery_address_snapshot) {
    return 'Waiting for dispatch coordinates';
  }

  const address = order.delivery_address_snapshot;

  return [address.line_1, address.building, address.city].filter(Boolean).join(' - ');
}

function nextActionLabel(order) {
  const [nextAction] = riderActionsFor(order);

  switch (nextAction) {
    case 'accept_assignment':
      return 'Accept assignment';
    case 'confirm_pickup':
      return 'Confirm pickup';
    case 'complete_delivery':
      return 'Complete delivery';
    default:
      return 'Awaiting dispatch';
  }
}

function riderOriginFor(order) {
  if (order?.pickup_branch_snapshot?.latitude && order?.pickup_branch_snapshot?.longitude) {
    return {
      latitude: order.pickup_branch_snapshot.latitude - 0.01,
      longitude: order.pickup_branch_snapshot.longitude - 0.008,
    };
  }

  return {
    latitude: 24.705,
    longitude: 46.67,
  };
}

export async function getRiderOverview() {
  const order = parseRiderOrder(state.currentOrder);

  return {
    availability: riderAvailabilitySchema.parse(state.availability),
    orderUuid: order?.uuid ?? null,
    pickupBranch: order?.branch_name ?? 'Dispatch queue',
    dropoffArea: dropoffLabel(order),
    customerName: order?.customer_name ?? 'No assigned customer',
    proofCaptureMode: order?.delivery_assignment?.proof_metadata?.proof_type ?? 'recipient_confirmation',
    activeStops: currentOrderIsActive(order) ? 1 : 0,
    assignmentStatus: order?.delivery_assignment?.accepted_at ? 'accepted' : order?.status ?? 'idle',
    nextActionLabel: nextActionLabel(order),
  };
}

export async function updateRiderAvailability(nextAvailability) {
  state.availability = riderAvailabilitySchema.parse(nextAvailability);

  return getRiderOverview();
}

export async function getCurrentAssignments() {
  if (!currentOrderIsActive(state.currentOrder)) {
    return [];
  }

  return [parseRiderOrder(state.currentOrder)];
}

export async function getRiderNotifications(query = {}) {
  const parsedQuery = actorNotificationQuerySchema.parse(compactQuery(query));

  const data = state.notifications
    .filter((entry) => (parsedQuery.order_uuid ? entry.order_uuid === parsedQuery.order_uuid : true))
    .filter((entry) => (parsedQuery.unread_only ? !entry.read_at : true))
    .sort((left, right) => new Date(right.created_at ?? 0) - new Date(left.created_at ?? 0))
    .map((entry) => notificationDeliverySchema.parse(entry));

  return {
    data,
    meta: notificationInboxMetaSchema.parse({
      total: data.length,
      unread_count: data.filter((entry) => !entry.read_at).length,
    }),
  };
}

export async function getRiderEarningsReport(query = {}) {
  riderEarningsReportQuerySchema.parse(compactQuery(query));

  return parseRiderEarningsReport(state.earningsReport);
}

export async function markRiderNotificationRead(notificationId) {
  state.notifications = state.notifications.map((entry) =>
    entry.id === notificationId
      ? {
          ...entry,
          read_at: entry.read_at ?? new Date().toISOString(),
        }
      : entry
  );

  const notification = state.notifications.find((entry) => entry.id === notificationId);

  if (!notification) {
    throw new Error('Notification not found for this rider.');
  }

  return notificationDeliverySchema.parse(notification);
}

export async function getCurrentRiderOrder() {
  return parseRiderOrder(state.currentOrder);
}

export async function getRiderNavigationPlan(orderUuid) {
  const order = lookupOrder(orderUuid ?? state.currentOrder?.uuid);

  if (!order) {
    throw new Error('Navigation plan is not available without an active order.');
  }

  const pickupLocation = order.pickup_branch_snapshot;
  const dropoffLocation = order.delivery_address_snapshot;

  if (!pickupLocation || !dropoffLocation) {
    throw new Error('Navigation plan is missing pickup or drop-off coordinates.');
  }

  const [pickupEstimate, dropoffEstimate] = await Promise.all([
    mapsProvider.distanceEstimate(riderOriginFor(order), {
      latitude: pickupLocation.latitude,
      longitude: pickupLocation.longitude,
    }),
    mapsProvider.distanceEstimate(
      {
        latitude: pickupLocation.latitude,
        longitude: pickupLocation.longitude,
      },
      {
        latitude: dropoffLocation.latitude,
        longitude: dropoffLocation.longitude,
      }
    ),
  ]);

  return {
    pickup: {
      label: pickupLocation.label ?? order.branch_name ?? 'Pickup branch',
      address: [pickupLocation.line_1, pickupLocation.city].filter(Boolean).join(', '),
      estimate: routeEstimateSchema.parse(pickupEstimate),
      handoff: navigationHandoffSchema.parse({
        label: 'Open pickup navigation',
        url: buildGoogleMapsDirectionsUrl({
          destination: {
            latitude: pickupLocation.latitude,
            longitude: pickupLocation.longitude,
          },
        }),
        mode: 'driving',
        provider: 'google_maps',
      }),
    },
    dropoff: {
      label: dropoffLocation.label ?? order.customer_name ?? 'Drop-off',
      address: [dropoffLocation.line_1, dropoffLocation.building, dropoffLocation.city]
        .filter(Boolean)
        .join(', '),
      estimate: routeEstimateSchema.parse(dropoffEstimate),
      handoff: navigationHandoffSchema.parse({
        label: 'Open drop-off navigation',
        url: buildGoogleMapsDirectionsUrl({
          origin: {
            latitude: pickupLocation.latitude,
            longitude: pickupLocation.longitude,
          },
          destination: {
            latitude: dropoffLocation.latitude,
            longitude: dropoffLocation.longitude,
          },
        }),
        mode: 'driving',
        provider: 'google_maps',
      }),
    },
  };
}

export async function getRiderOrder(orderUuid) {
  const order = lookupOrder(orderUuid);

  if (!order) {
    throw new Error('Order not found for this rider.');
  }

  return parseRiderOrder(order);
}

export async function acceptRiderAssignment(orderUuid) {
  return patchCurrentOrder((order) => {
    if (order.uuid !== orderUuid) {
      throw new Error('Assignment not found.');
    }

    if (order.status !== 'assigned') {
      throw new Error('Only assigned orders can be accepted.');
    }

    if (order.delivery_assignment?.accepted_at) {
      throw new Error('Assignment already accepted.');
    }

    order.delivery_assignment = {
      ...order.delivery_assignment,
      accepted_at: nowIso(),
    };

    return order;
  });
}

export async function confirmRiderPickup(orderUuid) {
  return patchCurrentOrder((order) => {
    if (order.uuid !== orderUuid) {
      throw new Error('Assignment not found.');
    }

    if (order.status !== 'assigned') {
      throw new Error('Only assigned orders can be marked as picked up.');
    }

    if (!order.delivery_assignment?.accepted_at) {
      throw new Error('Accept the assignment before confirming pickup.');
    }

    const timestamp = nowIso();

    order.status = 'picked_up';
    order.delivery_assignment = {
      ...order.delivery_assignment,
      status: 'picked_up',
      picked_up_at: timestamp,
    };
    appendTimeline(order, {
      event_type: 'picked_up',
      from_status: 'assigned',
      to_status: 'picked_up',
      created_at: timestamp,
    });

    return order;
  });
}

export async function completeRiderDelivery(orderUuid, payload) {
  const parsedProof = deliveryProofSchema.parse(payload);

  return patchCurrentOrder((order) => {
    if (order.uuid !== orderUuid) {
      throw new Error('Order not found.');
    }

    if (order.status !== 'picked_up') {
      throw new Error('Pick up the order before completing delivery.');
    }

    const timestamp = nowIso();

    order.status = 'delivered';
    order.payment_status = 'collected_cod';
    order.delivered_at = timestamp;
    order.delivery_assignment = {
      ...order.delivery_assignment,
      status: 'completed',
      delivered_at: timestamp,
      proof_captured_at: timestamp,
      proof_metadata: parsedProof,
    };
    appendTimeline(order, {
      event_type: 'delivered',
      from_status: 'picked_up',
      to_status: 'delivered',
      metadata: {
        proof_type: parsedProof.proof_type,
        recipient_name: parsedProof.recipient_name ?? null,
      },
      created_at: timestamp,
    });
    appendEarningForOrder(order, timestamp);

    return order;
  });
}

function appendEarningForOrder(order, timestamp) {
  const alreadyRecorded = state.earningsReport.orders.some(
    (entry) => entry.order_uuid === order.uuid
  );

  if (alreadyRecorded) {
    return;
  }

  const earningMinor = order.rider_earning_minor ?? 0;
  const date = timestamp.slice(0, 10);

  state.earningsReport.orders = [
    {
      order_uuid: order.uuid,
      merchant_name: order.merchant_name ?? 'Talabix merchant',
      branch_name: order.branch_name ?? 'Assigned branch',
      delivered_at: timestamp,
      occurred_at: timestamp,
      earning_minor: earningMinor,
      currency: order.currency ?? 'SAR',
    },
    ...state.earningsReport.orders,
  ];
  state.earningsReport.daily_earnings = state.earningsReport.daily_earnings.map((point) =>
    point.date === date
      ? {
          ...point,
          deliveries_count: point.deliveries_count + 1,
          earnings_minor: point.earnings_minor + earningMinor,
        }
      : point
  );
  state.earningsReport.summary = {
    ...state.earningsReport.summary,
    deliveries_count: state.earningsReport.summary.deliveries_count + 1,
    earnings_minor: state.earningsReport.summary.earnings_minor + earningMinor,
    average_per_delivery_minor: Math.round(
      (state.earningsReport.summary.earnings_minor + earningMinor) /
        (state.earningsReport.summary.deliveries_count + 1)
    ),
  };
}
