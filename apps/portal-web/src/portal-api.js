import { createApiClient, createOpsApi } from '@talabix/shared/api/client';
import {
  actorNotificationQuerySchema,
  branchFeeBandInputSchema,
  branchFeeBandSchema,
  branchServiceZoneInputSchema,
  branchServiceZoneSchema,
  createMerchantInputSchema,
  createOpsUserInputSchema,
  dispatchAssignmentSchema,
  dispatchReassignmentInputSchema,
  ledgerEntrySchema,
  managedMerchantSchema,
  mapsProviderConfigurationSchema,
  merchantSalesReportQuerySchema,
  merchantSalesReportSchema,
  merchantCatalogModifierGroupInputSchema,
  merchantCatalogModifierGroupSchema,
  merchantCatalogBranchOverrideSchema,
  merchantCatalogItemInputSchema,
  merchantCatalogItemSchema,
  merchantCatalogListQuerySchema,
  merchantOrderSchema,
  notificationDeliverySchema,
  notificationInboxMetaSchema,
  opsConfigBranchSchema,
  opsDashboardOverviewSchema,
  opsDashboardQuerySchema,
  opsMerchantConfigurationSchema,
  opsNotificationQuerySchema,
  opsUserSchema,
  promotionOfferInputSchema,
  promotionOfferSchema,
  settlementAdjustmentSchema,
  settlementLedgerQuerySchema,
  cancelSupportOrderInputSchema,
  supportCaseInputSchema,
  supportCaseSchema,
  supportCaseUpdateSchema,
  supportNoteInputSchema,
  supportNoteSchema,
  supportOrderSchema,
  supportSearchQuerySchema,
  updateBranchConfigurationSchema,
  updateMapsProviderConfigurationSchema,
  updateMerchantConfigurationSchema,
  updateOpsUserInputSchema,
} from '@talabix/shared/validation/schemas';
import {
  dispatchAssignments,
  managedMerchants as seedManagedMerchants,
  merchantCatalogItems as seedMerchantCatalogItems,
  merchantOrders as seedMerchantOrders,
  notificationDeliveries as seedNotificationDeliveries,
  opsMerchantConfigurations as seedOpsMerchantConfigurations,
  opsRiders as seedOpsRiders,
  promotionOffers as seedPromotionOffers,
  reportOrders as seedReportOrders,
  settlementEntries as seedSettlementEntries,
} from './sample-data.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function merchantActionsForStatus(status) {
  switch (status) {
    case 'placed':
      return ['accept', 'reject'];
    case 'accepted':
      return ['start_preparing', 'reject'];
    case 'preparing':
      return ['mark_ready', 'reject'];
    default:
      return [];
  }
}

function createInitialState() {
  return {
    managedMerchants: clone(seedManagedMerchants).map((merchant) =>
      managedMerchantSchema.parse(merchant)
    ),
    merchantConfigurations: clone(seedOpsMerchantConfigurations).map(
      (merchant) => opsMerchantConfigurationSchema.parse(merchant)
    ),
    mapsProviderApiKey: '',
    mapsProviderConfiguration: mapsProviderConfigurationSchema.parse({
      provider: 'google_maps',
      google_maps: {
        api_key_configured: false,
        api_key_source: 'none',
        api_key_preview: null,
        region: 'sa',
        location_bias: 'circle:50000@24.7136,46.6753',
        timeout_seconds: 2.5,
        fallback_to_demo: true,
      },
      runtime: {
        ready: false,
        fallback_active: true,
        message:
          'Google Maps is selected and will use demo fallback until an API key is configured.',
      },
    }),
    merchantCatalogItems: clone(seedMerchantCatalogItems).map((item) =>
      merchantCatalogItemSchema.parse(item)
    ),
    promotionOffers: clone(seedPromotionOffers).map((offer) =>
      promotionOfferSchema.parse(offer)
    ),
    reportOrders: clone(seedReportOrders),
    merchantOrders: clone(seedMerchantOrders).map((order) =>
      supportOrderSchema.parse({
        ...order,
        merchant_actions: merchantActionsForStatus(order.status),
      })
    ),
    dispatchAssignments: clone(dispatchAssignments).map((assignment) =>
      dispatchAssignmentSchema.parse(assignment)
    ),
    opsRiders: clone(seedOpsRiders),
    settlementEntries: clone(seedSettlementEntries).map((entry) =>
      ledgerEntrySchema.parse(entry)
    ),
    notificationDeliveries: clone(seedNotificationDeliveries).map((entry) =>
      notificationDeliverySchema.parse(entry)
    ),
    opsUsers: [
      {
        uuid: '9e8ff354-b422-46a2-9d5f-e8d73a85007f',
        name: 'Huda Ops Admin',
        email: 'huda.ops@talabix.test',
        phone: '+966500000001',
        account_status: 'active',
        roles: ['ops_admin'],
        abilities: [],
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      },
      {
        uuid: '70004eaf-4112-4ceb-a3bf-5efc1ab8ad05',
        name: 'Fahad Dispatch',
        email: 'fahad.dispatch@talabix.test',
        phone: '+966500000002',
        account_status: 'active',
        roles: ['ops_dispatcher'],
        abilities: [],
        created_at: new Date().toISOString(),
        last_login_at: null,
      },
      {
        uuid: '16ff9be9-3277-44f7-baa7-73136d8b973c',
        name: 'Noura Support',
        email: 'noura.support@talabix.test',
        phone: '+966500000003',
        account_status: 'suspended',
        roles: ['ops_support'],
        abilities: [],
        created_at: new Date().toISOString(),
        last_login_at: null,
      },
    ].map((user) => opsUserSchema.parse(user)),
  };
}

let state = createInitialState();

export function resetPortalApiState() {
  state = createInitialState();
}

export function resolvePortalApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, '');
  }

  if (typeof window === 'undefined') {
    return 'http://localhost:8000/api/v1';
  }

  const basePath = import.meta.env.BASE_URL || '/';
  const normalizedBasePath = basePath.endsWith('/') ? basePath : `${basePath}/`;

  return new URL(`${normalizedBasePath}api/v1`, window.location.origin)
    .toString()
    .replace(/\/$/, '');
}

export function loginOpsAdmin(payload) {
  return createOpsApi({ baseURL: resolvePortalApiBaseUrl() }).login(payload);
}

function createUuid() {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  const segment = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);

  return `${segment()}${segment()}-${segment()}-4${segment().slice(1)}-a${segment().slice(1)}-${segment()}${segment()}${segment()}`;
}

function maskGoogleMapsKey(apiKey) {
  return `••••••••${apiKey.slice(-4)}`;
}

function buildMapsProviderRuntime(provider, apiKeyConfigured) {
  const ready = provider === 'google_maps' && apiKeyConfigured;

  return {
    ready,
    fallback_active: !ready,
    message: ready
      ? 'Google Maps is ready for live traffic.'
      : provider === 'demo'
        ? 'Demo maps provider is active.'
        : 'Google Maps is selected and will use demo fallback until an API key is configured.',
  };
}

function buildSettlementMeta(entries) {
  return {
    total_entries: entries.length,
    total_amount_minor: entries.reduce(
      (sum, entry) => sum + entry.amount_minor,
      0
    ),
    entry_type_totals: entries.reduce((totals, entry) => {
      totals[entry.entry_type] =
        (totals[entry.entry_type] ?? 0) + entry.amount_minor;
      return totals;
    }, {}),
  };
}

function resolveRangeBounds(rangeDays = 7) {
  const endsAt = new Date();
  endsAt.setHours(23, 59, 59, 999);
  const startsAt = new Date(endsAt);
  startsAt.setDate(startsAt.getDate() - (rangeDays - 1));
  startsAt.setHours(0, 0, 0, 0);

  return { startsAt, endsAt };
}

function isWithinRange(value, startsAt, endsAt) {
  const date = value ? new Date(value) : null;

  return Boolean(date && date >= startsAt && date <= endsAt);
}

function formatDateKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function createDateBuckets(startsAt, endsAt, template) {
  const buckets = {};
  const cursor = new Date(startsAt);

  while (cursor <= endsAt) {
    const key = cursor.toISOString().slice(0, 10);
    buckets[key] = {
      date: key,
      ...template,
    };
    cursor.setDate(cursor.getDate() + 1);
  }

  return buckets;
}

function filterSettlementEntries(entries, query = {}) {
  const parsedQuery = settlementLedgerQuerySchema.parse(
    Object.fromEntries(
      Object.entries(query).filter(
        ([, value]) => value !== undefined && value !== ''
      )
    )
  );

  return entries.filter((entry) => {
    if (parsedQuery.entry_type && entry.entry_type !== parsedQuery.entry_type) {
      return false;
    }

    if (parsedQuery.order_uuid && entry.order_uuid !== parsedQuery.order_uuid) {
      return false;
    }

    if (parsedQuery.direction === 'positive' && entry.amount_minor <= 0) {
      return false;
    }

    if (parsedQuery.direction === 'negative' && entry.amount_minor >= 0) {
      return false;
    }

    return true;
  });
}

