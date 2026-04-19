import {
  addressSchema,
  actorNotificationQuerySchema,
  authSessionSchema,
  cartSummarySchema,
  catalogItemSchema,
  checkoutRequestSchema,
  customerProfileSchema,
  merchantDetailSchema,
  merchantListQuerySchema,
  merchantSummarySchema,
  notificationDeliverySchema,
  notificationInboxMetaSchema,
  orderSchema,
  placeSuggestionSchema,
  registerSchema,
  userSchema,
} from '@talabix/shared/validation/schemas';
import { createDemoMapsProvider } from '@talabix/shared/maps/provider';
import {
  activeOrder,
  branchCatalogById,
  cartState,
  customerAddresses,
  customerOffers,
  customerOrderHistory,
  customerNotifications,
  customerSession,
  discoveryMerchants,
} from './mock-data';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeOptional(value) {
  return value ? value : null;
}

function normalizePromoCode(value) {
  const normalized = String(value ?? '').trim().toUpperCase();

  return normalized.length ? normalized : null;
}

function normalizeAddressPayload(payload) {
  return {
    label: payload.label,
    line_1: payload.line_1,
    line_2: normalizeOptional(payload.line_2),
    building: normalizeOptional(payload.building),
    floor: normalizeOptional(payload.floor),
    apartment: normalizeOptional(payload.apartment),
    landmark: normalizeOptional(payload.landmark),
    delivery_notes: normalizeOptional(payload.delivery_notes),
    city: payload.city,
    latitude: Number(payload.latitude),
    longitude: Number(payload.longitude),
    is_default: Boolean(payload.is_default),
  };
}

function createInitialState() {
  return {
    session: clone(customerSession),
    addresses: clone(customerAddresses),
    merchants: clone(discoveryMerchants),
    branchCatalogById: clone(branchCatalogById),
    cart: clone(cartState),
    notifications: clone(customerNotifications),
    activeOrder: clone(activeOrder),
    orderHistory: clone(customerOrderHistory),
    offers: clone(customerOffers),
    orders: [clone(activeOrder)],
  };
}

let state = createInitialState();
const mapsProvider = createDemoMapsProvider();

export function resetCustomerApiState() {
  state = createInitialState();
}

function nextUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `00000000-0000-4000-8000-${Math.random().toString(16).slice(2, 14).padEnd(12, '0')}`;
}

function distanceMeters(fromLat, fromLng, toLat, toLng) {
  const earthRadius = 6371000;
  const latDelta = ((toLat - fromLat) * Math.PI) / 180;
  const lngDelta = ((toLng - fromLng) * Math.PI) / 180;
  const angle =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos((fromLat * Math.PI) / 180) *
      Math.cos((toLat * Math.PI) / 180) *
      Math.sin(lngDelta / 2) ** 2;

  return Math.round(2 * earthRadius * Math.asin(Math.sqrt(angle)));
}

function todayHours(branch) {
  const dayOfWeek = new Date().getDay();

  return (
    branch.hours_schedule.find((entry) => entry.day_of_week === dayOfWeek) ?? {
      day_of_week: dayOfWeek,
      opens_at: null,
      closes_at: null,
      is_closed: true,
    }
  );
}

function isBranchOpenNow(branch) {
  const schedule = todayHours(branch);

  if (
    branch.status !== 'active' ||
    !branch.accepts_orders ||
    schedule.is_closed ||
    !schedule.opens_at ||
    !schedule.closes_at
  ) {
    return false;
  }

  const now = new Date();
  const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

  if (schedule.closes_at >= schedule.opens_at) {
    return nowTime >= schedule.opens_at && nowTime <= schedule.closes_at;
  }

  return nowTime >= schedule.opens_at || nowTime <= schedule.closes_at;
}

