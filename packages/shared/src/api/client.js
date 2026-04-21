import axios from 'axios';
import { z } from 'zod';
import {
  addressSchema,
  actorNotificationQuerySchema,
  cartSummarySchema,
  catalogItemSchema,
  checkoutRequestSchema,
  authSessionSchema,
  branchCatalogOverrideInputSchema,
  branchFeeBandInputSchema,
  branchFeeBandSchema,
  branchServiceZoneInputSchema,
  branchServiceZoneSchema,
  customerProfileSchema,
  dispatchAssignmentSchema,
  dispatchReassignmentInputSchema,
  deliveryProofSchema,
  ledgerEntrySchema,
  managedMerchantSchema,
  mapsProviderConfigurationSchema,
  merchantSalesReportQuerySchema,
  merchantSalesReportSchema,
  merchantCatalogModifierGroupInputSchema,
  merchantCatalogModifierGroupSchema,
  merchantCatalogItemInputSchema,
  merchantCatalogItemSchema,
  merchantCatalogListQuerySchema,
  merchantOrderSchema,
  merchantDetailSchema,
  merchantListQuerySchema,
  merchantSummarySchema,
  notificationDeliverySchema,
  notificationInboxMetaSchema,
  notificationQueueMetaSchema,
  opsConfigBranchSchema,
  opsDashboardOverviewSchema,
  opsDashboardQuerySchema,
  orderSchema,
  opsMerchantConfigurationSchema,
  opsNotificationQuerySchema,
  placeSuggestionSchema,
  registerSchema,
  riderAvailabilitySchema,
  riderEarningsReportQuerySchema,
  riderEarningsReportSchema,
  riderOrderSchema,
  supportCaseInputSchema,
  supportCaseSchema,
  supportCaseUpdateSchema,
  cancelSupportOrderInputSchema,
  settlementAdjustmentSchema,
  settlementLedgerMetaSchema,
  settlementLedgerQuerySchema,
  supportNoteInputSchema,
  supportNoteSchema,
  supportOrderSchema,
  supportSearchQuerySchema,
  updateBranchConfigurationSchema,
  updateMapsProviderConfigurationSchema,
  updateMerchantConfigurationSchema,
  userSchema,
} from '../validation/schemas.js';

export function createApiClient({
  baseURL = 'http://localhost:8000/api/v1',
  actor,
  token,
} = {}) {
  const client = axios.create({
    baseURL: actor ? `${baseURL}/${actor}` : baseURL,
    headers: {
      Accept: 'application/json',
    },
  });

  if (token) {
    client.defaults.headers.Authorization = `Bearer ${token}`;
  }

  return client;
}

const addressInputSchema = addressSchema.omit({ uuid: true });

function unwrapData(response) {
  return response.data.data;
}

function compactParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );
}

