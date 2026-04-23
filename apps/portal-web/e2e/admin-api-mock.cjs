/* global URL */

const opsAbilities = [
  'ops:dashboard.read',
  'ops:merchants.manage',
  'ops:dispatch.manage',
  'ops:settlements.read',
  'ops:settlements.manage',
  'ops:support.manage',
  'ops:users.manage',
];

const authSession = {
  token: 'admin-route-smoke-token',
  user: {
    uuid: '7c2502bd-35e0-4f2b-9d4c-6aa03eb2c9c3',
    name: 'Talabix Super Admin',
    email: 'admin-routes@talabix.test',
    phone: null,
    account_status: 'active',
    roles: ['ops_admin'],
    abilities: opsAbilities,
  },
};

const fixedTimestamp = '2026-04-14T10:00:00.000Z';
let uuidSequence = 1000;

async function installAdminApiMock(page) {
  const seed = await import('../src/sample-data.js');
  const state = createInitialState(seed);
  const unhandledRequests = [];

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizeApiPath(url);
    const method = request.method();

    try {
      const response = handleApiRequest({
        method,
        path,
        payload: parseJsonBody(request),
        searchParams: url.searchParams,
        state,
      });

      if (response) {
        await route.fulfill(response);
        return;
      }
    } catch (error) {
      await route.fulfill(errorResponse(error));
      return;
    }

    unhandledRequests.push(`${method} ${path}`);
    await route.fulfill(
      jsonResponse({ message: `Unhandled admin route smoke API: ${path}` }, 404)
    );
  });

  return {
    state,
    unhandledRequests,
  };
}

function createInitialState(seed) {
  return {
    managedMerchants: clone(seed.managedMerchants),
    merchantConfigurations: clone(seed.opsMerchantConfigurations),
    merchantCatalogItems: clone(seed.merchantCatalogItems),
    merchantCatalogCategories: deriveCatalogCategories(
      clone(seed.merchantCatalogItems)
    ),
    dispatchAssignments: clone(seed.dispatchAssignments),
    supportOrders: clone(seed.merchantOrders),
    notificationDeliveries: clone(seed.notificationDeliveries),
    settlementEntries: clone(seed.settlementEntries),
    mapsProviderApiKey: '',
    mapsProviderConfiguration: createMapsProviderConfiguration(),
    opsUsers: [
      {
        ...authSession.user,
        created_at: fixedTimestamp,
        last_login_at: fixedTimestamp,
      },
      {
        uuid: '9e8ff354-b422-46a2-9d5f-e8d73a85007f',
        name: 'Huda Ops Admin',
        email: 'huda.ops@talabix.test',
        phone: '+966500000001',
        account_status: 'active',
        roles: ['ops_admin'],
        abilities: [],
        created_at: fixedTimestamp,
        last_login_at: fixedTimestamp,
      },
      {
        uuid: '70004eaf-4112-4ceb-a3bf-5efc1ab8ad05',
        name: 'Fahad Dispatch',
        email: 'fahad.dispatch@talabix.test',
        phone: '+966500000002',
        account_status: 'active',
        roles: ['ops_dispatcher'],
        abilities: [],
        created_at: fixedTimestamp,
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
        created_at: fixedTimestamp,
        last_login_at: null,
      },
    ],
  };
}