async function branchServiceability(branch, address) {
  if (!address) {
    return null;
  }

  const distance = distanceMeters(
    branch.latitude,
    branch.longitude,
    address.latitude,
    address.longitude
  );
  const zone = branch.service_zones.find(
    (candidate) =>
      candidate.city === address.city &&
      distanceMeters(
        candidate.center_latitude,
        candidate.center_longitude,
        address.latitude,
        address.longitude
      ) <= candidate.radius_meters
  );
  const feeBand = branch.fee_bands.find(
    (candidate) =>
      distance >= candidate.min_distance_meters &&
      distance <= candidate.max_distance_meters
  );
  const isServiceable = Boolean(zone && feeBand);
  const routeEstimate = await mapsProvider.distanceEstimate(
    {
      latitude: branch.latitude,
      longitude: branch.longitude,
    },
    {
      latitude: address.latitude,
      longitude: address.longitude,
    }
  );

  return {
    address_uuid: address.uuid,
    is_serviceable: isServiceable,
    distance_meters: distance,
    delivery_fee_minor: isServiceable ? feeBand.fee_minor : null,
    estimated_duration_minutes: isServiceable
      ? routeEstimate.duration_minutes
      : null,
    maps_provider: routeEstimate.provider,
  };
}

async function projectBranch(branch, address) {
  const projected = {
    uuid: branch.uuid,
    name: branch.name,
    status: branch.status,
    city: branch.city,
    address_line: branch.address_line,
    latitude: branch.latitude,
    longitude: branch.longitude,
    accepts_orders: branch.accepts_orders,
    is_open_now: isBranchOpenNow(branch),
    today_hours: todayHours(branch),
    serviceability: await branchServiceability(branch, address),
  };

  return projected;
}

async function projectMerchant(
  merchant,
  address,
  onlyServiceableBranches = false
) {
  const projectedBranches = (
    await Promise.all(
      merchant.branches
        .filter((branch) => branch.status === 'active')
        .map((branch) => projectBranch(branch, address))
    )
  )
    .filter(
      (branch) =>
        !onlyServiceableBranches || branch.serviceability?.is_serviceable
    )
    .sort((left, right) => {
      if (
        (left.serviceability?.is_serviceable ?? false) ===
        (right.serviceability?.is_serviceable ?? false)
      ) {
        return left.name.localeCompare(right.name);
      }

      return left.serviceability?.is_serviceable ? -1 : 1;
    });

  return {
    uuid: merchant.uuid,
    name: merchant.name,
    slug: merchant.slug,
    status: merchant.status,
    is_open_now: projectedBranches.some((branch) => branch.is_open_now),
    is_serviceable: address
      ? projectedBranches.some(
          (branch) => branch.serviceability?.is_serviceable
        )
      : null,
    serviceable_branch_count: address
      ? projectedBranches.filter(
          (branch) => branch.serviceability?.is_serviceable
        ).length
      : null,
    branches: projectedBranches,
  };
}

function defaultAddress() {
  return (
    state.addresses.find((address) => address.is_default) ??
    state.addresses[0] ??
    null
  );
}

function orderPlacedAt(order) {
  return (
    order.placed_at ??
    order.timeline?.find((event) => event.event_type === 'order_placed')
      ?.created_at ??
    order.timeline?.[0]?.created_at ??
    null
  );
}

function orderDeliveredAt(order) {
  return (
    order.delivered_at ??
    order.timeline?.find((event) => event.event_type === 'delivered')
      ?.created_at ??
    null
  );
}

function summarizeOrderForHistory(order) {
  const itemCount =
    order.itemCount ??
    order.items?.reduce((sum, item) => sum + (item.quantity ?? 0), 0) ??
    0;

  return {
    uuid: order.uuid,
    orderCode: order.uuid.slice(0, 8).toUpperCase(),
    status: order.status,
    paymentStatus: order.payment_status,
    currency: order.currency,
    totalMinor: order.total_minor,
    placedAt: orderPlacedAt(order),
    deliveredAt: orderDeliveredAt(order),
    merchantName: order.merchantName ?? 'Talabix merchant',
    branchName: order.branchName ?? 'Talabix branch',
    branchUuid: order.branchUuid ?? null,
    itemCount,
    etaMinutes: order.etaMinutes ?? null,
    artworkLabel:
      order.artworkLabel ??
      order.items?.[0]?.name ??
      order.merchantName ??
      'Talabix order',
  };
}