export function createCustomerApi({ baseURL, token } = {}) {
  const client = createApiClient({
    baseURL,
    actor: 'customer',
    token,
  });

  return {
    client,
    setToken(nextToken) {
      if (nextToken) {
        client.defaults.headers.Authorization = `Bearer ${nextToken}`;
        return;
      }

      delete client.defaults.headers.Authorization;
    },
    async register(payload) {
      const parsedPayload = registerSchema.parse(payload);
      const data = unwrapData(
        await client.post('auth/register', parsedPayload)
      );

      return authSessionSchema.parse(data);
    },
    async getMe() {
      const data = unwrapData(await client.get('auth/me'));

      return userSchema.parse(data);
    },
    async updateProfile(payload) {
      const parsedPayload = customerProfileSchema.parse(compactParams(payload));
      const data = unwrapData(await client.patch('auth/me', parsedPayload));

      return userSchema.parse(data);
    },
    async listAddresses() {
      const data = unwrapData(await client.get('addresses'));

      return z.array(addressSchema).parse(data);
    },
    async createAddress(payload) {
      const parsedPayload = addressInputSchema.parse(payload);
      const data = unwrapData(await client.post('addresses', parsedPayload));

      return addressSchema.parse(data);
    },
    async updateAddress(addressUuid, payload) {
      const parsedPayload = addressInputSchema.parse(payload);
      const data = unwrapData(
        await client.patch(`addresses/${addressUuid}`, parsedPayload)
      );

      return addressSchema.parse(data);
    },
    async searchPlaces(query) {
      const response = await client.get('maps/places', {
        params: {
          query,
        },
      });

      return z.array(placeSuggestionSchema).parse(response.data.data);
    },
    async listMerchants(query = {}) {
      const parsedQuery = merchantListQuerySchema.parse(compactParams(query));
      const data = unwrapData(
        await client.get('merchants', { params: compactParams(parsedQuery) })
      );

      return z.array(merchantSummarySchema).parse(data);
    },
    async getMerchantDetail(merchantUuid, query = {}) {
      const parsedQuery = merchantListQuerySchema
        .pick({ address_uuid: true })
        .parse(compactParams(query));
      const data = unwrapData(
        await client.get(`merchants/${merchantUuid}`, {
          params: compactParams(parsedQuery),
        })
      );

      return merchantDetailSchema.parse(data);
    },
    async getBranchCatalog(branchUuid) {
      const data = unwrapData(
        await client.get(`branches/${branchUuid}/catalog`)
      );

      return z.array(catalogItemSchema).parse(
        data.map((item) => ({
          uuid: item.uuid,
          id: item.uuid,
          name: item.name,
          categoryName: item.category_name ?? null,
          description: item.description,
          imageUrl: item.image_url ?? null,
          priceMinor: item.effective_price_minor ?? item.base_price_minor,
          isAvailable: item.effective_is_available ?? item.is_active,
          stockQuantity:
            item.effective_stock_quantity ?? item.base_stock ?? null,
          modifierGroups: (item.modifier_groups ?? []).map((group) => ({
            uuid: group.uuid,
            name: group.name,
            description: group.description ?? null,
            selectionType: group.selection_type,
            minSelected: group.min_selected,
            maxSelected: group.max_selected ?? null,
            isActive: group.is_active,
            sortOrder: group.sort_order,
            options: (group.options ?? []).map((option) => ({
              uuid: option.uuid,
              name: option.name,
              description: option.description ?? null,
              priceDeltaMinor: option.price_delta_minor,
              isDefault: option.is_default,
              isActive: option.is_active,
              sortOrder: option.sort_order,
            })),
          })),
        }))
      );
    },
    async checkout(payload) {
      const parsedPayload = checkoutRequestSchema.parse(payload);
      const data = unwrapData(
        await client.post('orders/checkout', parsedPayload)
      );

      return data;
    },
    async listNotifications(query = {}) {
      const parsedQuery = actorNotificationQuerySchema.parse(
        compactParams(query)
      );
      const response = await client.get('notifications', {
        params: compactParams(parsedQuery),
      });

      return {
        data: z.array(notificationDeliverySchema).parse(response.data.data),
        meta: notificationInboxMetaSchema.parse(response.data.meta ?? {}),
      };
    },
    async markNotificationRead(notificationDeliveryId) {
      const data = unwrapData(
        await client.post(`notifications/${notificationDeliveryId}/read`)
      );

      return notificationDeliverySchema.parse(data);
    },
    parseCartSummary(payload) {
      return cartSummarySchema.parse(payload);
    },
  };
}