function handleApiRequest({ method, path, payload, searchParams, state }) {
  if (method === 'POST' && path === 'auth/login') {
    return jsonResponse(authSession);
  }

  if (method === 'GET' && path === 'auth/me') {
    return jsonResponse(authSession.user);
  }

  if (method === 'POST' && path === 'auth/logout') {
    return jsonResponse(null);
  }

  if (method === 'PATCH' && path === 'auth/password') {
    return rawJsonResponse({
      message: 'Password updated successfully.',
    });
  }

  if (method === 'GET' && path === 'dashboard/overview') {
    return jsonResponse(createDashboardOverview());
  }

  if (method === 'GET' && path === 'users') {
    return jsonResponse(state.opsUsers);
  }

  if (method === 'POST' && path === 'users') {
    const user = {
      uuid: nextUuid(),
      name: payload.name,
      email: payload.email,
      phone: payload.phone ?? null,
      account_status: payload.account_status ?? 'active',
      roles: [payload.role],
      abilities: [],
      created_at: fixedTimestamp,
      last_login_at: null,
    };

    state.opsUsers = [...state.opsUsers, user].sort(byName);
    return jsonResponse(user);
  }

  const userMatch = path.match(/^users\/([^/]+)$/);
  if (method === 'PATCH' && userMatch) {
    const userUuid = userMatch[1];
    const currentUser = state.opsUsers.find((user) => user.uuid === userUuid);

    if (!currentUser) {
      throw new Error('Ops user could not be found.');
    }

    const nextUser = {
      ...currentUser,
      name: payload.name ?? currentUser.name,
      phone: payload.phone === undefined ? currentUser.phone : payload.phone,
      account_status: payload.account_status ?? currentUser.account_status,
      roles: payload.role ? [payload.role] : currentUser.roles,
    };

    state.opsUsers = state.opsUsers
      .map((user) => (user.uuid === userUuid ? nextUser : user))
      .sort(byName);

    return jsonResponse(nextUser);
  }

  if (method === 'GET' && path === 'merchants') {
    return jsonResponse(state.managedMerchants);
  }

  if (method === 'POST' && path === 'merchants') {
    return jsonResponse(createMerchant(state, payload));
  }

  if (method === 'GET' && path === 'configuration/merchants') {
    return jsonResponse(state.merchantConfigurations);
  }

  const merchantConfigurationMatch = path.match(
    /^configuration\/merchants\/([^/]+)$/
  );
  if (method === 'GET' && merchantConfigurationMatch) {
    const merchant = findMerchantConfiguration(
      state,
      merchantConfigurationMatch[1]
    );

    return jsonResponse(merchant);
  }

  if (method === 'PATCH' && merchantConfigurationMatch) {
    const merchant = findMerchantConfiguration(
      state,
      merchantConfigurationMatch[1]
    );
    const nextMerchant = {
      ...merchant,
      status: payload.status ?? merchant.status,
      platform_commission_bps:
        payload.platform_commission_bps ?? merchant.platform_commission_bps,
    };

    replaceMerchantConfiguration(state, nextMerchant);
    deriveManagedMerchants(state);
    return jsonResponse(nextMerchant);
  }

  const branchConfigurationMatch = path.match(
    /^configuration\/branches\/([^/]+)$/
  );
  if (method === 'PATCH' && branchConfigurationMatch) {
    const branchUuid = branchConfigurationMatch[1];
    const branch = updateBranch(state, branchUuid, (currentBranch) => ({
      ...currentBranch,
      status: payload.status ?? currentBranch.status,
      accepts_orders: payload.accepts_orders ?? currentBranch.accepts_orders,
    }));

    deriveManagedMerchants(state);
    return jsonResponse(branch);
  }

  const createServiceZoneMatch = path.match(
    /^configuration\/branches\/([^/]+)\/service-zones$/
  );
  if (method === 'POST' && createServiceZoneMatch) {
    const branchUuid = createServiceZoneMatch[1];
    const serviceZone = {
      uuid: nextUuid(),
      name: payload.name,
      city: payload.city,
      postal_code: payload.postal_code ?? null,
      center_latitude: payload.center_latitude,
      center_longitude: payload.center_longitude,
      radius_meters: payload.radius_meters,
      is_active: payload.is_active ?? true,
    };

    updateBranch(state, branchUuid, (branch) => ({
      ...branch,
      service_zones: [...branch.service_zones, serviceZone].sort(byName),
    }));

    return jsonResponse(serviceZone);
  }

  const serviceZoneMatch = path.match(
    /^configuration\/service-zones\/([^/]+)$/
  );
  if (method === 'PATCH' && serviceZoneMatch) {
    const serviceZoneUuid = serviceZoneMatch[1];
    let nextServiceZone = null;

    state.merchantConfigurations = state.merchantConfigurations.map(
      (merchant) => ({
        ...merchant,
        branches: merchant.branches.map((branch) => ({
          ...branch,
          service_zones: branch.service_zones.map((serviceZone) => {
            if (serviceZone.uuid !== serviceZoneUuid) {
              return serviceZone;
            }

            nextServiceZone = {
              ...serviceZone,
              ...payload,
            };

            return nextServiceZone;
          }),
        })),
      })
    );

    if (!nextServiceZone) {
      throw new Error('Service zone could not be found.');
    }

    return jsonResponse(nextServiceZone);
  }

  const createFeeBandMatch = path.match(
    /^configuration\/branches\/([^/]+)\/fee-bands$/
  );
  if (method === 'POST' && createFeeBandMatch) {
    const branchUuid = createFeeBandMatch[1];
    const feeBand = {
      uuid: nextUuid(),
      min_distance_meters: payload.min_distance_meters,
      max_distance_meters: payload.max_distance_meters,
      fee_minor: payload.fee_minor,
    };

    updateBranch(state, branchUuid, (branch) => ({
      ...branch,
      fee_bands: [...branch.fee_bands, feeBand].sort(
        (left, right) => left.min_distance_meters - right.min_distance_meters
      ),
    }));

    return jsonResponse(feeBand);
  }

  const feeBandMatch = path.match(/^configuration\/fee-bands\/([^/]+)$/);
  if (method === 'PATCH' && feeBandMatch) {
    const feeBandUuid = feeBandMatch[1];
    let nextFeeBand = null;

    state.merchantConfigurations = state.merchantConfigurations.map(
      (merchant) => ({
        ...merchant,
        branches: merchant.branches.map((branch) => ({
          ...branch,
          fee_bands: branch.fee_bands.map((feeBand) => {
            if (feeBand.uuid !== feeBandUuid) {
              return feeBand;
            }

            nextFeeBand = {
              ...feeBand,
              ...payload,
            };

            return nextFeeBand;
          }),
        })),
      })
    );

    if (!nextFeeBand) {
      throw new Error('Fee band could not be found.');
    }

    return jsonResponse(nextFeeBand);
  }

  if (method === 'GET' && path === 'configuration/maps-provider') {
    return jsonResponse(state.mapsProviderConfiguration);
  }

  if (method === 'PATCH' && path === 'configuration/maps-provider') {
    const provider =
      payload.provider ?? state.mapsProviderConfiguration.provider;
    const apiKey = payload.clear_google_maps_api_key
      ? ''
      : payload.google_maps_api_key || state.mapsProviderApiKey;

    state.mapsProviderApiKey = apiKey;
    state.mapsProviderConfiguration = createMapsProviderConfiguration({
      provider,
      apiKey,
      region:
        payload.google_maps_region ??
        state.mapsProviderConfiguration.google_maps.region,
      locationBias:
        payload.google_maps_location_bias === undefined
          ? state.mapsProviderConfiguration.google_maps.location_bias
          : payload.google_maps_location_bias,
      timeoutSeconds:
        payload.google_maps_timeout_seconds ??
        state.mapsProviderConfiguration.google_maps.timeout_seconds,
      fallbackToDemo:
        payload.google_maps_fallback_to_demo ??
        state.mapsProviderConfiguration.google_maps.fallback_to_demo,
    });

    return jsonResponse(state.mapsProviderConfiguration);
  }

  if (method === 'GET' && path === 'catalog/categories') {
    return jsonResponse(listCatalogCategories(state, searchParams));
  }

  if (method === 'POST' && path === 'catalog/categories') {
    return jsonResponse(createCatalogCategory(state, payload), 201);
  }

  const catalogCategoryMatch = path.match(/^catalog\/categories\/([^/]+)$/);
  if (method === 'PATCH' && catalogCategoryMatch) {
    return jsonResponse(
      updateCatalogCategory(state, catalogCategoryMatch[1], payload)
    );
  }

  if (method === 'DELETE' && catalogCategoryMatch) {
    deleteCatalogCategory(state, catalogCategoryMatch[1]);
    return jsonResponse({ uuid: catalogCategoryMatch[1] });
  }

  if (method === 'GET' && path === 'catalog/items') {
    const merchantUuid = searchParams.get('merchant_uuid');
    const items = merchantUuid
      ? state.merchantCatalogItems.filter(
          (item) => item.merchant_uuid === merchantUuid
        )
      : state.merchantCatalogItems;

    return jsonResponse(items);
  }

  if (method === 'POST' && path === 'catalog/items') {
    return jsonResponse(createCatalogItem(state, payload), 201);
  }

  const catalogItemMatch = path.match(/^catalog\/items\/([^/]+)$/);
  if (method === 'PATCH' && catalogItemMatch) {
    return jsonResponse(updateCatalogItem(state, catalogItemMatch[1], payload));
  }

  if (method === 'GET' && path === 'dispatch/assignments') {
    return jsonResponse(state.dispatchAssignments);
  }

  const reassignMatch = path.match(/^dispatch\/orders\/([^/]+)\/reassign$/);
  if (method === 'POST' && reassignMatch) {
    return jsonResponse(
      reassignDispatchOrder(state, reassignMatch[1], payload)
    );
  }

  if (method === 'GET' && path === 'support/orders/search') {
    return jsonResponse(searchSupportOrders(state, searchParams.get('q')));
  }

  const supportCaseMatch = path.match(/^support\/cases\/([^/]+)$/);
  if (method === 'PATCH' && supportCaseMatch) {
    return jsonResponse(updateSupportCase(state, supportCaseMatch[1], payload));
  }

  const createSupportCaseMatch = path.match(
    /^support\/orders\/([^/]+)\/cases$/
  );
  if (method === 'POST' && createSupportCaseMatch) {
    return jsonResponse(
      createOrUpdateSupportCase(state, createSupportCaseMatch[1], payload)
    );
  }

  const supportNoteMatch = path.match(/^support\/orders\/([^/]+)\/notes$/);
  if (method === 'POST' && supportNoteMatch) {
    return jsonResponse(createSupportNote(state, supportNoteMatch[1], payload));
  }

  const supportCancelMatch = path.match(/^support\/orders\/([^/]+)\/cancel$/);
  if (method === 'POST' && supportCancelMatch) {
    return jsonResponse(
      cancelSupportOrder(state, supportCancelMatch[1], payload)
    );
  }

  if (method === 'GET' && path === 'notifications') {
    const notifications = filterNotifications(state, searchParams);

    return jsonResponse(notifications, 200, {
      meta: {
        total: notifications.length,
      },
    });
  }

  const retryNotificationMatch = path.match(/^notifications\/([^/]+)\/retry$/);
  if (method === 'POST' && retryNotificationMatch) {
    return jsonResponse(retryNotification(state, retryNotificationMatch[1]));
  }

  if (method === 'GET' && path === 'settlements/ledger') {
    const entries = filterSettlementEntries(state, searchParams);

    return jsonResponse(entries, 200, {
      meta: createSettlementMeta(entries),
    });
  }

  const settlementAdjustmentMatch = path.match(
    /^settlements\/orders\/([^/]+)\/adjustments$/
  );
  if (method === 'POST' && settlementAdjustmentMatch) {
    return jsonResponse(
      createSettlementAdjustment(state, settlementAdjustmentMatch[1], payload)
    );
  }

  return null;
}