function eligibleCartOffers(subtotalMinor) {
  if (!state.cart.branchUuid || subtotalMinor <= 0) {
    return [];
  }

  const cartItemUuidSet = new Set(
    state.cart.items.map((item) => item.catalog_item_uuid)
  );
  const redeemedPromoCodeSet = new Set(
    (state.cart.redeemedPromoCodes ?? []).map(normalizePromoCode).filter(Boolean)
  );

  return state.offers.filter(
    (offer) => {
      if (
        offer.branchUuid !== state.cart.branchUuid ||
        !cartItemUuidSet.has(offer.catalogItemUuid) ||
        subtotalMinor < (offer.minSpendMinor ?? 0)
      ) {
        return false;
      }

      if (!offer.requiresPromoCode) {
        return true;
      }

      return redeemedPromoCodeSet.has(normalizePromoCode(offer.promoCode));
    }
  );
}

function lineTotalForCatalogItem(catalogItemUuid) {
  return state.cart.items
    .filter((item) => item.catalog_item_uuid === catalogItemUuid)
    .reduce((sum, item) => sum + item.lineTotalMinor, 0);
}

function calculateCartDiscounts(subtotalMinor, deliveryFeeMinor) {
  const appliedOffers = [];
  const appliedOfferIds = [];
  let itemDiscountMinor = 0;
  let deliveryDiscountMinor = 0;

  for (const offer of eligibleCartOffers(subtotalMinor)) {
    const discountType = offer.discount?.type;
    let discountMinor = 0;

    if (discountType === 'delivery') {
      discountMinor = Math.max(0, deliveryFeeMinor - deliveryDiscountMinor);
      deliveryDiscountMinor += discountMinor;
    }

    if (discountType === 'item_percent') {
      const eligibleLineTotalMinor = lineTotalForCatalogItem(
        offer.catalogItemUuid
      );

      discountMinor = Math.floor(
        (eligibleLineTotalMinor * (offer.discount.percent ?? 0)) / 100
      );
      discountMinor = Math.min(
        discountMinor,
        Math.max(0, subtotalMinor - itemDiscountMinor)
      );
      itemDiscountMinor += discountMinor;
    }

    if (discountType === 'item_fixed') {
      const eligibleLineTotalMinor = lineTotalForCatalogItem(
        offer.catalogItemUuid
      );

      discountMinor = Math.min(
        eligibleLineTotalMinor,
        offer.discount.amountMinor ?? 0
      );
      discountMinor = Math.min(
        discountMinor,
        Math.max(0, subtotalMinor - itemDiscountMinor)
      );
      itemDiscountMinor += discountMinor;
    }

    if (discountMinor > 0) {
      appliedOfferIds.push(offer.id);
      appliedOffers.push({
        id: offer.id,
        title: offer.title,
        discountLabel: offer.discountLabel,
        discountMinor,
        discountType,
        promoCode: offer.requiresPromoCode
          ? normalizePromoCode(offer.promoCode)
          : null,
        requiresPromoCode: Boolean(offer.requiresPromoCode),
      });
    }
  }

  return {
    appliedOfferIds,
    appliedOffers,
    deliveryDiscountMinor,
    discountMinor: itemDiscountMinor + deliveryDiscountMinor,
    itemDiscountMinor,
  };
}