function buildMerchantSalesReport(query = {}) {
  const parsedQuery = merchantSalesReportQuerySchema.parse(
    Object.fromEntries(
      Object.entries(query).filter(
        ([, value]) => value !== undefined && value !== ''
      )
    )
  );
  const { startsAt, endsAt } = resolveRangeBounds(parsedQuery.range_days ?? 7);
  const orders = state.reportOrders.filter(
    (order) =>
      order.merchant_uuid === parsedQuery.merchant_uuid &&
      isWithinRange(order.placed_at, startsAt, endsAt)
  );
  const nonCancelledOrders = orders.filter(
    (order) => order.status !== 'cancelled'
  );
  const deliveredOrders = orders.filter(
    (order) => order.status === 'delivered'
  );
  const cancelledOrders = orders.filter(
    (order) => order.status === 'cancelled'
  );
  const activeOrders = orders.filter(
    (order) => !['delivered', 'cancelled'].includes(order.status)
  );
  const dailySales = createDateBuckets(startsAt, endsAt, {
    orders_count: 0,
    delivered_orders: 0,
    gross_sales_minor: 0,
    completed_sales_minor: 0,
  });

  for (const order of orders) {
    const key = formatDateKey(order.placed_at);
    const bucket = dailySales[key];

    if (!bucket) {
      continue;
    }

    bucket.orders_count += 1;

    if (order.status === 'delivered') {
      bucket.delivered_orders += 1;
      bucket.completed_sales_minor += order.subtotal_minor;
    }

    if (order.status !== 'cancelled') {
      bucket.gross_sales_minor += order.subtotal_minor;
    }
  }

  const branchBreakdown = Object.values(
    orders.reduce((accumulator, order) => {
      const key = order.branch_uuid ?? 'unknown';
      const current = accumulator[key] ?? {
        branch_uuid: order.branch_uuid ?? null,
        branch_name: order.branch_name ?? 'Unknown branch',
        total_orders: 0,
        delivered_orders: 0,
        cancelled_orders: 0,
        gross_sales_minor: 0,
        completed_sales_minor: 0,
      };

      current.total_orders += 1;

      if (order.status === 'delivered') {
        current.delivered_orders += 1;
        current.completed_sales_minor += order.subtotal_minor;
      }

      if (order.status === 'cancelled') {
        current.cancelled_orders += 1;
      } else {
        current.gross_sales_minor += order.subtotal_minor;
      }

      accumulator[key] = current;
      return accumulator;
    }, {})
  ).sort((left, right) => right.gross_sales_minor - left.gross_sales_minor);

  const topItems = Object.values(
    nonCancelledOrders
      .flatMap((order) => order.items ?? [])
      .reduce((accumulator, item) => {
        const itemName = item.item_snapshot?.name ?? 'Unknown item';
        const current = accumulator[itemName] ?? {
          item_name: itemName,
          quantity_sold: 0,
          gross_sales_minor: 0,
        };

        current.quantity_sold += item.quantity ?? 0;
        current.gross_sales_minor += item.line_total_minor ?? 0;
        accumulator[itemName] = current;
        return accumulator;
      }, {})
  )
    .sort((left, right) => right.quantity_sold - left.quantity_sold)
    .slice(0, 5);

  const merchant = state.managedMerchants.find(
    (entry) => entry.uuid === parsedQuery.merchant_uuid
  );

  return merchantSalesReportSchema.parse({
    merchant: merchant
      ? {
          uuid: merchant.uuid,
          name: merchant.name,
          slug: merchant.slug,
          status: merchant.status,
        }
      : {
          uuid: parsedQuery.merchant_uuid,
          name: 'Unknown merchant',
          slug: 'unknown-merchant',
          status: 'inactive',
        },
    range: {
      range_days: parsedQuery.range_days ?? 7,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
    },
    summary: {
      total_orders: orders.length,
      active_orders: activeOrders.length,
      delivered_orders: deliveredOrders.length,
      cancelled_orders: cancelledOrders.length,
      gross_sales_minor: nonCancelledOrders.reduce(
        (sum, order) => sum + order.subtotal_minor,
        0
      ),
      completed_sales_minor: deliveredOrders.reduce(
        (sum, order) => sum + order.subtotal_minor,
        0
      ),
      delivery_fees_minor: nonCancelledOrders.reduce(
        (sum, order) => sum + order.delivery_fee_minor,
        0
      ),
      average_order_value_minor:
        nonCancelledOrders.length > 0
          ? Math.round(
              nonCancelledOrders.reduce(
                (sum, order) => sum + order.subtotal_minor,
                0
              ) / nonCancelledOrders.length
            )
          : 0,
      currency: orders[0]?.currency ?? 'SAR',
    },
    daily_sales: Object.values(dailySales),
    branch_breakdown: branchBreakdown,
    top_items: topItems,
  });
}

function buildOpsDashboardOverview(query = {}) {
  const parsedQuery = opsDashboardQuerySchema.parse(
    Object.fromEntries(
      Object.entries(query).filter(
        ([, value]) => value !== undefined && value !== ''
      )
    )
  );
  const { startsAt, endsAt } = resolveRangeBounds(parsedQuery.range_days ?? 7);
  const orders = state.reportOrders.filter((order) =>
    isWithinRange(order.placed_at, startsAt, endsAt)
  );
  const ledgerEntries = state.settlementEntries.filter((entry) =>
    isWithinRange(entry.occurred_at, startsAt, endsAt)
  );
  const dailyOrders = createDateBuckets(startsAt, endsAt, {
    total_orders: 0,
    delivered_orders: 0,
    cancelled_orders: 0,
    gross_sales_minor: 0,
    completed_sales_minor: 0,
  });

  for (const order of orders) {
    const key = formatDateKey(order.placed_at);
    const bucket = dailyOrders[key];

    if (!bucket) {
      continue;
    }

    bucket.total_orders += 1;

    if (order.status === 'delivered') {
      bucket.delivered_orders += 1;
      bucket.completed_sales_minor += order.subtotal_minor;
    }

    if (order.status === 'cancelled') {
      bucket.cancelled_orders += 1;
    } else {
      bucket.gross_sales_minor += order.subtotal_minor;
    }
  }

  const merchantSales = Object.values(
    orders.reduce((accumulator, order) => {
      const key = order.merchant_uuid ?? 'unknown';
      const current = accumulator[key] ?? {
        merchant_uuid: order.merchant_uuid ?? null,
        merchant_name: order.merchant_name ?? 'Unknown merchant',
        total_orders: 0,
        delivered_orders: 0,
        gross_sales_minor: 0,
        completed_sales_minor: 0,
      };

      current.total_orders += 1;

      if (order.status === 'delivered') {
        current.delivered_orders += 1;
        current.completed_sales_minor += order.subtotal_minor;
      }

      if (order.status !== 'cancelled') {
        current.gross_sales_minor += order.subtotal_minor;
      }

      accumulator[key] = current;
      return accumulator;
    }, {})
  ).sort((left, right) => right.gross_sales_minor - left.gross_sales_minor);

  const riderEntries = ledgerEntries.filter(
    (entry) => entry.entry_type === 'rider_earning'
  );
  const riderRows = Object.values(
    riderEntries.reduce((accumulator, entry) => {
      const key = String(entry.rider_profile_id ?? 'unknown');
      const current = accumulator[key] ?? {
        rider_uuid:
          state.opsRiders.find((rider) => rider.name === entry.rider_name)
            ?.uuid ?? null,
        rider_name: entry.rider_name ?? 'Unknown rider',
        deliveries_count: 0,
        earnings_minor: 0,
        average_per_delivery_minor: 0,
        order_uuids: new Set(),
      };

      current.earnings_minor += entry.amount_minor;
      if (entry.order_uuid) {
        current.order_uuids.add(entry.order_uuid);
      }

      accumulator[key] = current;
      return accumulator;
    }, {})
  )
    .map((row) => ({
      rider_uuid: row.rider_uuid,
      rider_name: row.rider_name,
      deliveries_count: row.order_uuids.size,
      earnings_minor: row.earnings_minor,
      average_per_delivery_minor:
        row.order_uuids.size > 0
          ? Math.round(row.earnings_minor / row.order_uuids.size)
          : 0,
    }))
    .sort((left, right) => right.earnings_minor - left.earnings_minor);

  const totalsByEntryType = ledgerEntries.reduce((accumulator, entry) => {
    accumulator[entry.entry_type] =
      (accumulator[entry.entry_type] ?? 0) + entry.amount_minor;
    return accumulator;
  }, {});

  return opsDashboardOverviewSchema.parse({
    range: {
      range_days: parsedQuery.range_days ?? 7,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
    },
    kpis: {
      total_orders: orders.length,
      active_orders: orders.filter(
        (order) => !['delivered', 'cancelled'].includes(order.status)
      ).length,
      delivered_orders: orders.filter((order) => order.status === 'delivered')
        .length,
      cancelled_orders: orders.filter((order) => order.status === 'cancelled')
        .length,
      gross_sales_minor: orders
        .filter((order) => order.status !== 'cancelled')
        .reduce((sum, order) => sum + order.subtotal_minor, 0),
      completed_sales_minor: orders
        .filter((order) => order.status === 'delivered')
        .reduce((sum, order) => sum + order.subtotal_minor, 0),
      delivery_fees_minor: orders
        .filter((order) => order.status !== 'cancelled')
        .reduce((sum, order) => sum + order.delivery_fee_minor, 0),
      active_merchants: state.managedMerchants.filter(
        (merchant) => merchant.status === 'active'
      ).length,
      accepting_branches: state.merchantConfigurations
        .flatMap((merchant) => merchant.branches)
        .filter((branch) => branch.status === 'active' && branch.accepts_orders)
        .length,
      available_riders: state.opsRiders.filter(
        (rider) => rider.availability === 'available'
      ).length,
      busy_riders: state.opsRiders.filter(
        (rider) => rider.availability === 'busy'
      ).length,
      offline_riders: state.opsRiders.filter((rider) =>
        ['offline', 'paused'].includes(rider.availability)
      ).length,
    },
    financials: {
      merchant_receivable_minor: totalsByEntryType.merchant_receivable ?? 0,
      platform_commission_minor: totalsByEntryType.platform_commission ?? 0,
      rider_earning_minor: totalsByEntryType.rider_earning ?? 0,
      adjustment_minor: totalsByEntryType.adjustment ?? 0,
      net_platform_minor:
        (totalsByEntryType.platform_commission ?? 0) +
        (totalsByEntryType.adjustment ?? 0),
      currency: ledgerEntries[0]?.currency ?? orders[0]?.currency ?? 'SAR',
    },
    order_status_breakdown: [
      'placed',
      'accepted',
      'preparing',
      'ready_for_pickup',
      'assigned',
      'picked_up',
      'delivered',
      'cancelled',
    ].map((status) => ({
      status,
      count: orders.filter((order) => order.status === status).length,
    })),
    daily_orders: Object.values(dailyOrders),
    merchant_sales: merchantSales,
    rider_earnings: {
      total_earnings_minor: riderRows.reduce(
        (sum, row) => sum + row.earnings_minor,
        0
      ),
      total_deliveries: riderRows.reduce(
        (sum, row) => sum + row.deliveries_count,
        0
      ),
      average_per_delivery_minor:
        riderRows.reduce((sum, row) => sum + row.deliveries_count, 0) > 0
          ? Math.round(
              riderRows.reduce((sum, row) => sum + row.earnings_minor, 0) /
                riderRows.reduce((sum, row) => sum + row.deliveries_count, 0)
            )
          : 0,
      riders: riderRows,
    },
  });
}