function createDashboardOverview() {
  return {
    range: {
      range_days: 7,
      starts_at: '2026-04-08T00:00:00.000Z',
      ends_at: '2026-04-14T23:59:59.999Z',
    },
    kpis: {
      total_orders: 5,
      active_orders: 2,
      delivered_orders: 2,
      cancelled_orders: 1,
      gross_sales_minor: 20300,
      completed_sales_minor: 16400,
      delivery_fees_minor: 6200,
      active_merchants: 1,
      accepting_branches: 2,
      available_riders: 1,
      busy_riders: 1,
      offline_riders: 1,
    },
    financials: {
      merchant_receivable_minor: 2964,
      platform_commission_minor: 336,
      rider_earning_minor: 1500,
      adjustment_minor: -450,
      net_platform_minor: -114,
      currency: 'SAR',
    },
    order_status_breakdown: [
      {
        status: 'delivered',
        count: 2,
      },
      {
        status: 'preparing',
        count: 1,
      },
      {
        status: 'cancelled',
        count: 1,
      },
    ],
    daily_orders: [
      {
        date: '2026-04-14',
        total_orders: 3,
        delivered_orders: 1,
        cancelled_orders: 0,
        gross_sales_minor: 14100,
        completed_sales_minor: 5400,
      },
      {
        date: '2026-04-13',
        total_orders: 1,
        delivered_orders: 1,
        cancelled_orders: 0,
        gross_sales_minor: 4900,
        completed_sales_minor: 4900,
      },
    ],
    merchant_sales: [
      {
        merchant_uuid: '59ac6340-5b76-4c3c-8b8a-1f2b6dd5d4a1',
        merchant_name: 'Demo Merchant',
        total_orders: 5,
        delivered_orders: 2,
        gross_sales_minor: 20300,
        completed_sales_minor: 16400,
      },
    ],
    rider_earnings: {
      total_earnings_minor: 1500,
      total_deliveries: 1,
      average_per_delivery_minor: 1500,
      riders: [
        {
          rider_uuid: '9da24492-7fd6-41dd-8f0b-24099f084001',
          rider_name: 'Yousef Al-Anzi',
          deliveries_count: 1,
          earnings_minor: 1500,
          average_per_delivery_minor: 1500,
        },
      ],
    },
  };
}