function catalogSelectionDefaults(catalogItem) {
  return (catalogItem.modifierGroups ?? []).flatMap((group) => {
    const activeOptions = (group.options ?? []).filter(
      (option) => option.isActive
    );
    const defaults = activeOptions.filter((option) => option.isDefault);
    const maxSelected =
      group.maxSelected ??
      (group.selectionType === 'single' ? 1 : activeOptions.length);
    const minimumCount = Math.min(
      group.minSelected ?? 0,
      maxSelected ?? activeOptions.length
    );

    if (minimumCount <= 0) {
      return defaults.slice(0, maxSelected ?? defaults.length);
    }

    return (defaults.length > 0 ? defaults : activeOptions).slice(
      0,
      minimumCount
    );
  });
}

function resolveSelectedModifierOptions(catalogItem, modifierOptionUuids = []) {
  const selectedOptionUuidSet = new Set(modifierOptionUuids);
  const selectedOptions = [];

  for (const group of catalogItem.modifierGroups ?? []) {
    const activeOptions = (group.options ?? []).filter(
      (option) => option.isActive
    );
    const groupSelections = activeOptions.filter((option) =>
      selectedOptionUuidSet.has(option.uuid)
    );
    const maxSelected =
      group.maxSelected ??
      (group.selectionType === 'single' ? 1 : activeOptions.length);

    if (groupSelections.length < (group.minSelected ?? 0)) {
      throw new Error(
        `${group.name} requires at least ${group.minSelected} selection(s).`
      );
    }

    if (maxSelected !== null && groupSelections.length > maxSelected) {
      throw new Error(
        `${group.name} allows at most ${maxSelected} selection(s).`
      );
    }

    for (const option of groupSelections) {
      selectedOptions.push({
        uuid: option.uuid,
        groupUuid: group.uuid,
        groupName: group.name,
        name: option.name,
        priceDeltaMinor: option.priceDeltaMinor,
      });
    }
  }

  if (selectedOptions.length !== selectedOptionUuidSet.size) {
    throw new Error(
      'One or more selected modifiers are invalid for this catalog item.'
    );
  }

  return selectedOptions;
}

function findMerchantByBranchUuid(branchUuid) {
  return state.merchants.find((merchant) =>
    merchant.branches.some((branch) => branch.uuid === branchUuid)
  );
}

function findBranchByUuid(branchUuid) {
  const merchant = findMerchantByBranchUuid(branchUuid);

  return (
    merchant?.branches.find((branch) => branch.uuid === branchUuid) ?? null
  );
}

async function summarizeCart() {
  const address = defaultAddress();
  const branch = state.cart.branchUuid
    ? findBranchByUuid(state.cart.branchUuid)
    : null;
  const merchant = state.cart.branchUuid
    ? findMerchantByBranchUuid(state.cart.branchUuid)
    : null;
  const projectedBranch =
    branch && address ? await projectBranch(branch, address) : null;
  const itemCount = state.cart.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const subtotalMinor = state.cart.items.reduce(
    (sum, item) => sum + item.lineTotalMinor,
    0
  );
  const deliveryFeeMinor =
    projectedBranch?.serviceability?.delivery_fee_minor ?? 0;
  const discounts = calculateCartDiscounts(subtotalMinor, deliveryFeeMinor);

  return cartSummarySchema.parse({
    branchUuid: state.cart.branchUuid ?? null,
    branchName: branch?.name ?? null,
    merchantName: merchant?.name ?? null,
    addressUuid: address?.uuid ?? null,
    itemCount,
    subtotalMinor,
    deliveryFeeMinor,
    itemDiscountMinor: discounts.itemDiscountMinor,
    deliveryDiscountMinor: discounts.deliveryDiscountMinor,
    discountMinor: discounts.discountMinor,
    totalMinor: Math.max(
      0,
      subtotalMinor +
        deliveryFeeMinor -
        discounts.itemDiscountMinor -
        discounts.deliveryDiscountMinor
    ),
    currency: 'SAR',
    notes: state.cart.notes ?? null,
    appliedOfferIds: discounts.appliedOfferIds,
    appliedOffers: discounts.appliedOffers,
    redeemedPromoCodes: state.cart.redeemedPromoCodes ?? [],
    items: state.cart.items,
  });
}