function transitionConfigForAction(action) {
  switch (action) {
    case 'accept':
      return {
        allowedStatuses: ['placed'],
        nextStatus: 'accepted',
        eventType: 'merchant_accepted',
      };
    case 'reject':
      return {
        allowedStatuses: ['placed', 'accepted', 'preparing'],
        nextStatus: 'cancelled',
        eventType: 'merchant_rejected',
        metadata: {
          reason: 'merchant_rejected',
        },
      };
    case 'start_preparing':
      return {
        allowedStatuses: ['accepted'],
        nextStatus: 'preparing',
        eventType: 'dispatch_started',
        metadata: {
          fulfillment_stage: 'preparing',
        },
      };
    case 'mark_ready':
      return {
        allowedStatuses: ['preparing'],
        nextStatus: 'ready_for_pickup',
        eventType: 'dispatch_started',
        metadata: {
          fulfillment_stage: 'ready_for_pickup',
        },
      };
    default:
      return null;
  }
}

function transitionMerchantOrderState(order, action) {
  const transition = transitionConfigForAction(action);

  if (!transition) {
    throw new Error('Merchant action is not supported.');
  }

  if (!transition.allowedStatuses.includes(order.status)) {
    throw new Error(`Cannot run ${action} for an order in ${order.status}.`);
  }

  const timestamp = new Date().toISOString();

  return supportOrderSchema.parse({
    ...order,
    status: transition.nextStatus,
    accepted_at:
      transition.nextStatus === 'accepted'
        ? (order.accepted_at ?? timestamp)
        : (order.accepted_at ?? null),
    merchant_actions: merchantActionsForStatus(transition.nextStatus),
    timeline: [
      ...order.timeline,
      {
        event_type: transition.eventType,
        from_status: order.status,
        to_status: transition.nextStatus,
        actor_role: 'merchant_manager',
        metadata: transition.metadata ?? null,
        created_at: timestamp,
      },
    ],
  });
}

function dispatchReasonLabel(reasonCode) {
  return reasonCode
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function searchSupportOrders(orders, query = {}) {
  const parsedQuery = supportSearchQuerySchema.parse(
    Object.fromEntries(
      Object.entries(query).filter(
        ([, value]) => value !== undefined && value !== ''
      )
    )
  );
  const term = parsedQuery.q?.toLowerCase();

  if (!term) {
    return orders;
  }

  return orders.filter((order) =>
    [
      order.uuid,
      order.customer_name,
      order.merchant_name,
      order.branch_name,
      order.support_case?.summary,
    ]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(term))
  );
}

function supportCaseOrderId(orderUuid) {
  return (
    9000 +
    state.merchantOrders.findIndex((entry) => entry.uuid === orderUuid) +
    1
  );
}

function buildSupportCase(order, payload, existingCase) {
  const timestamp = new Date().toISOString();
  const nextStatus = payload.status ?? existingCase?.status ?? 'open';
  const isResolved = nextStatus === 'resolved';

  return supportCaseSchema.parse({
    uuid: existingCase?.uuid ?? createUuid(),
    order_id: existingCase?.order_id ?? supportCaseOrderId(order.uuid),
    order_uuid: order.uuid,
    status: nextStatus,
    issue_type: payload.issue_type ?? existingCase?.issue_type ?? 'other',
    summary: payload.summary ?? existingCase?.summary ?? 'Support case',
    cancellation_reason_code:
      payload.cancellation_reason_code !== undefined
        ? payload.cancellation_reason_code
        : (existingCase?.cancellation_reason_code ?? null),
    resolution_type:
      payload.resolution_type !== undefined
        ? payload.resolution_type
        : (existingCase?.resolution_type ?? null),
    resolution_notes:
      payload.resolution_notes !== undefined
        ? payload.resolution_notes
        : (existingCase?.resolution_notes ?? null),
    opened_by_user_id: existingCase?.opened_by_user_id ?? 901,
    opened_by_name: existingCase?.opened_by_name ?? 'Huda Support',
    resolved_by_user_id: isResolved ? 901 : null,
    resolved_by_name: isResolved ? 'Huda Support' : null,
    opened_at: existingCase?.opened_at ?? timestamp,
    resolved_at: isResolved ? (existingCase?.resolved_at ?? timestamp) : null,
    created_at: existingCase?.created_at ?? timestamp,
    updated_at: timestamp,
  });
}

function listNotificationDeliveries(deliveries, query = {}) {
  const parsedQuery = opsNotificationQuerySchema.parse(
    Object.fromEntries(
      Object.entries(query).filter(
        ([, value]) => value !== undefined && value !== ''
      )
    )
  );

  return deliveries.filter((entry) => {
    if (parsedQuery.order_uuid && entry.order_uuid !== parsedQuery.order_uuid) {
      return false;
    }

    if (
      parsedQuery.recipient_actor &&
      entry.recipient_actor !== parsedQuery.recipient_actor
    ) {
      return false;
    }

    if (parsedQuery.channel && entry.channel !== parsedQuery.channel) {
      return false;
    }

    if (parsedQuery.provider && entry.provider !== parsedQuery.provider) {
      return false;
    }

    if (parsedQuery.status && entry.status !== parsedQuery.status) {
      return false;
    }

    if (
      parsedQuery.notification_type &&
      entry.notification_type !== parsedQuery.notification_type
    ) {
      return false;
    }

    return true;
  });
}

function listActorNotificationDeliveries(deliveries, actor, query = {}) {
  const parsedQuery = actorNotificationQuerySchema.parse(
    Object.fromEntries(
      Object.entries(query).filter(
        ([, value]) => value !== undefined && value !== ''
      )
    )
  );

  return deliveries.filter((entry) => {
    if (entry.recipient_actor !== actor || entry.channel !== 'in_app') {
      return false;
    }

    if (parsedQuery.order_uuid && entry.order_uuid !== parsedQuery.order_uuid) {
      return false;
    }

    if (parsedQuery.unread_only && entry.read_at) {
      return false;
    }

    return true;
  });
}