export function createMerchantApi({ baseURL, token } = {}) {
  const client = createApiClient({
    baseURL,
    actor: 'merchant',
    token,
  });

  return {
    client,
    async listManagedMerchants() {
      const data = unwrapData(await client.get('me/merchants'));

      return z.array(managedMerchantSchema).parse(data);
    },
    async getSalesReport(query) {
      const parsedQuery = merchantSalesReportQuerySchema.parse(
        compactParams(query)
      );
      const data = unwrapData(
        await client.get('reports/sales', {
          params: compactParams(parsedQuery),
        })
      );

      return merchantSalesReportSchema.parse(data);
    },
    async listCatalogItems(query) {
      const parsedQuery = merchantCatalogListQuerySchema.parse(
        compactParams(query)
      );
      const data = unwrapData(
        await client.get('catalog/items', {
          params: compactParams(parsedQuery),
        })
      );

      return z.array(merchantCatalogItemSchema).parse(data);
    },
    async createCatalogItem(payload) {
      const parsedPayload = merchantCatalogItemInputSchema.parse(payload);
      const data = unwrapData(
        await client.post('catalog/items', parsedPayload)
      );

      return merchantCatalogItemSchema.parse(data);
    },
    async updateCatalogItem(catalogItemUuid, payload) {
      const parsedPayload = merchantCatalogItemInputSchema.parse(payload);
      const data = unwrapData(
        await client.patch(`catalog/items/${catalogItemUuid}`, parsedPayload)
      );

      return merchantCatalogItemSchema.parse(data);
    },
    async createModifierGroup(catalogItemUuid, payload) {
      const parsedPayload =
        merchantCatalogModifierGroupInputSchema.parse(payload);
      const data = unwrapData(
        await client.post(
          `catalog/items/${catalogItemUuid}/modifier-groups`,
          parsedPayload
        )
      );

      return merchantCatalogModifierGroupSchema.parse(data);
    },
    async updateModifierGroup(catalogItemUuid, modifierGroupUuid, payload) {
      const parsedPayload =
        merchantCatalogModifierGroupInputSchema.parse(payload);
      const data = unwrapData(
        await client.patch(
          `catalog/items/${catalogItemUuid}/modifier-groups/${modifierGroupUuid}`,
          parsedPayload
        )
      );

      return merchantCatalogModifierGroupSchema.parse(data);
    },
    async upsertBranchOverride(branchUuid, catalogItemUuid, payload) {
      const parsedPayload = branchCatalogOverrideInputSchema.parse(payload);
      const response = await client.post(
        `branches/${branchUuid}/catalog-overrides/${catalogItemUuid}`,
        parsedPayload
      );

      return {
        branch_uuid: response.data.data.branch_uuid,
        catalog_item_uuid: response.data.data.catalog_item_uuid,
        override: response.data.data.override,
      };
    },
    async listBranchOrders(branchUuid) {
      const data = unwrapData(
        await client.get(`branches/${branchUuid}/orders`)
      );

      return z.array(merchantOrderSchema).parse(data);
    },
    async getOrder(orderUuid) {
      const data = unwrapData(await client.get(`orders/${orderUuid}`));

      return merchantOrderSchema.parse(data);
    },
    async acceptOrder(orderUuid) {
      const data = unwrapData(await client.post(`orders/${orderUuid}/accept`));

      return merchantOrderSchema.parse(data);
    },
    async rejectOrder(orderUuid) {
      const data = unwrapData(await client.post(`orders/${orderUuid}/reject`));

      return merchantOrderSchema.parse(data);
    },
    async startPreparingOrder(orderUuid) {
      const data = unwrapData(
        await client.post(`orders/${orderUuid}/start-preparing`)
      );

      return merchantOrderSchema.parse(data);
    },
    async markReadyForPickup(orderUuid) {
      const data = unwrapData(
        await client.post(`orders/${orderUuid}/ready-for-pickup`)
      );

      return merchantOrderSchema.parse(data);
    },
    async listNotifications(query = {}) {
      const parsedQuery = actorNotificationQuerySchema.parse(
        compactParams(query)
      );
      const response = await client.get('notifications', {
        params: compactParams(parsedQuery),
      });

      return {
        data: z.array(notificationDeliverySchema).parse(response.data.data),
        meta: notificationInboxMetaSchema.parse(response.data.meta ?? {}),
      };
    },
    async markNotificationRead(notificationDeliveryId) {
      const data = unwrapData(
        await client.post(`notifications/${notificationDeliveryId}/read`)
      );

      return notificationDeliverySchema.parse(data);
    },
    parseOrder(payload) {
      return orderSchema.parse(payload);
    },
  };
}