export async function getCurrentCustomer() {
  return userSchema.parse(state.session.user);
}

export async function registerCustomer(payload) {
  const parsedPayload = registerSchema.parse(payload);

  state.session = authSessionSchema.parse({
    token: `demo-${nextUuid()}`,
    user: {
      ...state.session.user,
      uuid: nextUuid(),
      name: parsedPayload.name,
      email: parsedPayload.email,
      phone: parsedPayload.phone,
    },
  });

  return state.session;
}

export async function updateCustomerProfile(payload) {
  const parsedPayload = customerProfileSchema.parse(payload);

  state.session.user = userSchema.parse({
    ...state.session.user,
    ...parsedPayload,
  });

  return state.session.user;
}

export async function getCustomerAddresses() {
  return state.addresses
    .slice()
    .sort((left, right) => Number(right.is_default) - Number(left.is_default))
    .map((address) => addressSchema.parse(address));
}

export async function createCustomerAddress(payload) {
  const parsedPayload = addressSchema
    .omit({ uuid: true })
    .parse(normalizeAddressPayload(payload));

  if (parsedPayload.is_default || state.addresses.length === 0) {
    state.addresses = state.addresses.map((address) => ({
      ...address,
      is_default: false,
    }));
  }

  const nextAddress = addressSchema.parse({
    uuid: nextUuid(),
    ...parsedPayload,
    is_default: parsedPayload.is_default || state.addresses.length === 0,
  });

  state.addresses = [nextAddress, ...state.addresses];

  return nextAddress;
}

export async function updateCustomerAddress(addressUuid, payload) {
  const parsedPayload = addressSchema
    .omit({ uuid: true })
    .parse(normalizeAddressPayload(payload));

  if (parsedPayload.is_default) {
    state.addresses = state.addresses.map((address) => ({
      ...address,
      is_default: false,
    }));
  }

  state.addresses = state.addresses.map((address) =>
    address.uuid === addressUuid
      ? addressSchema.parse({
          uuid: address.uuid,
          ...parsedPayload,
        })
      : address
  );

  if (
    !state.addresses.some((address) => address.is_default) &&
    state.addresses.length > 0
  ) {
    state.addresses[0] = {
      ...state.addresses[0],
      is_default: true,
    };
  }

  return addressSchema.parse(
    state.addresses.find((address) => address.uuid === addressUuid)
  );
}

export async function getFeaturedMerchant() {
  return merchantSummarySchema.parse(
    await projectMerchant(state.merchants[0], defaultAddress(), true)
  );
}

export async function searchCustomerPlaces(query) {
  const suggestions = await mapsProvider.searchPlaces(query);

  return suggestions.map((suggestion) =>
    placeSuggestionSchema.parse(suggestion)
  );
}

export async function listMerchants(query = {}) {
  const parsedQuery = merchantListQuerySchema.parse(
    Object.fromEntries(
      Object.entries(query).filter(
        ([, value]) => value !== undefined && value !== ''
      )
    )
  );
  const address = parsedQuery.address_uuid
    ? state.addresses.find(
        (candidate) => candidate.uuid === parsedQuery.address_uuid
      )
    : defaultAddress();

  const merchants = state.merchants
    .filter((merchant) => merchant.status === 'active')
    .filter((merchant) =>
      parsedQuery.search
        ? merchant.name.toLowerCase().includes(parsedQuery.search.toLowerCase())
        : true
    );
  const projectedMerchants = await Promise.all(
    merchants.map((merchant) =>
      projectMerchant(merchant, address, Boolean(parsedQuery.address_uuid))
    )
  );

  return projectedMerchants
    .filter((merchant) => merchant.branches.length > 0)
    .filter((merchant) =>
      parsedQuery.address_uuid ? merchant.is_serviceable : true
    )
    .filter((merchant) => (parsedQuery.open_now ? merchant.is_open_now : true))
    .map((merchant) => merchantSummarySchema.parse(merchant));
}