function listMerchantCatalogItems(items, query = {}) {
  const parsedQuery = merchantCatalogListQuerySchema.parse(
    Object.fromEntries(
      Object.entries(query).filter(
        ([, value]) => value !== undefined && value !== ''
      )
    )
  );

  return items
    .filter((item) => item.merchant_uuid === parsedQuery.merchant_uuid)
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name));
}

function findMerchantConfiguration(merchantUuid) {
  return state.merchantConfigurations.find(
    (merchant) => merchant.uuid === merchantUuid
  );
}

function findBranchConfiguration(branchUuid) {
  for (const merchant of state.merchantConfigurations) {
    const branch = merchant.branches.find((entry) => entry.uuid === branchUuid);

    if (branch) {
      return { merchant, branch };
    }
  }

  return null;
}

function findCatalogItem(catalogItemUuid) {
  return (
    state.merchantCatalogItems.find(
      (entry) => entry.uuid === catalogItemUuid
    ) ?? null
  );
}

function buildPromotionOffer(payload, existingOffer = {}) {
  const parsedPayload = promotionOfferInputSchema.parse(payload);
  const branchScope = findBranchConfiguration(parsedPayload.branch_uuid);

  if (!branchScope) {
    throw new Error('Branch configuration not found.');
  }

  const catalogItem = parsedPayload.catalog_item_uuid
    ? findCatalogItem(parsedPayload.catalog_item_uuid)
    : null;

  if (parsedPayload.catalog_item_uuid && !catalogItem) {
    throw new Error('Catalog item not found.');
  }

  if (catalogItem && catalogItem.merchant_uuid !== branchScope.merchant.uuid) {
    throw new Error(
      'Catalog item does not belong to the selected branch merchant.'
    );
  }

  const promoCode = String(parsedPayload.code ?? '')
    .trim()
    .toUpperCase();

  if (parsedPayload.requires_promo_code && promoCode.length === 0) {
    throw new Error('Promo-code offers need a code.');
  }

  if (
    parsedPayload.discount_type === 'item_percent' &&
    !parsedPayload.percent
  ) {
    throw new Error('Percent discounts need a percent value.');
  }

  if (
    parsedPayload.discount_type === 'item_fixed' &&
    !parsedPayload.amount_minor
  ) {
    throw new Error('Fixed discounts need an amount.');
  }

  return promotionOfferSchema.parse({
    uuid: existingOffer.uuid ?? createUuid(),
    merchant_uuid: branchScope.merchant.uuid,
    merchant_name: branchScope.merchant.name,
    branch_uuid: branchScope.branch.uuid,
    branch_name: branchScope.branch.name,
    catalog_item_uuid: catalogItem?.uuid ?? null,
    catalog_item_name: catalogItem?.name ?? null,
    code: parsedPayload.requires_promo_code ? promoCode : null,
    title: parsedPayload.title.trim(),
    discount_label: parsedPayload.discount_label.trim(),
    discount_type: parsedPayload.discount_type,
    percent:
      parsedPayload.discount_type === 'item_percent'
        ? (parsedPayload.percent ?? null)
        : null,
    amount_minor:
      parsedPayload.discount_type === 'item_fixed'
        ? (parsedPayload.amount_minor ?? null)
        : null,
    min_spend_minor: parsedPayload.min_spend_minor ?? 0,
    requires_promo_code: parsedPayload.requires_promo_code,
    is_active: parsedPayload.is_active,
    starts_at: parsedPayload.starts_at ?? null,
    expires_at: parsedPayload.expires_at ?? null,
  });
}

function updateMerchantConfigurationState(nextMerchant) {
  state.merchantConfigurations = state.merchantConfigurations.map((merchant) =>
    merchant.uuid === nextMerchant.uuid ? nextMerchant : merchant
  );
}

function createMerchantConfigurationState(payload) {
  const parsedPayload = createMerchantInputSchema.parse(payload);
  const branchUuid = createUuid();
  const nextMerchant = opsMerchantConfigurationSchema.parse({
    uuid: createUuid(),
    name: parsedPayload.name,
    slug: parsedPayload.slug,
    status: 'active',
    platform_commission_bps: parsedPayload.platform_commission_bps ?? 1200,
    branches: [
      {
        uuid: branchUuid,
        name: parsedPayload.branch.name,
        status: 'active',
        city: parsedPayload.branch.city,
        address_line: parsedPayload.branch.address_line,
        latitude: parsedPayload.branch.latitude,
        longitude: parsedPayload.branch.longitude,
        accepts_orders: true,
        service_zones: parsedPayload.branch.zones.map((zone) => ({
          uuid: createUuid(),
          name: zone.name,
          city: zone.city,
          postal_code: zone.postal_code ?? null,
          center_latitude: zone.center_latitude,
          center_longitude: zone.center_longitude,
          radius_meters: zone.radius_meters,
          is_active: true,
        })),
        fee_bands: parsedPayload.branch.fee_bands.map((feeBand) => ({
          uuid: createUuid(),
          min_distance_meters: feeBand.min_distance_meters,
          max_distance_meters: feeBand.max_distance_meters,
          fee_minor: feeBand.fee_minor,
        })),
      },
    ],
  });

  state.merchantConfigurations = [
    ...state.merchantConfigurations,
    nextMerchant,
  ];
  deriveManagedMerchants();

  return managedMerchantSchema.parse({
    uuid: nextMerchant.uuid,
    name: nextMerchant.name,
    slug: nextMerchant.slug,
    status: nextMerchant.status,
    branches: nextMerchant.branches.map((branch) => ({
      uuid: branch.uuid,
      name: branch.name,
      status: branch.status,
      city: branch.city,
      address_line: branch.address_line,
    })),
  });
}

function deriveManagedMerchants() {
  state.managedMerchants = state.merchantConfigurations.map((merchant) =>
    managedMerchantSchema.parse({
      uuid: merchant.uuid,
      name: merchant.name,
      slug: merchant.slug,
      status: merchant.status,
      branches: merchant.branches.map((branch) => ({
        uuid: branch.uuid,
        name: branch.name,
        status: branch.status,
        city: branch.city,
        address_line: branch.address_line,
      })),
    })
  );
}

function nextNotificationEntries(order, notificationType, title, body) {
  const timestamp = new Date().toISOString();
  const baseId = Math.max(
    0,
    ...state.notificationDeliveries.map((entry) => entry.id)
  );
  const templates = [
    {
      recipient_user_id: 301,
      recipient_actor: 'customer',
      recipient_name: order.customer_name,
      recipient_email: `${order.customer_name.toLowerCase().replaceAll(' ', '.')}@talabix.test`,
      channel: 'in_app',
      provider: 'internal',
      provider_reference: null,
      status: 'sent',
      attempt_count: 1,
      last_attempted_at: timestamp,
      next_retry_at: null,
      last_error: null,
      sent_at: timestamp,
    },
    ...(notificationType === 'order_status_updated'
      ? [
          {
            recipient_user_id: 301,
            recipient_actor: 'customer',
            recipient_name: order.customer_name,
            recipient_email: `${order.customer_name.toLowerCase().replaceAll(' ', '.')}@talabix.test`,
            channel: 'sms',
            provider: 'sms-log',
            provider_reference: null,
            status: 'sent',
            attempt_count: 1,
            last_attempted_at: timestamp,
            next_retry_at: null,
            last_error: null,
            sent_at: timestamp,
          },
        ]
      : []),
    {
      recipient_user_id: 701,
      recipient_actor: 'merchant',
      recipient_name: 'Demo Merchant Manager',
      recipient_email: 'merchant.manager@talabix.test',
      channel: 'in_app',
      provider: 'internal',
      provider_reference: null,
      status: 'sent',
      attempt_count: 1,
      last_attempted_at: timestamp,
      next_retry_at: null,
      last_error: null,
      sent_at: timestamp,
    },
    {
      recipient_user_id: 701,
      recipient_actor: 'merchant',
      recipient_name: 'Demo Merchant Manager',
      recipient_email: 'merchant.manager@talabix.test',
      channel: 'email',
      provider: 'mail',
      provider_reference: null,
      status: 'sent',
      attempt_count: 1,
      last_attempted_at: timestamp,
      next_retry_at: null,
      last_error: null,
      sent_at: timestamp,
    },
  ];

  return templates.map((template, index) =>
    notificationDeliverySchema.parse({
      id: baseId + index + 1,
      order_id:
        9000 +
        state.merchantOrders.findIndex((entry) => entry.uuid === order.uuid) +
        1,
      order_uuid: order.uuid,
      recipient_user_id: template.recipient_user_id,
      recipient_actor: template.recipient_actor,
      recipient_name: template.recipient_name,
      recipient_email: template.recipient_email,
      notification_type: notificationType,
      channel: template.channel,
      provider: template.provider,
      provider_reference:
        template.provider_reference ??
        (template.provider === 'mail'
          ? `mail:${baseId + index + 1}`
          : template.provider === 'sms-log'
            ? `sms-log:${baseId + index + 1}`
            : `internal:${order.uuid}`),
      status: template.status,
      attempt_count: template.attempt_count,
      title,
      body,
      payload: {
        order_uuid: order.uuid,
      },
      queued_at: timestamp,
      last_attempted_at: template.last_attempted_at,
      next_retry_at: template.next_retry_at,
      last_error: template.last_error,
      sent_at: template.sent_at,
      read_at: null,
      created_at: timestamp,
    })
  );
}