export function createRiderApi({ baseURL, token } = {}) {
  const client = createApiClient({
    baseURL,
    actor: 'rider',
    token,
  });

  return {
    client,
    async getMe() {
      const data = unwrapData(await client.get('auth/me'));

      return userSchema.parse(data);
    },
    async updateAvailability(availability) {
      const parsedAvailability = riderAvailabilitySchema.parse(availability);
      const data = unwrapData(
        await client.post('availability', { availability: parsedAvailability })
      );

      return data;
    },
    async listCurrentAssignments() {
      const data = unwrapData(await client.get('assignments/current'));

      return z.array(riderOrderSchema).parse(data);
    },
    async getEarningsReport(query = {}) {
      const parsedQuery = riderEarningsReportQuerySchema.parse(
        compactParams(query)
      );
      const data = unwrapData(
        await client.get('earnings', { params: compactParams(parsedQuery) })
      );

      return riderEarningsReportSchema.parse(data);
    },
    async getOrder(orderUuid) {
      const data = unwrapData(await client.get(`orders/${orderUuid}`));

      return riderOrderSchema.parse(data);
    },
    async acceptAssignment(orderUuid) {
      const data = unwrapData(
        await client.post(`orders/${orderUuid}/accept-assignment`)
      );

      return riderOrderSchema.parse(data);
    },
    async confirmPickup(orderUuid) {
      const data = unwrapData(
        await client.post(`orders/${orderUuid}/picked-up`)
      );

      return riderOrderSchema.parse(data);
    },
    async completeDelivery(orderUuid, payload) {
      const parsedPayload = deliveryProofSchema.parse(payload);
      const data = unwrapData(
        await client.post(`orders/${orderUuid}/delivered`, parsedPayload)
      );

      return riderOrderSchema.parse(data);
    },
    async listNotifications(query = {}) {
      const parsedQuery = actorNotificationQuerySchema.parse(
        compactParams(query)
      );
      const response = await client.get('notifications', {
        params: compactParams(parsedQuery),
      });

      return {
        data: z.array(notificationDeliverySchema).parse(response.data.data),
        meta: notificationInboxMetaSchema.parse(response.data.meta ?? {}),
      };
    },
    async markNotificationRead(notificationDeliveryId) {
      const data = unwrapData(
        await client.post(`notifications/${notificationDeliveryId}/read`)
      );

      return notificationDeliverySchema.parse(data);
    },
    parseOrder(payload) {
      return riderOrderSchema.parse(payload);
    },
  };
}