export async function getMerchantDetail(merchantUuid, query = {}) {
  const parsedQuery = merchantListQuerySchema
    .pick({ address_uuid: true })
    .parse(
      Object.fromEntries(
        Object.entries(query).filter(
          ([, value]) => value !== undefined && value !== ''
        )
      )
    );
  const merchant = state.merchants.find(
    (candidate) => candidate.uuid === merchantUuid
  );
  const address = parsedQuery.address_uuid
    ? state.addresses.find(
        (candidate) => candidate.uuid === parsedQuery.address_uuid
      )
    : defaultAddress();

  if (!merchant) {
    throw new Error('Merchant not found.');
  }

  return merchantDetailSchema.parse(
    await projectMerchant(merchant, address, false)
  );
}

export async function getBranchCatalog(branchUuid) {
  return (state.branchCatalogById[branchUuid] ?? []).map((item) =>
    catalogItemSchema.parse(item)
  );
}

export async function getCustomerOrderHistory() {
  const uniqueOrdersByUuid = new Map();

  [state.activeOrder, ...state.orders, ...state.orderHistory]
    .filter(Boolean)
    .forEach((order) => {
      uniqueOrdersByUuid.set(order.uuid, order);
    });

  return [...uniqueOrdersByUuid.values()]
    .map((order) => summarizeOrderForHistory(order))
    .sort(
      (left, right) =>
        new Date(right.placedAt ?? 0) - new Date(left.placedAt ?? 0)
    );
}

export async function getCustomerOffers() {
  return state.offers
    .map((offer) => {
      const catalogItem = (
        state.branchCatalogById[offer.branchUuid] ?? []
      ).find((item) => item.uuid === offer.catalogItemUuid);

      return {
        ...offer,
        itemName: offer.itemName ?? catalogItem?.name ?? offer.title,
        priceMinor: catalogItem?.priceMinor ?? null,
        artworkLabel:
          offer.artworkLabel ?? catalogItem?.name ?? offer.itemName ?? offer.title,
      };
    })
    .sort(
      (left, right) =>
        new Date(left.expiresAt ?? 0) - new Date(right.expiresAt ?? 0)
    );
}

export async function getCustomerNotifications(query = {}) {
  const parsedQuery = actorNotificationQuerySchema.parse(
    Object.fromEntries(
      Object.entries(query).filter(
        ([, value]) => value !== undefined && value !== ''
      )
    )
  );

  const data = state.notifications
    .filter((entry) =>
      parsedQuery.order_uuid
        ? entry.order_uuid === parsedQuery.order_uuid
        : true
    )
    .filter((entry) => (parsedQuery.unread_only ? !entry.read_at : true))
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
}

export async function markCustomerNotificationRead(notificationId) {
  state.notifications = state.notifications.map((entry) =>
    entry.id === notificationId
      ? {
          ...entry,
          read_at: entry.read_at ?? new Date().toISOString(),
        }
      : entry
  );

  const notification = state.notifications.find(
    (entry) => entry.id === notificationId
  );

  if (!notification) {
    throw new Error('Notification not found.');
  }

  return notificationDeliverySchema.parse(notification);
}

export async function getCartSummary() {
  return summarizeCart();
}

export async function reorderCustomerOrder(orderUuid) {
  const order = [...state.orderHistory, ...state.orders].find(
    (entry) => entry.uuid === orderUuid
  );

  if (!order?.branchUuid || !order.reorderItems?.length) {
    throw new Error('Order cannot be reordered from the current catalog.');
  }

  state.cart = {
    branchUuid: order.branchUuid,
    notes: '',
    redeemedPromoCodes: [],
    items: [],
  };

  for (const reorderItem of order.reorderItems) {
    const quantity = Math.max(1, Number(reorderItem.quantity ?? 1));

    for (let count = 0; count < quantity; count += 1) {
      await addBranchCatalogItemToCart(order.branchUuid, {
        catalog_item_uuid: reorderItem.catalogItemUuid,
        modifier_option_uuids: reorderItem.modifierOptionUuids ?? [],
      });
    }
  }

  return summarizeCart();
}