function createMapsProviderConfiguration({
  provider = 'google_maps',
  apiKey = '',
  region = 'sa',
  locationBias = 'circle:50000@24.7136,46.6753',
  timeoutSeconds = 2.5,
  fallbackToDemo = true,
} = {}) {
  const apiKeyConfigured = apiKey.length > 0;
  const ready = provider === 'google_maps' && apiKeyConfigured;

  return {
    provider,
    google_maps: {
      api_key_configured: apiKeyConfigured,
      api_key_source: apiKeyConfigured ? 'admin' : 'none',
      api_key_preview: apiKeyConfigured ? `********${apiKey.slice(-4)}` : null,
      region,
      location_bias: locationBias,
      timeout_seconds: timeoutSeconds,
      fallback_to_demo: fallbackToDemo,
    },
    runtime: {
      ready,
      fallback_active: !ready,
      message: ready
        ? 'Google Maps is ready for live traffic.'
        : provider === 'demo'
          ? 'Demo maps provider is active.'
          : 'Google Maps is selected and will use demo fallback until an API key is configured.',
    },
  };
}

function createMerchant(state, payload) {
  const merchantUuid = nextUuid();
  const branchUuid = nextUuid();
  const serviceZones = payload.branch.zones.map((zone) => ({
    uuid: nextUuid(),
    name: zone.name,
    city: zone.city,
    postal_code: zone.postal_code ?? null,
    center_latitude: zone.center_latitude,
    center_longitude: zone.center_longitude,
    radius_meters: zone.radius_meters,
    is_active: true,
  }));
  const feeBands = payload.branch.fee_bands.map((band) => ({
    uuid: nextUuid(),
    min_distance_meters: band.min_distance_meters,
    max_distance_meters: band.max_distance_meters,
    fee_minor: band.fee_minor,
  }));
  const branch = {
    uuid: branchUuid,
    name: payload.branch.name,
    status: 'active',
    city: payload.branch.city,
    address_line: payload.branch.address_line,
    latitude: payload.branch.latitude,
    longitude: payload.branch.longitude,
    accepts_orders: true,
    service_zones: serviceZones,
    fee_bands: feeBands,
  };
  const merchantConfiguration = {
    uuid: merchantUuid,
    name: payload.name,
    slug: payload.slug,
    status: 'active',
    platform_commission_bps: payload.platform_commission_bps ?? 1200,
    branches: [branch],
  };

  state.merchantConfigurations = [
    merchantConfiguration,
    ...state.merchantConfigurations,
  ];
  deriveManagedMerchants(state);

  return {
    uuid: merchantUuid,
    name: payload.name,
    slug: payload.slug,
    status: 'active',
    branches: [
      {
        uuid: branchUuid,
        name: payload.branch.name,
        status: 'active',
        city: payload.branch.city,
        address_line: payload.branch.address_line,
      },
    ],
  };
}