export function createPortalApi(session) {
  const baseURL = resolvePortalApiBaseUrl();
  const liveOpsApi =
    session.isAuthenticated && session.actor === 'ops'
      ? createOpsApi({ baseURL, token: session.token })
      : null;
  const client = createApiClient({
    baseURL,
    actor: session.actor,
    token: session.token,
  });

  return {
    client,
    async logout() {
      if (liveOpsApi) {
        await liveOpsApi.logout();
        return;
      }

      await client.post('auth/logout');
    },
    async changePassword(payload) {
      if (liveOpsApi) {
        return liveOpsApi.changePassword(payload);
      }

      return {
        message: 'Password updated successfully.',
      };
    },
    async listOpsUsers() {
      if (liveOpsApi) {
        return liveOpsApi.listUsers();
      }

      return state.opsUsers.map((user) => opsUserSchema.parse(user));
    },
    async createOpsUser(payload) {
      if (liveOpsApi) {
        return liveOpsApi.createUser(payload);
      }

      const parsedPayload = createOpsUserInputSchema.parse(payload);
      const nextUser = opsUserSchema.parse({
        uuid: createUuid(),
        name: parsedPayload.name,
        email: parsedPayload.email,
        phone: parsedPayload.phone ?? null,
        account_status: parsedPayload.account_status ?? 'active',
        roles: [parsedPayload.role],
        abilities: [],
        created_at: new Date().toISOString(),
        last_login_at: null,
      });

      state.opsUsers = [...state.opsUsers, nextUser].sort((left, right) =>
        left.name.localeCompare(right.name)
      );

      return nextUser;
    },
    async updateOpsUser(userUuid, payload) {
      if (liveOpsApi) {
        return liveOpsApi.updateUser(userUuid, payload);
      }

      const parsedPayload = updateOpsUserInputSchema.parse(payload);
      const existingUser = state.opsUsers.find(
        (user) => user.uuid === userUuid
      );

      if (!existingUser) {
        throw new Error('Ops user could not be found.');
      }

      const nextUser = opsUserSchema.parse({
        ...existingUser,
        name: parsedPayload.name ?? existingUser.name,
        phone:
          parsedPayload.phone === undefined
            ? existingUser.phone
            : parsedPayload.phone,
        account_status:
          parsedPayload.account_status ?? existingUser.account_status,
        roles: parsedPayload.role ? [parsedPayload.role] : existingUser.roles,
      });

      state.opsUsers = state.opsUsers
        .map((user) => (user.uuid === userUuid ? nextUser : user))
        .sort((left, right) => left.name.localeCompare(right.name));

      return nextUser;
    },
    async listManagedMerchants() {
      if (liveOpsApi) {
        return liveOpsApi.listManagedMerchants();
      }

      return state.managedMerchants.map((merchant) =>
        managedMerchantSchema.parse(merchant)
      );
    },
    async getMerchantSalesReport(query) {
      return buildMerchantSalesReport(query);
    },
    async getOpsDashboardOverview(query = {}) {
      if (liveOpsApi) {
        return liveOpsApi.getDashboardOverview(query);
      }

      return buildOpsDashboardOverview(query);
    },
    async listMerchantConfigurations() {
      if (liveOpsApi) {
        return liveOpsApi.listMerchantConfigurations();
      }

      return state.merchantConfigurations.map((merchant) =>
        opsMerchantConfigurationSchema.parse(merchant)
      );
    },
    async createMerchant(payload) {
      if (liveOpsApi) {
        return liveOpsApi.createMerchant(payload);
      }

      return createMerchantConfigurationState(payload);
    },
    async getMapsProviderConfiguration() {
      if (liveOpsApi) {
        return liveOpsApi.getMapsProviderConfiguration();
      }

      return mapsProviderConfigurationSchema.parse(
        clone(state.mapsProviderConfiguration)
      );
    },
    async updateMapsProviderConfiguration(payload) {
      if (liveOpsApi) {
        return liveOpsApi.updateMapsProviderConfiguration(payload);
      }

      const parsedPayload = updateMapsProviderConfigurationSchema.parse(
        Object.fromEntries(
          Object.entries(payload).filter(
            ([, value]) => value !== undefined && value !== ''
          )
        )
      );
      const existing = state.mapsProviderConfiguration;

      if (parsedPayload.clear_google_maps_api_key) {
        state.mapsProviderApiKey = '';
      } else if (parsedPayload.google_maps_api_key) {
        state.mapsProviderApiKey = parsedPayload.google_maps_api_key;
      }

      const apiKeyConfigured = state.mapsProviderApiKey.length > 0;
      const provider = parsedPayload.provider ?? existing.provider;

      state.mapsProviderConfiguration = mapsProviderConfigurationSchema.parse({
        provider,
        google_maps: {
          api_key_configured: apiKeyConfigured,
          api_key_source: apiKeyConfigured ? 'admin' : 'none',
          api_key_preview: apiKeyConfigured
            ? maskGoogleMapsKey(state.mapsProviderApiKey)
            : null,
          region:
            parsedPayload.google_maps_region ?? existing.google_maps.region,
          location_bias:
            parsedPayload.google_maps_location_bias === undefined
              ? (existing.google_maps.location_bias ?? null)
              : parsedPayload.google_maps_location_bias,
          timeout_seconds:
            parsedPayload.google_maps_timeout_seconds ??
            existing.google_maps.timeout_seconds,
          fallback_to_demo:
            parsedPayload.google_maps_fallback_to_demo ??
            existing.google_maps.fallback_to_demo,
        },
        runtime: buildMapsProviderRuntime(provider, apiKeyConfigured),
      });

      return mapsProviderConfigurationSchema.parse(
        clone(state.mapsProviderConfiguration)
      );
    },
    async updateMerchantConfiguration(merchantUuid, payload) {
      if (liveOpsApi) {
        return liveOpsApi.updateMerchantConfiguration(merchantUuid, payload);
      }

      const parsedPayload = updateMerchantConfigurationSchema.parse(
        Object.fromEntries(
          Object.entries(payload).filter(([, value]) => value !== undefined)
        )
      );
      const existingMerchant = findMerchantConfiguration(merchantUuid);

      if (!existingMerchant) {
        throw new Error('Merchant configuration not found.');
      }

      const nextMerchant = opsMerchantConfigurationSchema.parse({
        ...existingMerchant,
        ...parsedPayload,
      });

      updateMerchantConfigurationState(nextMerchant);
      deriveManagedMerchants();

      return nextMerchant;
    },
    async updateBranchConfiguration(branchUuid, payload) {
      if (liveOpsApi) {
        return liveOpsApi.updateBranchConfiguration(branchUuid, payload);
      }

      const parsedPayload = updateBranchConfigurationSchema.parse(
        Object.fromEntries(
          Object.entries(payload).filter(([, value]) => value !== undefined)
        )
      );
      const existingMerchant = state.merchantConfigurations.find((merchant) =>
        merchant.branches.some((branch) => branch.uuid === branchUuid)
      );

      if (!existingMerchant) {
        throw new Error('Branch configuration not found.');
      }

      const nextBranches = existingMerchant.branches.map((branch) =>
        branch.uuid === branchUuid
          ? opsConfigBranchSchema.parse({
              ...branch,
              ...parsedPayload,
            })
          : branch
      );

      const nextMerchant = opsMerchantConfigurationSchema.parse({
        ...existingMerchant,
        branches: nextBranches,
      });

      updateMerchantConfigurationState(nextMerchant);
      deriveManagedMerchants();

      return nextBranches.find((branch) => branch.uuid === branchUuid);
    },
    async createServiceZone(branchUuid, payload) {
      if (liveOpsApi) {
        return liveOpsApi.createServiceZone(branchUuid, payload);
      }

      const parsedPayload = branchServiceZoneInputSchema.parse(payload);
      const existingMerchant = state.merchantConfigurations.find((merchant) =>
        merchant.branches.some((branch) => branch.uuid === branchUuid)
      );

      if (!existingMerchant) {
        throw new Error('Branch configuration not found.');
      }

      const nextServiceZone = branchServiceZoneSchema.parse({
        uuid: createUuid(),
        ...parsedPayload,
      });

      const nextBranches = existingMerchant.branches.map((branch) =>
        branch.uuid === branchUuid
          ? opsConfigBranchSchema.parse({
              ...branch,
              service_zones: [...branch.service_zones, nextServiceZone].sort(
                (left, right) => left.name.localeCompare(right.name)
              ),
            })
          : branch
      );

      updateMerchantConfigurationState(
        opsMerchantConfigurationSchema.parse({
          ...existingMerchant,
          branches: nextBranches,
        })
      );

      return nextServiceZone;
    },
    async updateServiceZone(serviceZoneUuid, payload) {
      if (liveOpsApi) {
        return liveOpsApi.updateServiceZone(serviceZoneUuid, payload);
      }

      const parsedPayload = branchServiceZoneInputSchema.parse(payload);
      const existingMerchant = state.merchantConfigurations.find((merchant) =>
        merchant.branches.some((branch) =>
          branch.service_zones.some(
            (serviceZone) => serviceZone.uuid === serviceZoneUuid
          )
        )
      );

      if (!existingMerchant) {
        throw new Error('Service zone could not be found.');
      }

      let updatedZone = null;
      const nextBranches = existingMerchant.branches.map((branch) =>
        opsConfigBranchSchema.parse({
          ...branch,
          service_zones: branch.service_zones
            .map((serviceZone) => {
              if (serviceZone.uuid !== serviceZoneUuid) {
                return serviceZone;
              }

              updatedZone = branchServiceZoneSchema.parse({
                ...serviceZone,
                ...parsedPayload,
              });

              return updatedZone;
            })
            .sort((left, right) => left.name.localeCompare(right.name)),
        })
      );

      updateMerchantConfigurationState(
        opsMerchantConfigurationSchema.parse({
          ...existingMerchant,
          branches: nextBranches,
        })
      );

      return updatedZone;
    },
    async createFeeBand(branchUuid, payload) {
      if (liveOpsApi) {
        return liveOpsApi.createFeeBand(branchUuid, payload);
      }

      const parsedPayload = branchFeeBandInputSchema.parse(payload);
      const existingMerchant = state.merchantConfigurations.find((merchant) =>
        merchant.branches.some((branch) => branch.uuid === branchUuid)
      );

      if (!existingMerchant) {
        throw new Error('Branch configuration not found.');
      }

      const nextFeeBand = branchFeeBandSchema.parse({
        uuid: createUuid(),
        ...parsedPayload,
      });

      const nextBranches = existingMerchant.branches.map((branch) =>
        branch.uuid === branchUuid
          ? opsConfigBranchSchema.parse({
              ...branch,
              fee_bands: [...branch.fee_bands, nextFeeBand].sort(
                (left, right) =>
                  left.min_distance_meters - right.min_distance_meters
              ),
            })
          : branch
      );

      updateMerchantConfigurationState(
        opsMerchantConfigurationSchema.parse({
          ...existingMerchant,
          branches: nextBranches,
        })
      );

      return nextFeeBand;
    },
    async updateFeeBand(feeBandUuid, payload) {
      if (liveOpsApi) {
        return liveOpsApi.updateFeeBand(feeBandUuid, payload);
      }

      const parsedPayload = branchFeeBandInputSchema.parse(payload);
      const existingMerchant = state.merchantConfigurations.find((merchant) =>
        merchant.branches.some((branch) =>
          branch.fee_bands.some((feeBand) => feeBand.uuid === feeBandUuid)
        )
      );

      if (!existingMerchant) {
        throw new Error('Fee band could not be found.');
      }

      let updatedFeeBand = null;
      const nextBranches = existingMerchant.branches.map((branch) =>
        opsConfigBranchSchema.parse({
          ...branch,
          fee_bands: branch.fee_bands
            .map((feeBand) => {
              if (feeBand.uuid !== feeBandUuid) {
                return feeBand;
              }

              updatedFeeBand = branchFeeBandSchema.parse({
                ...feeBand,
                ...parsedPayload,
              });

              return updatedFeeBand;
            })
            .sort(
              (left, right) =>
                left.min_distance_meters - right.min_distance_meters
            ),
        })
      );

      updateMerchantConfigurationState(
        opsMerchantConfigurationSchema.parse({
          ...existingMerchant,
          branches: nextBranches,
        })
      );

      return updatedFeeBand;
    },
    async listPromotionOffers() {
      return state.promotionOffers
        .slice()
        .sort((left, right) => left.title.localeCompare(right.title))
        .map((offer) => promotionOfferSchema.parse(offer));
    },
    async createPromotionOffer(payload) {
      const nextOffer = buildPromotionOffer(payload);

      state.promotionOffers = [nextOffer, ...state.promotionOffers];

      return nextOffer;
    },
    async updatePromotionOffer(promotionOfferUuid, payload) {
      const existingOffer = state.promotionOffers.find(
        (entry) => entry.uuid === promotionOfferUuid
      );

      if (!existingOffer) {
        throw new Error('Promotion offer not found.');
      }

      const nextOffer = buildPromotionOffer(payload, existingOffer);
      state.promotionOffers = state.promotionOffers.map((entry) =>
        entry.uuid === promotionOfferUuid ? nextOffer : entry
      );

      return nextOffer;
    },
    async deletePromotionOffer(promotionOfferUuid) {
      const existingOffer = state.promotionOffers.find(
        (entry) => entry.uuid === promotionOfferUuid
      );

      if (!existingOffer) {
        throw new Error('Promotion offer not found.');
      }

      state.promotionOffers = state.promotionOffers.filter(
        (entry) => entry.uuid !== promotionOfferUuid
      );

      return { uuid: promotionOfferUuid };
    },
    async listCatalogItems(query = {}) {
      if (liveOpsApi) {
        return liveOpsApi.listCatalogItems(query);
      }

      return listMerchantCatalogItems(state.merchantCatalogItems, query).map(
        (item) => merchantCatalogItemSchema.parse(item)
      );
    },
    async createCatalogItem(payload) {
      if (liveOpsApi) {
        return liveOpsApi.createCatalogItem(payload);
      }

      const parsedPayload = merchantCatalogItemInputSchema.parse(payload);
      const nextItem = merchantCatalogItemSchema.parse({
        uuid: createUuid(),
        merchant_id: 301,
        merchant_uuid: parsedPayload.merchant_uuid,
        name: parsedPayload.name,
        category_name: parsedPayload.category_name ?? null,
        sku: parsedPayload.sku ?? null,
        description: parsedPayload.description ?? null,
        image_url: parsedPayload.image_url ?? null,
        base_price_minor: parsedPayload.base_price_minor,
        base_stock: parsedPayload.base_stock ?? null,
        is_active: parsedPayload.is_active,
        modifier_groups: [],
        branch_overrides: [],
      });

      state.merchantCatalogItems = [nextItem, ...state.merchantCatalogItems];

      return nextItem;
    },
    async updateCatalogItem(catalogItemUuid, payload) {
      if (liveOpsApi) {
        return liveOpsApi.updateCatalogItem(catalogItemUuid, payload);
      }

      const parsedPayload = merchantCatalogItemInputSchema.parse(payload);
      const existingItem = state.merchantCatalogItems.find(
        (entry) => entry.uuid === catalogItemUuid
      );

      if (!existingItem) {
        throw new Error('Catalog item not found.');
      }

      const nextItem = merchantCatalogItemSchema.parse({
        ...existingItem,
        merchant_uuid: parsedPayload.merchant_uuid,
        name: parsedPayload.name,
        category_name: parsedPayload.category_name ?? null,
        sku: parsedPayload.sku ?? null,
        description: parsedPayload.description ?? null,
        image_url: parsedPayload.image_url ?? null,
        base_price_minor: parsedPayload.base_price_minor,
        base_stock: parsedPayload.base_stock ?? null,
        is_active: parsedPayload.is_active,
      });

      state.merchantCatalogItems = state.merchantCatalogItems.map((entry) =>
        entry.uuid === catalogItemUuid ? nextItem : entry
      );

      return nextItem;
    },
    async createModifierGroup(catalogItemUuid, payload) {
      if (liveOpsApi) {
        return liveOpsApi.createModifierGroup(catalogItemUuid, payload);
      }

      const parsedPayload =
        merchantCatalogModifierGroupInputSchema.parse(payload);
      const existingItem = state.merchantCatalogItems.find(
        (entry) => entry.uuid === catalogItemUuid
      );

      if (!existingItem) {
        throw new Error('Catalog item not found.');
      }

      const nextGroup = merchantCatalogModifierGroupSchema.parse({
        uuid: createUuid(),
        name: parsedPayload.name,
        description: parsedPayload.description ?? null,
        selection_type: parsedPayload.selection_type,
        min_selected: parsedPayload.min_selected ?? 0,
        max_selected: parsedPayload.max_selected ?? null,
        is_active: parsedPayload.is_active ?? true,
        sort_order: parsedPayload.sort_order ?? 0,
        options: parsedPayload.options.map((option) => ({
          uuid: option.uuid ?? createUuid(),
          name: option.name,
          description: option.description ?? null,
          price_delta_minor: option.price_delta_minor,
          is_default: option.is_default ?? false,
          is_active: option.is_active ?? true,
          sort_order: option.sort_order ?? 0,
        })),
      });

      const nextItem = merchantCatalogItemSchema.parse({
        ...existingItem,
        modifier_groups: [...existingItem.modifier_groups, nextGroup].sort(
          (left, right) =>
            left.sort_order - right.sort_order ||
            left.name.localeCompare(right.name)
        ),
      });

      state.merchantCatalogItems = state.merchantCatalogItems.map((entry) =>
        entry.uuid === catalogItemUuid ? nextItem : entry
      );

      return nextGroup;
    },
    async updateModifierGroup(catalogItemUuid, modifierGroupUuid, payload) {
      if (liveOpsApi) {
        return liveOpsApi.updateModifierGroup(
          catalogItemUuid,
          modifierGroupUuid,
          payload
        );
      }

      const parsedPayload =
        merchantCatalogModifierGroupInputSchema.parse(payload);
      const existingItem = state.merchantCatalogItems.find(
        (entry) => entry.uuid === catalogItemUuid
      );

      if (!existingItem) {
        throw new Error('Catalog item not found.');
      }

      const existingGroup = existingItem.modifier_groups.find(
        (entry) => entry.uuid === modifierGroupUuid
      );

      if (!existingGroup) {
        throw new Error('Modifier group not found.');
      }

      const nextGroup = merchantCatalogModifierGroupSchema.parse({
        ...existingGroup,
        name: parsedPayload.name,
        description: parsedPayload.description ?? null,
        selection_type: parsedPayload.selection_type,
        min_selected: parsedPayload.min_selected ?? 0,
        max_selected: parsedPayload.max_selected ?? null,
        is_active: parsedPayload.is_active ?? true,
        sort_order: parsedPayload.sort_order ?? 0,
        options: parsedPayload.options.map((option) => ({
          uuid: option.uuid ?? createUuid(),
          name: option.name,
          description: option.description ?? null,
          price_delta_minor: option.price_delta_minor,
          is_default: option.is_default ?? false,
          is_active: option.is_active ?? true,
          sort_order: option.sort_order ?? 0,
        })),
      });

      const nextItem = merchantCatalogItemSchema.parse({
        ...existingItem,
        modifier_groups: existingItem.modifier_groups
          .map((entry) =>
            entry.uuid === modifierGroupUuid ? nextGroup : entry
          )
          .sort(
            (left, right) =>
              left.sort_order - right.sort_order ||
              left.name.localeCompare(right.name)
          ),
      });

      state.merchantCatalogItems = state.merchantCatalogItems.map((entry) =>
        entry.uuid === catalogItemUuid ? nextItem : entry
      );

      return nextGroup;
    },
    async upsertBranchOverride(branchUuid, catalogItemUuid, payload) {
      if (liveOpsApi) {
        return liveOpsApi.upsertBranchOverride(
          branchUuid,
          catalogItemUuid,
          payload
        );
      }

      const parsedPayload = merchantCatalogBranchOverrideSchema
        .pick({
          price_minor: true,
          stock_quantity: true,
          is_available: true,
        })
        .parse(payload);
      const existingItem = state.merchantCatalogItems.find(
        (entry) => entry.uuid === catalogItemUuid
      );

      if (!existingItem) {
        throw new Error('Catalog item not found.');
      }

      const branch = state.managedMerchants
        .flatMap((merchant) => merchant.branches)
        .find((entry) => entry.uuid === branchUuid);

      if (!branch) {
        throw new Error('Branch could not be found for this merchant.');
      }

      const nextOverride = merchantCatalogBranchOverrideSchema.parse({
        branch_uuid: branch.uuid,
        branch_name: branch.name,
        price_minor: parsedPayload.price_minor ?? null,
        stock_quantity: parsedPayload.stock_quantity ?? null,
        is_available: parsedPayload.is_available,
      });

      const nextItem = merchantCatalogItemSchema.parse({
        ...existingItem,
        branch_overrides: [
          ...existingItem.branch_overrides.filter(
            (entry) => entry.branch_uuid !== branch.uuid
          ),
          nextOverride,
        ].sort((left, right) =>
          (left.branch_name ?? '').localeCompare(right.branch_name ?? '')
        ),
      });

      state.merchantCatalogItems = state.merchantCatalogItems.map((entry) =>
        entry.uuid === catalogItemUuid ? nextItem : entry
      );

      return {
        branch_uuid: branch.uuid,
        catalog_item_uuid: nextItem.uuid,
        override: nextOverride,
      };
    },
    async listMerchantOrders() {
      return state.merchantOrders
        .slice()
        .sort(
          (left, right) =>
            new Date(right.placed_at ?? 0) - new Date(left.placed_at ?? 0)
        )
        .map((order) => merchantOrderSchema.parse(order));
    },
    async transitionMerchantOrder(orderUuid, action) {
      const order = state.merchantOrders.find(
        (entry) => entry.uuid === orderUuid
      );

      if (!order) {
        throw new Error('Merchant order not found.');
      }

      const nextOrder = transitionMerchantOrderState(order, action);
      state.merchantOrders = state.merchantOrders.map((entry) =>
        entry.uuid === orderUuid ? nextOrder : entry
      );

      return nextOrder;
    },
    async listMerchantNotifications(query = {}) {
      const data = listActorNotificationDeliveries(
        state.notificationDeliveries,
        'merchant',
        query
      )
        .slice()
        .sort(
          (left, right) =>
            new Date(right.created_at ?? 0) - new Date(left.created_at ?? 0)
        )
        .map((entry) => notificationDeliverySchema.parse(entry));

      return {
        data,
        meta: notificationInboxMetaSchema.parse({
          total: data.length,
          unread_count: data.filter((entry) => !entry.read_at).length,
        }),
      };
    },
    async markMerchantNotificationRead(notificationDeliveryId) {
      const delivery = state.notificationDeliveries.find(
        (entry) =>
          entry.id === notificationDeliveryId &&
          entry.recipient_actor === 'merchant' &&
          entry.channel === 'in_app'
      );

      if (!delivery) {
        throw new Error('Merchant notification could not be found.');
      }

      const nextDelivery = notificationDeliverySchema.parse({
        ...delivery,
        read_at: delivery.read_at ?? new Date().toISOString(),
      });

      state.notificationDeliveries = state.notificationDeliveries.map(
        (entry) => (entry.id === notificationDeliveryId ? nextDelivery : entry)
      );

      return nextDelivery;
    },
    async listDispatchAssignments() {
      if (liveOpsApi) {
        return liveOpsApi.listDispatchAssignments();
      }

      return state.dispatchAssignments.map((assignment) =>
        dispatchAssignmentSchema.parse(assignment)
      );
    },
    async reassignDispatchOrder(orderUuid, payload) {
      if (liveOpsApi) {
        return liveOpsApi.reassignDispatchOrder(orderUuid, payload);
      }

      const parsedPayload = dispatchReassignmentInputSchema.parse(payload);
      const assignment = state.dispatchAssignments.find(
        (entry) => entry.orderUuid === orderUuid
      );

      if (!assignment) {
        throw new Error('Dispatch assignment could not be found.');
      }

      const nextRider = assignment.eligibleRiders.find(
        (rider) => rider.riderUuid === parsedPayload.rider_uuid
      );

      if (!nextRider) {
        throw new Error('Selected rider is not eligible for this order.');
      }

      const nextAssignment = dispatchAssignmentSchema.parse({
        ...assignment,
        riderUuid: nextRider.riderUuid,
        riderName: nextRider.riderName,
        riderAvailability: nextRider.availability,
        assignmentType: 'manual',
        score: nextRider.score,
        activeLoad: nextRider.activeLoad + 1,
        pickupEtaMinutes: nextRider.pickupEtaMinutes,
        distanceBucket: nextRider.distanceBucket,
        lastRiderSeenAt: nextRider.lastSeenAt,
        reassignment: {
          ...assignment.reassignment,
          lastReassignedAt: new Date().toISOString(),
        },
        eligibleRiders: assignment.eligibleRiders.filter(
          (rider) => rider.riderUuid !== nextRider.riderUuid
        ),
      });

      state.dispatchAssignments = state.dispatchAssignments.map((entry) =>
        entry.orderUuid === orderUuid ? nextAssignment : entry
      );

      return {
        assignment: nextAssignment,
        message: `Reassigned ${orderUuid.slice(0, 8).toUpperCase()} to ${nextRider.riderName} for ${dispatchReasonLabel(parsedPayload.reason_code)}.`,
      };
    },
    async searchSupportOrders(query = {}) {
      if (liveOpsApi) {
        return liveOpsApi.searchSupportOrders(query);
      }

      return searchSupportOrders(state.merchantOrders, query)
        .slice()
        .sort(
          (left, right) =>
            new Date(right.placed_at ?? 0) - new Date(left.placed_at ?? 0)
        )
        .map((order) => supportOrderSchema.parse(order));
    },
    async createOrUpdateSupportCase(orderUuid, payload) {
      if (liveOpsApi) {
        return liveOpsApi.createOrUpdateSupportCase(orderUuid, payload);
      }

      const parsedPayload = supportCaseInputSchema.parse(payload);
      const order = state.merchantOrders.find(
        (entry) => entry.uuid === orderUuid
      );

      if (!order) {
        throw new Error('Support order not found.');
      }

      const nextCase = buildSupportCase(
        order,
        parsedPayload,
        order.support_case ?? null
      );
      const nextOrder = supportOrderSchema.parse({
        ...order,
        support_case: nextCase,
      });

      state.merchantOrders = state.merchantOrders.map((entry) =>
        entry.uuid === orderUuid ? nextOrder : entry
      );

      return nextCase;
    },
    async updateSupportCase(supportCaseUuid, payload) {
      if (liveOpsApi) {
        return liveOpsApi.updateSupportCase(supportCaseUuid, payload);
      }

      const parsedPayload = supportCaseUpdateSchema.parse(
        Object.fromEntries(
          Object.entries(payload).filter(([, value]) => value !== undefined)
        )
      );
      const order = state.merchantOrders.find(
        (entry) => entry.support_case?.uuid === supportCaseUuid
      );

      if (!order?.support_case) {
        throw new Error('Support case could not be found.');
      }

      const nextCase = buildSupportCase(
        order,
        parsedPayload,
        order.support_case
      );
      const nextOrder = supportOrderSchema.parse({
        ...order,
        support_case: nextCase,
      });

      state.merchantOrders = state.merchantOrders.map((entry) =>
        entry.uuid === order.uuid ? nextOrder : entry
      );

      return nextCase;
    },
    async createSupportNote(orderUuid, payload) {
      if (liveOpsApi) {
        return liveOpsApi.createSupportNote(orderUuid, payload);
      }

      const parsedPayload = supportNoteInputSchema.parse(payload);
      const order = state.merchantOrders.find(
        (entry) => entry.uuid === orderUuid
      );

      if (!order) {
        throw new Error('Support order not found.');
      }

      const note = supportNoteSchema.parse({
        id:
          Math.max(
            500,
            ...state.merchantOrders.flatMap((entry) =>
              entry.support_notes.map((item) => item.id)
            )
          ) + 1,
        order_id:
          9000 +
          state.merchantOrders.findIndex((entry) => entry.uuid === orderUuid) +
          1,
        order_uuid: order.uuid,
        author_user_id: 901,
        author_name: 'Huda Support',
        body: parsedPayload.body,
        attachment_disk: null,
        attachment_path: null,
        created_at: new Date().toISOString(),
      });

      const nextOrder = supportOrderSchema.parse({
        ...order,
        support_notes: [note, ...order.support_notes],
        timeline: [
          ...order.timeline,
          {
            event_type: 'support_note_added',
            from_status: order.status,
            to_status: order.status,
            actor_role: 'ops_support',
            metadata: {
              support_note_id: note.id,
            },
            created_at: note.created_at,
          },
        ],
      });

      state.merchantOrders = state.merchantOrders.map((entry) =>
        entry.uuid === orderUuid ? nextOrder : entry
      );
      state.notificationDeliveries = [
        ...nextNotificationEntries(
          nextOrder,
          'support_note_added',
          'Support updated your order',
          `Support added a note for order ${nextOrder.uuid.slice(0, 8).toUpperCase()}.`
        ),
        ...state.notificationDeliveries,
      ];

      return note;
    },
    async cancelSupportOrder(orderUuid, payload) {
      if (liveOpsApi) {
        return liveOpsApi.cancelSupportOrder(orderUuid, payload);
      }

      const parsedPayload = cancelSupportOrderInputSchema.parse(payload);
      const order = state.merchantOrders.find(
        (entry) => entry.uuid === orderUuid
      );

      if (!order) {
        throw new Error('Support order not found.');
      }

      if (['cancelled', 'delivered'].includes(order.status)) {
        throw new Error('Order can no longer be cancelled by support.');
      }

      const timestamp = new Date().toISOString();
      const nextCase = buildSupportCase(
        order,
        {
          summary: parsedPayload.summary,
          issue_type: parsedPayload.issue_type,
          status: 'resolved',
          cancellation_reason_code: parsedPayload.reason_code,
          resolution_type: 'cancelled_order',
          resolution_notes: parsedPayload.reason_note ?? null,
        },
        order.support_case ?? null
      );
      const nextOrder = supportOrderSchema.parse({
        ...order,
        status: 'cancelled',
        merchant_actions: [],
        support_case: nextCase,
        timeline: [
          ...order.timeline,
          {
            event_type: 'cancelled',
            from_status: order.status,
            to_status: 'cancelled',
            actor_role: 'ops_support',
            metadata: {
              reason: 'support_cancelled',
              reason_code: parsedPayload.reason_code,
              reason_note: parsedPayload.reason_note ?? null,
              support_case_uuid: nextCase.uuid,
            },
            created_at: timestamp,
          },
        ],
      });

      state.merchantOrders = state.merchantOrders.map((entry) =>
        entry.uuid === orderUuid ? nextOrder : entry
      );
      state.notificationDeliveries = [
        ...nextNotificationEntries(
          nextOrder,
          'order_status_updated',
          'Order cancelled',
          `Order ${nextOrder.uuid.slice(0, 8).toUpperCase()} is now cancelled.`
        ),
        ...state.notificationDeliveries,
      ];

      return nextOrder;
    },
    async listNotifications(query = {}) {
      if (liveOpsApi) {
        return liveOpsApi.listNotifications(query);
      }

      const data = listNotificationDeliveries(
        state.notificationDeliveries,
        query
      )
        .slice()
        .sort(
          (left, right) =>
            new Date(right.queued_at ?? 0) - new Date(left.queued_at ?? 0)
        )
        .map((entry) => notificationDeliverySchema.parse(entry));

      return {
        data,
        meta: {
          total: data.length,
        },
      };
    },
    async retryNotification(notificationDeliveryId) {
      if (liveOpsApi) {
        return liveOpsApi.retryNotification(notificationDeliveryId);
      }

      const delivery = state.notificationDeliveries.find(
        (entry) => entry.id === notificationDeliveryId
      );

      if (!delivery) {
        throw new Error('Notification delivery could not be found.');
      }

      const nextDelivery = notificationDeliverySchema.parse({
        ...delivery,
        provider: 'log',
        provider_reference: `log:${delivery.id}`,
        status: 'sent',
        attempt_count: delivery.attempt_count + 1,
        last_attempted_at: new Date().toISOString(),
        next_retry_at: null,
        last_error: null,
        sent_at: new Date().toISOString(),
      });

      state.notificationDeliveries = state.notificationDeliveries.map(
        (entry) => (entry.id === notificationDeliveryId ? nextDelivery : entry)
      );

      return nextDelivery;
    },
    async listSettlementLedger(query = {}) {
      if (liveOpsApi) {
        return liveOpsApi.listSettlementLedger(query);
      }

      const entries = filterSettlementEntries(state.settlementEntries, query)
        .slice()
        .sort(
          (left, right) =>
            new Date(right.occurred_at) - new Date(left.occurred_at)
        )
        .map((entry) => ledgerEntrySchema.parse(entry));

      return {
        data: entries,
        meta: buildSettlementMeta(entries),
      };
    },
    async createSettlementAdjustment(orderUuid, payload) {
      if (liveOpsApi) {
        return liveOpsApi.createSettlementAdjustment(orderUuid, payload);
      }

      const parsedPayload = settlementAdjustmentSchema.parse(payload);
      const relatedEntry = state.settlementEntries.find(
        (entry) => entry.order_uuid === orderUuid
      );

      if (!relatedEntry) {
        throw new Error('Order ledger could not be found for adjustment.');
      }

      const nextEntry = ledgerEntrySchema.parse({
        id: Math.max(...state.settlementEntries.map((entry) => entry.id)) + 1,
        order_id: relatedEntry.order_id,
        order_uuid: relatedEntry.order_uuid,
        merchant_id: relatedEntry.merchant_id,
        merchant_name: relatedEntry.merchant_name,
        rider_profile_id: relatedEntry.rider_profile_id,
        rider_name: relatedEntry.rider_name,
        entry_type: 'adjustment',
        amount_minor: parsedPayload.amount_minor,
        currency: relatedEntry.currency,
        notes: parsedPayload.notes,
        occurred_at: new Date().toISOString(),
      });

      state.settlementEntries = [nextEntry, ...state.settlementEntries];

      return nextEntry;
    },
    async exportSettlementLedger(query = {}) {
      const entries = filterSettlementEntries(state.settlementEntries, query);

      return {
        filename: 'ledger-export.csv',
        rowCount: entries.length,
      };
    },
  };
}