export async function addBranchCatalogItemToCart(branchUuid, payload) {
  const branch = findBranchByUuid(branchUuid);
  const catalogItemUuid =
    typeof payload === 'string' ? payload : payload?.catalog_item_uuid;
  const catalogItem = (state.branchCatalogById[branchUuid] ?? []).find(
    (item) => item.uuid === catalogItemUuid
  );

  if (!branch || !catalogItem) {
    throw new Error('Catalog item is not available for this branch.');
  }

  const selectedModifierOptions = resolveSelectedModifierOptions(
    catalogItem,
    typeof payload === 'string'
      ? catalogSelectionDefaults(catalogItem).map((option) => option.uuid)
      : (payload?.modifier_option_uuids ??
          catalogSelectionDefaults(catalogItem).map((option) => option.uuid))
  );
  const modifierTotalMinor = selectedModifierOptions.reduce(
    (sum, option) => sum + option.priceDeltaMinor,
    0
  );
  const lineId = `${catalogItem.uuid}:${
    selectedModifierOptions
      .map((option) => option.uuid)
      .sort()
      .join('.') || 'base'
  }`;

  if (state.cart.branchUuid !== branchUuid) {
    state.cart = {
      branchUuid,
      notes: state.cart.notes ?? '',
      redeemedPromoCodes: [],
      items: [],
    };
  }

  const existingItem = state.cart.items.find((item) => item.id === lineId);

  if (existingItem) {
    existingItem.quantity += 1;
    existingItem.lineTotalMinor =
      existingItem.quantity * existingItem.unitPriceMinor;
  } else {
    state.cart.items.push({
      id: lineId,
      catalog_item_uuid: catalogItem.uuid,
      name: catalogItem.name,
      quantity: 1,
      unitPriceMinor: catalogItem.priceMinor + modifierTotalMinor,
      lineTotalMinor: catalogItem.priceMinor + modifierTotalMinor,
      selectedModifierOptions,
    });
  }

  return summarizeCart();
}

export async function updateCartItemQuantity(lineId, quantity) {
  const parsedQuantity = Number(quantity);

  state.cart.items = state.cart.items
    .map((item) =>
      item.id === lineId
        ? {
            ...item,
            quantity: parsedQuantity,
            lineTotalMinor: parsedQuantity * item.unitPriceMinor,
          }
        : item
    )
    .filter((item) => item.quantity > 0);

  return summarizeCart();
}

export async function updateCartNotes(notes) {
  state.cart.notes = notes;

  return summarizeCart();
}

export async function redeemCartPromoCode(code) {
  const promoCode = normalizePromoCode(code);

  if (!promoCode) {
    throw new Error('Enter a promo code to apply.');
  }

  const subtotalMinor = state.cart.items.reduce(
    (sum, item) => sum + item.lineTotalMinor,
    0
  );
  const cartItemUuidSet = new Set(
    state.cart.items.map((item) => item.catalog_item_uuid)
  );
  const matchingOffer = state.offers.find(
    (offer) =>
      offer.requiresPromoCode &&
      normalizePromoCode(offer.promoCode) === promoCode &&
      offer.branchUuid === state.cart.branchUuid &&
      cartItemUuidSet.has(offer.catalogItemUuid) &&
      subtotalMinor >= (offer.minSpendMinor ?? 0)
  );

  if (!matchingOffer) {
    throw new Error('Promo code is not valid for this cart.');
  }

  state.cart.redeemedPromoCodes = Array.from(
    new Set([...(state.cart.redeemedPromoCodes ?? []), promoCode])
  );

  return summarizeCart();
}