function deriveCatalogCategories(items) {
  const categories = new Map();

  items.forEach((item) => {
    const name = String(item.category_name ?? '').trim();

    if (!name) {
      return;
    }

    const key = `${item.merchant_uuid}:${name}`;
    const current = categories.get(key);

    categories.set(key, {
      uuid: current?.uuid ?? nextUuid(),
      merchant_id: item.merchant_id,
      merchant_uuid: item.merchant_uuid,
      name,
      description: null,
      is_active: true,
      sort_order: current?.sort_order ?? categories.size,
      item_count: (current?.item_count ?? 0) + 1,
    });
  });

  return Array.from(categories.values());
}

function listCatalogCategories(state, searchParams) {
  const merchantUuid = searchParams.get('merchant_uuid');

  return state.merchantCatalogCategories
    .filter((category) => category.merchant_uuid === merchantUuid)
    .map((category) => ({
      ...category,
      item_count: state.merchantCatalogItems.filter(
        (item) =>
          item.merchant_uuid === merchantUuid &&
          item.category_name === category.name
      ).length,
    }))
    .sort(
      (left, right) =>
        left.sort_order - right.sort_order ||
        left.name.localeCompare(right.name)
    );
}

function createCatalogCategory(state, payload) {
  const existingCategory = state.merchantCatalogCategories.find(
    (category) =>
      category.merchant_uuid === payload.merchant_uuid &&
      category.name === payload.name
  );

  if (existingCategory) {
    throw new Error('Category name already exists for this merchant.');
  }

  const nextCategory = {
    uuid: nextUuid(),
    merchant_id:
      state.merchantCatalogItems.find(
        (item) => item.merchant_uuid === payload.merchant_uuid
      )?.merchant_id ?? 301,
    merchant_uuid: payload.merchant_uuid,
    name: payload.name,
    description: payload.description ?? null,
    is_active: payload.is_active ?? true,
    sort_order: payload.sort_order ?? 0,
    item_count: 0,
  };

  state.merchantCatalogCategories = [
    nextCategory,
    ...state.merchantCatalogCategories,
  ];

  return nextCategory;
}

function updateCatalogCategory(state, categoryUuid, payload) {
  const existingCategory = state.merchantCatalogCategories.find(
    (category) => category.uuid === categoryUuid
  );

  if (!existingCategory) {
    throw new Error('Category could not be found.');
  }

  const nextCategory = {
    ...existingCategory,
    name: payload.name,
    description: payload.description ?? null,
    is_active: payload.is_active ?? true,
    sort_order: payload.sort_order ?? 0,
  };

  state.merchantCatalogCategories = state.merchantCatalogCategories.map(
    (category) => (category.uuid === categoryUuid ? nextCategory : category)
  );

  if (existingCategory.name !== nextCategory.name) {
    state.merchantCatalogItems = state.merchantCatalogItems.map((item) =>
      item.merchant_uuid === nextCategory.merchant_uuid &&
      item.category_name === existingCategory.name
        ? {
            ...item,
            category_name: nextCategory.name,
          }
        : item
    );
  }

  return {
    ...nextCategory,
    item_count: state.merchantCatalogItems.filter(
      (item) =>
        item.merchant_uuid === nextCategory.merchant_uuid &&
        item.category_name === nextCategory.name
    ).length,
  };
}

function deleteCatalogCategory(state, categoryUuid) {
  const existingCategory = state.merchantCatalogCategories.find(
    (category) => category.uuid === categoryUuid
  );

  if (!existingCategory) {
    throw new Error('Category could not be found.');
  }

  state.merchantCatalogItems = state.merchantCatalogItems.map((item) =>
    item.merchant_uuid === existingCategory.merchant_uuid &&
    item.category_name === existingCategory.name
      ? {
          ...item,
          category_name: null,
        }
      : item
  );
  state.merchantCatalogCategories = state.merchantCatalogCategories.filter(
    (category) => category.uuid !== categoryUuid
  );
}