export function createOpsApi({ baseURL, token } = {}) {
  const client = createApiClient({
    baseURL,
    actor: 'ops',
    token,
  });

  return {
    client,
    async getDashboardOverview(query = {}) {
      const parsedQuery = opsDashboardQuerySchema.parse(compactParams(query));
      const data = unwrapData(
        await client.get('dashboard/overview', {
          params: compactParams(parsedQuery),
        })
      );

      return opsDashboardOverviewSchema.parse(data);
    },
    async listDispatchAssignments() {
      const data = unwrapData(await client.get('dispatch/assignments'));

      return z.array(dispatchAssignmentSchema).parse(data);
    },
    async reassignDispatchOrder(orderUuid, payload) {
      const parsedPayload = dispatchReassignmentInputSchema.parse(payload);
      const data = unwrapData(
        await client.post(
          `dispatch/orders/${orderUuid}/reassign`,
          parsedPayload
        )
      );

      return merchantOrderSchema.parse(data);
    },
    async searchSupportOrders(query = {}) {
      const parsedQuery = supportSearchQuerySchema.parse(compactParams(query));
      const data = unwrapData(
        await client.get('support/orders/search', {
          params: compactParams(parsedQuery),
        })
      );

      return z.array(supportOrderSchema).parse(data);
    },
    async createOrUpdateSupportCase(orderUuid, payload) {
      const parsedPayload = supportCaseInputSchema.parse(payload);
      const data = unwrapData(
        await client.post(`support/orders/${orderUuid}/cases`, parsedPayload)
      );

      return supportCaseSchema.parse(data);
    },
    async updateSupportCase(supportCaseUuid, payload) {
      const parsedPayload = supportCaseUpdateSchema.parse(
        compactParams(payload)
      );
      const data = unwrapData(
        await client.patch(`support/cases/${supportCaseUuid}`, parsedPayload)
      );

      return supportCaseSchema.parse(data);
    },
    async listMerchantConfigurations() {
      const data = unwrapData(await client.get('configuration/merchants'));

      return z.array(opsMerchantConfigurationSchema).parse(data);
    },
    async getMapsProviderConfiguration() {
      const data = unwrapData(await client.get('configuration/maps-provider'));

      return mapsProviderConfigurationSchema.parse(data);
    },
    async updateMapsProviderConfiguration(payload) {
      const parsedPayload = updateMapsProviderConfigurationSchema.parse(
        Object.fromEntries(
          Object.entries(payload).filter(
            ([, value]) => value !== undefined && value !== ''
          )
        )
      );
      const data = unwrapData(
        await client.patch('configuration/maps-provider', parsedPayload)
      );

      return mapsProviderConfigurationSchema.parse(data);
    },
    async getMerchantConfiguration(merchantUuid) {
      const data = unwrapData(
        await client.get(`configuration/merchants/${merchantUuid}`)
      );

      return opsMerchantConfigurationSchema.parse(data);
    },
    async updateMerchantConfiguration(merchantUuid, payload) {
      const parsedPayload = updateMerchantConfigurationSchema.parse(
        compactParams(payload)
      );
      const data = unwrapData(
        await client.patch(
          `configuration/merchants/${merchantUuid}`,
          parsedPayload
        )
      );

      return opsMerchantConfigurationSchema.parse(data);
    },
    async updateBranchConfiguration(branchUuid, payload) {
      const parsedPayload = updateBranchConfigurationSchema.parse(
        compactParams(payload)
      );
      const data = unwrapData(
        await client.patch(
          `configuration/branches/${branchUuid}`,
          parsedPayload
        )
      );

      return opsConfigBranchSchema.parse(data);
    },
    async createServiceZone(branchUuid, payload) {
      const parsedPayload = branchServiceZoneInputSchema.parse(payload);
      const data = unwrapData(
        await client.post(
          `configuration/branches/${branchUuid}/service-zones`,
          parsedPayload
        )
      );

      return branchServiceZoneSchema.parse(data);
    },
    async updateServiceZone(serviceZoneUuid, payload) {
      const parsedPayload = branchServiceZoneInputSchema.parse(payload);
      const data = unwrapData(
        await client.patch(
          `configuration/service-zones/${serviceZoneUuid}`,
          parsedPayload
        )
      );

      return branchServiceZoneSchema.parse(data);
    },
    async createFeeBand(branchUuid, payload) {
      const parsedPayload = branchFeeBandInputSchema.parse(payload);
      const data = unwrapData(
        await client.post(
          `configuration/branches/${branchUuid}/fee-bands`,
          parsedPayload
        )
      );

      return branchFeeBandSchema.parse(data);
    },
    async updateFeeBand(feeBandUuid, payload) {
      const parsedPayload = branchFeeBandInputSchema.parse(payload);
      const data = unwrapData(
        await client.patch(
          `configuration/fee-bands/${feeBandUuid}`,
          parsedPayload
        )
      );

      return branchFeeBandSchema.parse(data);
    },
    async cancelSupportOrder(orderUuid, payload) {
      const parsedPayload = cancelSupportOrderInputSchema.parse(payload);
      const data = unwrapData(
        await client.post(`support/orders/${orderUuid}/cancel`, parsedPayload)
      );

      return supportOrderSchema.parse(data);
    },
    async createSupportNote(orderUuid, payload) {
      const parsedPayload = supportNoteInputSchema.parse(payload);
      const data = unwrapData(
        await client.post(`support/orders/${orderUuid}/notes`, parsedPayload)
      );

      return supportNoteSchema.parse(data);
    },
    async listNotifications(query = {}) {
      const parsedQuery = opsNotificationQuerySchema.parse(
        compactParams(query)
      );
      const response = await client.get('notifications', {
        params: compactParams(parsedQuery),
      });

      return {
        data: z.array(notificationDeliverySchema).parse(response.data.data),
        meta: notificationQueueMetaSchema.parse(response.data.meta ?? {}),
      };
    },
    async retryNotification(notificationDeliveryId) {
      const data = unwrapData(
        await client.post(`notifications/${notificationDeliveryId}/retry`)
      );

      return notificationDeliverySchema.parse(data);
    },
    async listSettlementLedger(query = {}) {
      const parsedQuery = settlementLedgerQuerySchema.parse(
        compactParams(query)
      );
      const response = await client.get('settlements/ledger', {
        params: compactParams(parsedQuery),
      });

      return {
        data: z.array(ledgerEntrySchema).parse(response.data.data),
        meta: settlementLedgerMetaSchema.parse(response.data.meta ?? {}),
      };
    },
    async createSettlementAdjustment(orderUuid, payload) {
      const parsedPayload = settlementAdjustmentSchema.parse(payload);
      const data = unwrapData(
        await client.post(
          `settlements/orders/${orderUuid}/adjustments`,
          parsedPayload
        )
      );

      return ledgerEntrySchema.parse(data);
    },
  };
}