export async function checkoutCart() {
  const summary = await summarizeCart();
  const address = defaultAddress();

  if (!summary.branchUuid || !address || summary.items.length === 0) {
    throw new Error('Cart is not ready for checkout.');
  }

  const payload = checkoutRequestSchema.parse({
    branch_uuid: summary.branchUuid,
    address_uuid: address.uuid,
    notes: summary.notes ?? null,
    items: summary.items.map((item) => ({
      catalog_item_uuid: item.catalog_item_uuid,
      quantity: item.quantity,
      modifier_option_uuids: item.selectedModifierOptions.map(
        (option) => option.uuid
      ),
    })),
  });

  const branch = findBranchByUuid(payload.branch_uuid);
  const merchant = findMerchantByBranchUuid(payload.branch_uuid);
  const now = new Date().toISOString();
  const order = orderSchema.parse({
    uuid: nextUuid(),
    status: 'placed',
    payment_status: 'pending_cod',
    currency: summary.currency,
    total_minor: summary.totalMinor,
    timeline: [
      {
        event_type: 'order_placed',
        created_at: now,
      },
    ],
  });

  state.activeOrder = {
    ...order,
    subtotal_minor: summary.subtotalMinor,
    delivery_fee_minor: summary.deliveryFeeMinor,
    discount_minor: summary.discountMinor,
    applied_offer_ids: summary.appliedOfferIds,
    pricing_snapshot: {
      applied_offer_ids: summary.appliedOfferIds,
      applied_offers: summary.appliedOffers,
      delivery_discount_minor: summary.deliveryDiscountMinor,
      discount_minor: summary.discountMinor,
      item_discount_minor: summary.itemDiscountMinor,
      redeemed_promo_codes: summary.redeemedPromoCodes,
      subtotal_minor: summary.subtotalMinor,
      total_minor: summary.totalMinor,
    },
    merchantName: merchant?.name,
    branchName: branch?.name,
    notes: summary.notes ?? null,
  };
  state.orders = [
    state.activeOrder,
    ...state.orders.filter((entry) => entry.uuid !== order.uuid),
  ];
  state.orderHistory = [
    state.activeOrder,
    ...state.orderHistory.filter((entry) => entry.uuid !== order.uuid),
  ];
  state.notifications = [
    notificationDeliverySchema.parse({
      id: Math.max(0, ...state.notifications.map((entry) => entry.id)) + 1,
      order_id: 9000 + state.orders.length,
      order_uuid: order.uuid,
      recipient_user_id: 301,
      recipient_actor: 'customer',
      recipient_name: state.session.user.name,
      recipient_email: state.session.user.email,
      notification_type: 'order_status_updated',
      channel: 'in_app',
      provider: 'internal',
      provider_reference: `internal:${order.uuid}:placed`,
      status: 'sent',
      attempt_count: 1,
      title: 'Order placed',
      body: `Order ${order.uuid.slice(0, 8).toUpperCase()} was placed successfully.`,
      payload: {
        order_uuid: order.uuid,
        status: 'placed',
      },
      queued_at: now,
      last_attempted_at: now,
      next_retry_at: null,
      last_error: null,
      sent_at: now,
      read_at: null,
      created_at: now,
    }),
    ...state.notifications,
  ];
  state.cart = {
    branchUuid: payload.branch_uuid,
    notes: '',
    redeemedPromoCodes: [],
    items: [],
  };

  return state.activeOrder;
}

export async function getCustomerOrder(orderId) {
  const order =
    state.orders.find((entry) => entry.uuid === orderId) ??
    (state.activeOrder?.uuid === orderId ? state.activeOrder : null);

  if (!order) {
    throw new Error('Order not found.');
  }

  return orderSchema.parse(order);
}

export async function getActiveOrder() {
  return orderSchema.parse(state.activeOrder);
}