function ensureCatalogCategory(state, merchantUuid, categoryName) {
  const name = String(categoryName ?? '').trim();

  if (!name) {
    return;
  }

  if (
    state.merchantCatalogCategories.some(
      (category) =>
        category.merchant_uuid === merchantUuid && category.name === name
    )
  ) {
    return;
  }

  state.merchantCatalogCategories = [
    {
      uuid: nextUuid(),
      merchant_id:
        state.merchantCatalogItems.find(
          (item) => item.merchant_uuid === merchantUuid
        )?.merchant_id ?? 301,
      merchant_uuid: merchantUuid,
      name,
      description: null,
      is_active: true,
      sort_order: state.merchantCatalogCategories.length,
      item_count: 0,
    },
    ...state.merchantCatalogCategories,
  ];
}

function createCatalogItem(state, payload) {
  const nextItem = {
    uuid: nextUuid(),
    merchant_id:
      state.merchantCatalogItems.find(
        (item) => item.merchant_uuid === payload.merchant_uuid
      )?.merchant_id ?? 301,
    merchant_uuid: payload.merchant_uuid,
    name: payload.name,
    category_name: payload.category_name ?? null,
    sku: payload.sku ?? null,
    description: payload.description ?? null,
    image_url: payload.image_url ?? null,
    base_price_minor: payload.base_price_minor,
    base_stock: payload.base_stock ?? null,
    is_active: payload.is_active ?? true,
    modifier_groups: [],
    branch_overrides: [],
  };

  state.merchantCatalogItems = [nextItem, ...state.merchantCatalogItems];
  ensureCatalogCategory(state, payload.merchant_uuid, payload.category_name);

  return nextItem;
}

function updateCatalogItem(state, itemUuid, payload) {
  const existingItem = state.merchantCatalogItems.find(
    (item) => item.uuid === itemUuid
  );

  if (!existingItem) {
    throw new Error('Catalog item could not be found.');
  }

  const nextItem = {
    ...existingItem,
    merchant_uuid: payload.merchant_uuid,
    name: payload.name,
    category_name: payload.category_name ?? null,
    sku: payload.sku ?? null,
    description: payload.description ?? null,
    image_url: payload.image_url ?? null,
    base_price_minor: payload.base_price_minor,
    base_stock: payload.base_stock ?? null,
    is_active: payload.is_active ?? true,
  };

  state.merchantCatalogItems = state.merchantCatalogItems.map((item) =>
    item.uuid === itemUuid ? nextItem : item
  );
  ensureCatalogCategory(state, payload.merchant_uuid, payload.category_name);

  return nextItem;
}

function findMerchantConfiguration(state, merchantUuid) {
  const merchant = state.merchantConfigurations.find(
    (entry) => entry.uuid === merchantUuid
  );

  if (!merchant) {
    throw new Error('Merchant configuration could not be found.');
  }

  return merchant;
}

function replaceMerchantConfiguration(state, nextMerchant) {
  state.merchantConfigurations = state.merchantConfigurations.map((merchant) =>
    merchant.uuid === nextMerchant.uuid ? nextMerchant : merchant
  );
}

function updateBranch(state, branchUuid, update) {
  let nextBranch = null;

  state.merchantConfigurations = state.merchantConfigurations.map(
    (merchant) => ({
      ...merchant,
      branches: merchant.branches.map((branch) => {
        if (branch.uuid !== branchUuid) {
          return branch;
        }

        nextBranch = update(branch);
        return nextBranch;
      }),
    })
  );

  if (!nextBranch) {
    throw new Error('Branch configuration could not be found.');
  }

  return nextBranch;
}

function deriveManagedMerchants(state) {
  state.managedMerchants = state.merchantConfigurations.map((merchant) => ({
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
  }));
}

function reassignDispatchOrder(state, orderUuid, payload) {
  const assignment = state.dispatchAssignments.find(
    (entry) => entry.orderUuid === orderUuid
  );

  if (!assignment) {
    throw new Error('Dispatch assignment could not be found.');
  }

  const rider = assignment.eligibleRiders.find(
    (candidate) => candidate.riderUuid === payload.rider_uuid
  );

  if (!rider) {
    throw new Error('Selected rider is not eligible for this order.');
  }

  state.dispatchAssignments = state.dispatchAssignments.map((entry) =>
    entry.orderUuid === orderUuid
      ? {
          ...entry,
          riderUuid: rider.riderUuid,
          riderName: rider.riderName,
          riderAvailability: rider.availability,
          assignmentType: 'manual',
          score: rider.score,
          activeLoad: rider.activeLoad + 1,
          pickupEtaMinutes: rider.pickupEtaMinutes,
          distanceBucket: rider.distanceBucket,
          lastRiderSeenAt: rider.lastSeenAt,
          reassignment: {
            ...entry.reassignment,
            lastReassignedAt: fixedTimestamp,
          },
          eligibleRiders: entry.eligibleRiders.filter(
            (candidate) => candidate.riderUuid !== rider.riderUuid
          ),
        }
      : entry
  );

  const order = state.supportOrders.find((entry) => entry.uuid === orderUuid);

  if (!order) {
    throw new Error('Reassigned order could not be found.');
  }

  return order;
}

function searchSupportOrders(state, query) {
  const normalizedQuery = (query ?? '').trim().toLowerCase();

  if (!normalizedQuery) {
    return state.supportOrders;
  }

  return state.supportOrders.filter((order) =>
    [
      order.uuid,
      order.customer_name,
      order.merchant_name,
      order.branch_name,
      order.notes,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery))
  );
}

function createOrUpdateSupportCase(state, orderUuid, payload) {
  const order = findSupportOrder(state, orderUuid);
  const supportCase = {
    ...(order.support_case ?? {
      uuid: nextUuid(),
      order_id: 9000 + state.supportOrders.indexOf(order) + 1,
      order_uuid: order.uuid,
      opened_by_user_id: 901,
      opened_by_name: 'Huda Support',
      resolved_by_user_id: null,
      resolved_by_name: null,
      opened_at: fixedTimestamp,
      resolved_at: null,
      created_at: fixedTimestamp,
    }),
    status: payload.status ?? 'open',
    issue_type: payload.issue_type,
    summary: payload.summary,
    cancellation_reason_code: payload.cancellation_reason_code ?? null,
    resolution_type: payload.resolution_type ?? null,
    resolution_notes: payload.resolution_notes ?? null,
    updated_at: fixedTimestamp,
  };

  replaceSupportOrder(state, {
    ...order,
    support_case: supportCase,
  });

  return supportCase;
}

function updateSupportCase(state, supportCaseUuid, payload) {
  const order = state.supportOrders.find(
    (entry) => entry.support_case?.uuid === supportCaseUuid
  );

  if (!order?.support_case) {
    throw new Error('Support case could not be found.');
  }

  const supportCase = {
    ...order.support_case,
    ...payload,
    updated_at: fixedTimestamp,
  };

  replaceSupportOrder(state, {
    ...order,
    support_case: supportCase,
  });

  return supportCase;
}

function createSupportNote(state, orderUuid, payload) {
  const order = findSupportOrder(state, orderUuid);
  const note = {
    id:
      Math.max(
        500,
        ...state.supportOrders.flatMap((entry) =>
          (entry.support_notes ?? []).map((item) => item.id)
        )
      ) + 1,
    order_id: 9000 + state.supportOrders.indexOf(order) + 1,
    order_uuid: order.uuid,
    author_user_id: 901,
    author_name: 'Huda Support',
    body: payload.body,
    attachment_disk: null,
    attachment_path: null,
    created_at: fixedTimestamp,
  };

  replaceSupportOrder(state, {
    ...order,
    support_notes: [note, ...(order.support_notes ?? [])],
  });

  state.notificationDeliveries = [
    createNotificationDelivery(state, order, 'support_note_added'),
    ...state.notificationDeliveries,
  ];

  return note;
}

function cancelSupportOrder(state, orderUuid, payload) {
  const order = findSupportOrder(state, orderUuid);
  const supportCase = createOrUpdateSupportCase(state, orderUuid, {
    summary: payload.summary,
    issue_type: payload.issue_type,
    status: 'resolved',
    cancellation_reason_code: payload.reason_code,
    resolution_type: 'cancelled_order',
    resolution_notes: payload.reason_note ?? null,
  });
  const nextOrder = {
    ...findSupportOrder(state, orderUuid),
    status: 'cancelled',
    merchant_actions: [],
    support_case: supportCase,
    timeline: [
      ...(order.timeline ?? []),
      {
        event_type: 'cancelled',
        from_status: order.status,
        to_status: 'cancelled',
        actor_role: 'ops_support',
        metadata: {
          reason: 'support_cancelled',
          reason_code: payload.reason_code,
        },
        created_at: fixedTimestamp,
      },
    ],
  };

  replaceSupportOrder(state, nextOrder);
  state.notificationDeliveries = [
    createNotificationDelivery(state, nextOrder, 'order_status_updated'),
    ...state.notificationDeliveries,
  ];

  return nextOrder;
}

function createNotificationDelivery(state, order, notificationType) {
  const id =
    Math.max(200, ...state.notificationDeliveries.map((entry) => entry.id)) + 1;

  return {
    id,
    order_id: 9000,
    order_uuid: order.uuid,
    recipient_user_id: 301,
    recipient_actor: 'customer',
    recipient_name: order.customer_name,
    recipient_email: 'customer@talabix.test',
    notification_type: notificationType,
    channel: 'in_app',
    provider: 'internal',
    provider_reference: `internal:${id}`,
    status: 'sent',
    attempt_count: 1,
    title:
      notificationType === 'order_status_updated'
        ? 'Order cancelled'
        : 'Support updated your order',
    body: `Order ${order.uuid.slice(0, 8).toUpperCase()} was updated.`,
    payload: {
      order_uuid: order.uuid,
    },
    queued_at: fixedTimestamp,
    last_attempted_at: fixedTimestamp,
    next_retry_at: null,
    last_error: null,
    sent_at: fixedTimestamp,
    read_at: null,
    created_at: fixedTimestamp,
  };
}

function findSupportOrder(state, orderUuid) {
  const order = state.supportOrders.find((entry) => entry.uuid === orderUuid);

  if (!order) {
    throw new Error('Support order could not be found.');
  }

  return order;
}

function replaceSupportOrder(state, nextOrder) {
  state.supportOrders = state.supportOrders.map((order) =>
    order.uuid === nextOrder.uuid ? nextOrder : order
  );
}

function filterNotifications(state, searchParams) {
  const orderUuid = searchParams.get('order_uuid');
  const status = searchParams.get('status');

  return state.notificationDeliveries.filter((entry) => {
    if (orderUuid && entry.order_uuid !== orderUuid) {
      return false;
    }

    if (status && entry.status !== status) {
      return false;
    }

    return true;
  });
}

function retryNotification(state, notificationDeliveryId) {
  const id = Number(notificationDeliveryId);
  const notification = state.notificationDeliveries.find(
    (entry) => entry.id === id
  );

  if (!notification) {
    throw new Error('Notification delivery could not be found.');
  }

  const nextNotification = {
    ...notification,
    provider: 'log',
    provider_reference: `log:${notification.id}`,
    status: 'sent',
    attempt_count: notification.attempt_count + 1,
    last_attempted_at: fixedTimestamp,
    next_retry_at: null,
    last_error: null,
    sent_at: fixedTimestamp,
  };

  state.notificationDeliveries = state.notificationDeliveries.map((entry) =>
    entry.id === id ? nextNotification : entry
  );

  return nextNotification;
}

function filterSettlementEntries(state, searchParams) {
  const entryType = searchParams.get('entry_type');
  const direction = searchParams.get('direction');
  const orderUuid = searchParams.get('order_uuid');

  return state.settlementEntries.filter((entry) => {
    if (entryType && entry.entry_type !== entryType) {
      return false;
    }

    if (orderUuid && entry.order_uuid !== orderUuid) {
      return false;
    }

    if (direction === 'positive' && entry.amount_minor <= 0) {
      return false;
    }

    if (direction === 'negative' && entry.amount_minor >= 0) {
      return false;
    }

    return true;
  });
}

function createSettlementAdjustment(state, orderUuid, payload) {
  const relatedEntry = state.settlementEntries.find(
    (entry) => entry.order_uuid === orderUuid
  );

  if (!relatedEntry) {
    throw new Error('Order ledger could not be found for adjustment.');
  }

  const entry = {
    id: Math.max(...state.settlementEntries.map((item) => item.id)) + 1,
    order_id: relatedEntry.order_id,
    order_uuid: relatedEntry.order_uuid,
    merchant_id: relatedEntry.merchant_id,
    merchant_name: relatedEntry.merchant_name,
    rider_profile_id: relatedEntry.rider_profile_id,
    rider_name: relatedEntry.rider_name,
    entry_type: 'adjustment',
    amount_minor: payload.amount_minor,
    currency: relatedEntry.currency,
    notes: payload.notes,
    occurred_at: fixedTimestamp,
  };

  state.settlementEntries = [entry, ...state.settlementEntries];

  return entry;
}

function createSettlementMeta(entries) {
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

function normalizeApiPath(url) {
  const marker = '/api/v1/';
  const markerIndex = url.pathname.indexOf(marker);
  const path =
    markerIndex >= 0
      ? url.pathname.slice(markerIndex + marker.length)
      : url.pathname;

  return path.replace(/^\/?ops\/?/, '').replace(/^\/+/, '');
}

function parseJsonBody(request) {
  const body = request.postData();

  if (!body) {
    return {};
  }

  return JSON.parse(body);
}

function jsonResponse(data, status = 200, extra = {}) {
  return rawJsonResponse(
    status >= 400
      ? data
      : {
          data,
          ...extra,
        },
    status
  );
}

function rawJsonResponse(data, status = 200) {
  return {
    status,
    contentType: 'application/json',
    body: JSON.stringify(data),
  };
}

function errorResponse(error) {
  return rawJsonResponse(
    {
      message: error.message ?? 'Admin route smoke API failed.',
    },
    500
  );
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nextUuid() {
  uuidSequence += 1;
  return `00000000-0000-4000-8000-${String(uuidSequence).padStart(12, '0')}`;
}

function byName(left, right) {
  return left.name.localeCompare(right.name);
}

module.exports = {
  authSession,
  installAdminApiMock,
};
