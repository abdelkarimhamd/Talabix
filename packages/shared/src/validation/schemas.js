import { z } from 'zod';
import {
  auditActionTypes,
  deliveryExceptionReasonCodes,
  dispatchReassignmentReasonCodes,
  ledgerEntryTypes,
  notificationChannels,
  notificationDeliveryStatuses,
  notificationProviders,
  notificationTypes,
  orderStatuses,
  orderTimelineEventTypes,
  paymentStatuses,
  riderAvailabilities,
  supportCancellationReasonCodes,
  supportCaseStatuses,
  supportIssueTypes,
  supportResolutionTypes,
} from '../contracts/enums.js';

export const userSchema = z.object({
  uuid: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  account_status: z.string().min(1),
  roles: z.array(z.string()),
  abilities: z.array(z.string()).default([]),
});

export const opsUserSchema = userSchema.extend({
  created_at: z.string().nullable().optional(),
  last_login_at: z.string().nullable().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  device_name: z.string().min(2),
});

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1),
    password: z.string().min(8),
    password_confirmation: z.string().min(8),
  })
  .refine((payload) => payload.password === payload.password_confirmation, {
    path: ['password_confirmation'],
    message: 'Passwords must match.',
  });

const opsUserInputBaseSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
  role: z.enum(['ops_admin', 'ops_dispatcher', 'ops_support']),
  account_status: z
    .enum(['active', 'suspended', 'pending'])
    .optional()
    .default('active'),
  password: z.string().min(8).optional(),
  password_confirmation: z.string().min(8).optional(),
});

export const opsUserInputSchema = opsUserInputBaseSchema.refine(
  (payload) =>
    payload.password === undefined ||
    payload.password === payload.password_confirmation,
  {
    path: ['password_confirmation'],
    message: 'Passwords must match.',
  }
);

export const createOpsUserInputSchema = opsUserInputBaseSchema
  .required({
    email: true,
    password: true,
    password_confirmation: true,
  })
  .refine((payload) => payload.password === payload.password_confirmation, {
    path: ['password_confirmation'],
    message: 'Passwords must match.',
  });

export const updateOpsUserInputSchema = opsUserInputBaseSchema
  .omit({
    email: true,
    password: true,
    password_confirmation: true,
  })
  .partial();

export const registerSchema = z
  .object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(8),
    password: z.string().min(8),
    password_confirmation: z.string().min(8),
    device_name: z.string().min(2),
  })
  .refine((payload) => payload.password === payload.password_confirmation, {
    path: ['password_confirmation'],
    message: 'Passwords must match.',
  });

export const authSessionSchema = z.object({
  token: z.string().min(1),
  user: userSchema,
});

export const customerProfileSchema = z
  .object({
    name: z.string().min(1).optional(),
    phone: z.string().min(8).optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'Provide at least one profile field.',
  });

export const addressSchema = z.object({
  uuid: z.string().uuid().optional(),
  label: z.string().min(1),
  line_1: z.string().min(1),
  line_2: z.string().nullable().optional(),
  building: z.string().nullable().optional(),
  floor: z.string().nullable().optional(),
  apartment: z.string().nullable().optional(),
  landmark: z.string().nullable().optional(),
  delivery_notes: z.string().nullable().optional(),
  city: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  is_default: z.boolean().default(false),
});

export const coordinatesSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

export const placeSuggestionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  label: z.string().min(1),
  line_1: z.string().min(1),
  line_2: z.string().nullable().optional(),
  building: z.string().nullable().optional(),
  landmark: z.string().nullable().optional(),
  city: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
});

export const routeEstimateSchema = z.object({
  mode: z.enum(['driving', 'walking']),
  distance_meters: z.number().int().nonnegative(),
  duration_minutes: z.number().int().positive(),
  provider: z.string().min(1),
});

export const navigationHandoffSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
  mode: z.enum(['driving', 'walking']),
  provider: z.string().min(1),
});

export const merchantListQuerySchema = z.object({
  address_uuid: z.string().uuid().optional(),
  search: z.string().trim().min(1).optional(),
  open_now: z.boolean().optional(),
});

export const reportRangeSchema = z.object({
  range_days: z.number().int().min(1).max(90).optional(),
});

export const merchantSalesReportQuerySchema = reportRangeSchema.extend({
  merchant_uuid: z.string().uuid(),
});

export const branchHoursSummarySchema = z
  .object({
    day_of_week: z.number().int().min(0).max(6),
    opens_at: z.string().nullable(),
    closes_at: z.string().nullable(),
    is_closed: z.boolean(),
  })
  .nullable();

export const branchServiceabilitySchema = z
  .object({
    address_uuid: z.string().uuid(),
    is_serviceable: z.boolean(),
    distance_meters: z.number().int(),
    delivery_fee_minor: z.number().int().nullable(),
    estimated_duration_minutes: z
      .number()
      .int()
      .positive()
      .nullable()
      .optional(),
    maps_provider: z.string().min(1).optional(),
  })
  .nullable();

export const branchSummarySchema = z.object({
  uuid: z.string().uuid(),
  name: z.string().min(1),
  status: z.string().min(1),
  city: z.string().min(1),
  address_line: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  accepts_orders: z.boolean(),
  is_open_now: z.boolean(),
  today_hours: branchHoursSummarySchema,
  serviceability: branchServiceabilitySchema,
});

export const managedMerchantBranchSchema = z.object({
  uuid: z.string().uuid(),
  name: z.string().min(1),
  status: z.string().min(1),
  city: z.string().min(1),
  address_line: z.string().min(1),
});

export const merchantSummarySchema = z.object({
  uuid: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  status: z.string().min(1),
  is_open_now: z.boolean(),
  is_serviceable: z.boolean().nullable(),
  serviceable_branch_count: z.number().int().nullable(),
  branches: z.array(branchSummarySchema),
});

export const merchantDetailSchema = merchantSummarySchema;
export const managedMerchantSchema = z.object({
  uuid: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  status: z.string().min(1),
  branches: z.array(managedMerchantBranchSchema).default([]),
});

export const reportRangeMetaSchema = z.object({
  range_days: z.number().int().min(1).max(90),
  starts_at: z.union([z.string(), z.date()]),
  ends_at: z.union([z.string(), z.date()]),
});

export const merchantSalesSummarySchema = z.object({
  total_orders: z.number().int().nonnegative(),
  active_orders: z.number().int().nonnegative(),
  delivered_orders: z.number().int().nonnegative(),
  cancelled_orders: z.number().int().nonnegative(),
  gross_sales_minor: z.number().int(),
  completed_sales_minor: z.number().int(),
  delivery_fees_minor: z.number().int(),
  average_order_value_minor: z.number().int(),
  currency: z.string().length(3),
});

export const merchantSalesDailyPointSchema = z.object({
  date: z.string().min(1),
  orders_count: z.number().int().nonnegative(),
  delivered_orders: z.number().int().nonnegative(),
  gross_sales_minor: z.number().int(),
  completed_sales_minor: z.number().int(),
});

export const merchantSalesBranchBreakdownSchema = z.object({
  branch_uuid: z.string().uuid().nullable().optional(),
  branch_name: z.string().min(1),
  total_orders: z.number().int().nonnegative(),
  delivered_orders: z.number().int().nonnegative(),
  cancelled_orders: z.number().int().nonnegative(),
  gross_sales_minor: z.number().int(),
  completed_sales_minor: z.number().int(),
});

export const merchantTopItemSchema = z.object({
  item_name: z.string().min(1),
  quantity_sold: z.number().int().nonnegative(),
  gross_sales_minor: z.number().int(),
});

export const merchantSalesReportSchema = z.object({
  merchant: managedMerchantSchema.pick({
    uuid: true,
    name: true,
    slug: true,
    status: true,
  }),
  range: reportRangeMetaSchema,
  summary: merchantSalesSummarySchema,
  daily_sales: z.array(merchantSalesDailyPointSchema),
  branch_breakdown: z.array(merchantSalesBranchBreakdownSchema),
  top_items: z.array(merchantTopItemSchema),
});

export const opsDashboardQuerySchema = reportRangeSchema;

export const opsDashboardKpiSchema = z.object({
  total_orders: z.number().int().nonnegative(),
  active_orders: z.number().int().nonnegative(),
  delivered_orders: z.number().int().nonnegative(),
  cancelled_orders: z.number().int().nonnegative(),
  gross_sales_minor: z.number().int(),
  completed_sales_minor: z.number().int(),
  delivery_fees_minor: z.number().int(),
  active_merchants: z.number().int().nonnegative(),
  accepting_branches: z.number().int().nonnegative(),
  available_riders: z.number().int().nonnegative(),
  busy_riders: z.number().int().nonnegative(),
  offline_riders: z.number().int().nonnegative(),
});

export const opsDashboardFinancialsSchema = z.object({
  merchant_receivable_minor: z.number().int(),
  platform_commission_minor: z.number().int(),
  rider_earning_minor: z.number().int(),
  adjustment_minor: z.number().int(),
  net_platform_minor: z.number().int(),
  currency: z.string().length(3),
});

export const opsDashboardStatusBreakdownSchema = z.object({
  status: z.enum(orderStatuses),
  count: z.number().int().nonnegative(),
});

export const opsDashboardDailyPointSchema = z.object({
  date: z.string().min(1),
  total_orders: z.number().int().nonnegative(),
  delivered_orders: z.number().int().nonnegative(),
  cancelled_orders: z.number().int().nonnegative(),
  gross_sales_minor: z.number().int(),
  completed_sales_minor: z.number().int(),
});

export const opsDashboardMerchantBreakdownSchema = z.object({
  merchant_uuid: z.string().uuid().nullable().optional(),
  merchant_name: z.string().min(1),
  total_orders: z.number().int().nonnegative(),
  delivered_orders: z.number().int().nonnegative(),
  gross_sales_minor: z.number().int(),
  completed_sales_minor: z.number().int(),
});

export const riderEarningsBreakdownSchema = z.object({
  rider_uuid: z.string().uuid().nullable().optional(),
  rider_name: z.string().min(1),
  deliveries_count: z.number().int().nonnegative(),
  earnings_minor: z.number().int(),
  average_per_delivery_minor: z.number().int(),
});

export const riderEarningsSummarySchema = z.object({
  total_earnings_minor: z.number().int(),
  total_deliveries: z.number().int().nonnegative(),
  average_per_delivery_minor: z.number().int(),
  riders: z.array(riderEarningsBreakdownSchema),
});

export const opsDashboardOverviewSchema = z.object({
  range: reportRangeMetaSchema,
  kpis: opsDashboardKpiSchema,
  financials: opsDashboardFinancialsSchema,
  order_status_breakdown: z.array(opsDashboardStatusBreakdownSchema),
  daily_orders: z.array(opsDashboardDailyPointSchema),
  merchant_sales: z.array(opsDashboardMerchantBreakdownSchema),
  rider_earnings: riderEarningsSummarySchema,
});

export const riderEarningsReportQuerySchema = reportRangeSchema;

export const riderEarningsReportRiderSchema = z.object({
  uuid: z.string().uuid(),
  name: z.string().min(1),
  availability: z.enum(riderAvailabilities),
});

export const riderEarningsReportSummarySchema = z.object({
  deliveries_count: z.number().int().nonnegative(),
  earnings_minor: z.number().int(),
  average_per_delivery_minor: z.number().int(),
  currency: z.string().length(3),
});

export const riderEarningsDailyPointSchema = z.object({
  date: z.string().min(1),
  deliveries_count: z.number().int().nonnegative(),
  earnings_minor: z.number().int(),
});

export const riderEarningsOrderSchema = z.object({
  order_uuid: z.string().uuid().nullable(),
  merchant_name: z.string().min(1),
  branch_name: z.string().min(1),
  delivered_at: z.string().nullable(),
  occurred_at: z.string().nullable(),
  earning_minor: z.number().int(),
  currency: z.string().length(3),
});

export const riderEarningsReportSchema = z.object({
  rider: riderEarningsReportRiderSchema,
  range: reportRangeMetaSchema,
  summary: riderEarningsReportSummarySchema,
  daily_earnings: z.array(riderEarningsDailyPointSchema),
  orders: z.array(riderEarningsOrderSchema),
});

export const branchServiceZoneSchema = z.object({
  uuid: z.string().uuid(),
  name: z.string().min(1),
  city: z.string().min(1),
  postal_code: z.string().nullable().optional(),
  center_latitude: z.number(),
  center_longitude: z.number(),
  radius_meters: z.number().int().positive(),
  is_active: z.boolean(),
});

export const branchFeeBandSchema = z.object({
  uuid: z.string().uuid(),
  min_distance_meters: z.number().int().nonnegative(),
  max_distance_meters: z.number().int().positive(),
  fee_minor: z.number().int().nonnegative(),
});

export const opsConfigBranchSchema = managedMerchantBranchSchema.extend({
  latitude: z.number(),
  longitude: z.number(),
  accepts_orders: z.boolean(),
  service_zones: z.array(branchServiceZoneSchema).default([]),
  fee_bands: z.array(branchFeeBandSchema).default([]),
});

export const opsMerchantConfigurationSchema = z.object({
  uuid: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  status: z.string().min(1),
  platform_commission_bps: z.number().int().min(0).max(10000),
  branches: z.array(opsConfigBranchSchema).default([]),
});

export const updateMerchantConfigurationSchema = z
  .object({
    status: z.enum(['active', 'inactive']).optional(),
    platform_commission_bps: z.number().int().min(0).max(10000).optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'Provide at least one merchant configuration field.',
  });

export const updateBranchConfigurationSchema = z
  .object({
    status: z.enum(['active', 'inactive']).optional(),
    accepts_orders: z.boolean().optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'Provide at least one branch configuration field.',
  });

export const mapsProviderConfigurationSchema = z.object({
  provider: z.enum(['google_maps', 'demo']),
  google_maps: z.object({
    api_key_configured: z.boolean(),
    api_key_source: z.enum(['admin', 'env', 'none']),
    api_key_preview: z.string().nullable().optional(),
    region: z.string().min(1),
    location_bias: z.string().nullable().optional(),
    timeout_seconds: z.number().min(0.5).max(30),
    fallback_to_demo: z.boolean(),
  }),
  runtime: z.object({
    ready: z.boolean(),
    fallback_active: z.boolean(),
    message: z.string().min(1),
  }),
});

export const updateMapsProviderConfigurationSchema = z
  .object({
    provider: z.enum(['google_maps', 'demo']).optional(),
    google_maps_api_key: z.string().trim().min(1).optional(),
    clear_google_maps_api_key: z.boolean().optional(),
    google_maps_region: z.string().trim().min(1).optional(),
    google_maps_location_bias: z.string().trim().nullable().optional(),
    google_maps_timeout_seconds: z.number().min(0.5).max(30).optional(),
    google_maps_fallback_to_demo: z.boolean().optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'Provide at least one maps provider configuration field.',
  });

export const branchServiceZoneInputSchema = branchServiceZoneSchema.omit({
  uuid: true,
});

export const branchFeeBandInputSchema = branchFeeBandSchema.omit({
  uuid: true,
});

export const createMerchantInputSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  platform_commission_bps: z.number().int().min(0).max(10000).optional(),
  branch: z.object({
    name: z.string().min(1).max(255),
    city: z.string().min(1).max(120),
    address_line: z.string().min(1).max(255),
    latitude: z.number(),
    longitude: z.number(),
    hours: z
      .array(
        z.object({
          day_of_week: z.number().int().min(0).max(6),
          opens_at: z.string().nullable().optional(),
          closes_at: z.string().nullable().optional(),
        })
      )
      .min(1),
    zones: z
      .array(
        z.object({
          name: z.string().min(1),
          city: z.string().min(1),
          postal_code: z.string().nullable().optional(),
          center_latitude: z.number(),
          center_longitude: z.number(),
          radius_meters: z.number().int().min(100),
        })
      )
      .min(1),
    fee_bands: z
      .array(
        z.object({
          min_distance_meters: z.number().int().nonnegative(),
          max_distance_meters: z.number().int().positive(),
          fee_minor: z.number().int().nonnegative(),
        })
      )
      .min(1),
  }),
});

export const catalogItemSchema = z.object({
  uuid: z.string().uuid().optional(),
  id: z.string().optional(),
  name: z.string().min(1),
  categoryName: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  priceMinor: z.number().int().nonnegative(),
  isAvailable: z.boolean().optional(),
  stockQuantity: z.number().int().nullable().optional(),
  modifierGroups: z
    .array(
      z.object({
        uuid: z.string().uuid(),
        name: z.string().min(1),
        description: z.string().nullable().optional(),
        selectionType: z.enum(['single', 'multiple']),
        minSelected: z.number().int().nonnegative(),
        maxSelected: z.number().int().positive().nullable().optional(),
        isActive: z.boolean(),
        sortOrder: z.number().int().nonnegative(),
        options: z.array(
          z.object({
            uuid: z.string().uuid(),
            name: z.string().min(1),
            description: z.string().nullable().optional(),
            priceDeltaMinor: z.number().int().nonnegative(),
            isDefault: z.boolean(),
            isActive: z.boolean(),
            sortOrder: z.number().int().nonnegative(),
          })
        ),
      })
    )
    .default([]),
});

export const merchantCatalogListQuerySchema = z.object({
  merchant_uuid: z.string().uuid(),
});

export const merchantCatalogBranchOverrideSchema = z.object({
  branch_uuid: z.string().uuid().nullable().optional(),
  branch_name: z.string().nullable().optional(),
  price_minor: z.number().int().nullable().optional(),
  stock_quantity: z.number().int().nullable().optional(),
  is_available: z.boolean(),
});

export const merchantCatalogModifierOptionSchema = z.object({
  uuid: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  price_delta_minor: z.number().int().nonnegative(),
  is_default: z.boolean(),
  is_active: z.boolean(),
  sort_order: z.number().int().nonnegative(),
});

export const merchantCatalogModifierGroupSchema = z.object({
  uuid: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  selection_type: z.enum(['single', 'multiple']),
  min_selected: z.number().int().nonnegative(),
  max_selected: z.number().int().positive().nullable().optional(),
  is_active: z.boolean(),
  sort_order: z.number().int().nonnegative(),
  options: z.array(merchantCatalogModifierOptionSchema).default([]),
});

export const merchantCatalogItemSchema = z.object({
  uuid: z.string().uuid(),
  merchant_id: z.number().int(),
  merchant_uuid: z.string().uuid().nullable().optional(),
  name: z.string().min(1),
  category_name: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  base_price_minor: z.number().int().nonnegative(),
  base_stock: z.number().int().nullable().optional(),
  is_active: z.boolean(),
  effective_branch_uuid: z.string().uuid().nullable().optional(),
  effective_price_minor: z.number().int().nullable().optional(),
  effective_stock_quantity: z.number().int().nullable().optional(),
  effective_is_available: z.boolean().optional(),
  modifier_groups: z.array(merchantCatalogModifierGroupSchema).default([]),
  branch_overrides: z.array(merchantCatalogBranchOverrideSchema).default([]),
});

export const merchantCatalogItemInputSchema = z.object({
  merchant_uuid: z.string().uuid(),
  name: z.string().min(1),
  category_name: z.string().trim().max(255).nullable().optional(),
  sku: z.string().trim().max(255).nullable().optional(),
  description: z.string().nullable().optional(),
  image_url: z.string().url().max(2048).nullable().optional(),
  base_price_minor: z.number().int().nonnegative(),
  base_stock: z.number().int().nullable().optional(),
  is_active: z.boolean().default(true),
});

export const promotionOfferSchema = z.object({
  uuid: z.string().uuid(),
  merchant_uuid: z.string().uuid().nullable().optional(),
  merchant_name: z.string().nullable().optional(),
  branch_uuid: z.string().uuid(),
  branch_name: z.string().nullable().optional(),
  catalog_item_uuid: z.string().uuid().nullable().optional(),
  catalog_item_name: z.string().nullable().optional(),
  code: z.string().nullable().optional(),
  title: z.string().min(1),
  discount_label: z.string().min(1),
  discount_type: z.enum(['delivery', 'item_percent', 'item_fixed']),
  percent: z.number().int().min(1).max(100).nullable().optional(),
  amount_minor: z.number().int().nonnegative().nullable().optional(),
  min_spend_minor: z.number().int().nonnegative().default(0),
  requires_promo_code: z.boolean().default(false),
  is_active: z.boolean().default(true),
  starts_at: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
});

export const promotionOfferInputSchema = z.object({
  branch_uuid: z.string().uuid(),
  catalog_item_uuid: z.string().uuid().nullable().optional(),
  code: z.string().trim().max(64).nullable().optional(),
  title: z.string().min(1),
  discount_label: z.string().min(1),
  discount_type: z.enum(['delivery', 'item_percent', 'item_fixed']),
  percent: z.number().int().min(1).max(100).nullable().optional(),
  amount_minor: z.number().int().nonnegative().nullable().optional(),
  min_spend_minor: z.number().int().nonnegative().default(0),
  requires_promo_code: z.boolean().default(false),
  is_active: z.boolean().default(true),
  starts_at: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
});

export const merchantCatalogModifierGroupInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  selection_type: z.enum(['single', 'multiple']),
  min_selected: z.number().int().nonnegative().default(0),
  max_selected: z.number().int().positive().nullable().optional(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().nonnegative().default(0),
  options: z
    .array(
      z.object({
        uuid: z.string().uuid().optional(),
        name: z.string().min(1),
        description: z.string().nullable().optional(),
        price_delta_minor: z.number().int().nonnegative(),
        is_default: z.boolean().default(false),
        is_active: z.boolean().default(true),
        sort_order: z.number().int().nonnegative().default(0),
      })
    )
    .min(1),
});

export const branchCatalogOverrideInputSchema = z.object({
  price_minor: z.number().int().nonnegative().nullable().optional(),
  stock_quantity: z.number().int().nonnegative().nullable().optional(),
  is_available: z.boolean(),
});

export const selectedModifierOptionSchema = z.object({
  uuid: z.string().uuid(),
  groupUuid: z.string().uuid(),
  groupName: z.string().min(1),
  name: z.string().min(1),
  priceDeltaMinor: z.number().int().nonnegative(),
});

export const cartItemSchema = z.object({
  catalog_item_uuid: z.string().uuid().optional(),
  id: z.string().optional(),
  name: z.string().min(1),
  quantity: z.number().int().min(1),
  unitPriceMinor: z.number().int().nonnegative(),
  lineTotalMinor: z.number().int().nonnegative(),
  selectedModifierOptions: z.array(selectedModifierOptionSchema).default([]),
});

export const cartSummarySchema = z.object({
  branchUuid: z.string().uuid().nullable().optional(),
  branchName: z.string().nullable().optional(),
  merchantName: z.string().nullable().optional(),
  addressUuid: z.string().uuid().nullable().optional(),
  itemCount: z.number().int().nonnegative(),
  subtotalMinor: z.number().int().nonnegative(),
  deliveryFeeMinor: z.number().int().nonnegative(),
  itemDiscountMinor: z.number().int().nonnegative().default(0),
  deliveryDiscountMinor: z.number().int().nonnegative().default(0),
  discountMinor: z.number().int().nonnegative().default(0),
  totalMinor: z.number().int().nonnegative(),
  currency: z.string().length(3).default('SAR'),
  notes: z.string().nullable().optional(),
  appliedOffers: z
    .array(
      z.object({
        id: z.string().min(1),
        title: z.string().min(1),
        discountLabel: z.string().min(1),
        discountMinor: z.number().int().nonnegative(),
        discountType: z.enum(['delivery', 'item_percent', 'item_fixed']),
        promoCode: z.string().nullable().optional(),
        requiresPromoCode: z.boolean().default(false),
      })
    )
    .default([]),
  appliedOfferIds: z.array(z.string().min(1)).default([]),
  redeemedPromoCodes: z.array(z.string().min(1)).default([]),
  items: z.array(cartItemSchema),
});

export const checkoutRequestSchema = z.object({
  branch_uuid: z.string().uuid(),
  address_uuid: z.string().uuid(),
  notes: z.string().nullable().optional(),
  items: z.array(
    z.object({
      catalog_item_uuid: z.string().uuid(),
      quantity: z.number().int().min(1),
      modifier_option_uuids: z.array(z.string().uuid()).default([]),
    })
  ),
});

export const orderTimelineEntrySchema = z.object({
  event_type: z.enum(orderTimelineEventTypes),
  from_status: z.enum(orderStatuses).nullable().optional(),
  to_status: z.enum(orderStatuses).nullable().optional(),
  actor_role: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.any()).nullable().optional(),
  created_at: z.string().nullable().optional(),
});

export const deliveryExceptionReasonCodeSchema = z.enum(
  deliveryExceptionReasonCodes
);

export const deliveryExceptionResponseSlaSchema = z.object({
  level: z.enum(['on_track', 'warning', 'breached']),
  label: z.string().min(1),
  target_minutes: z.number().int().positive(),
  elapsed_minutes: z.number().int().nonnegative(),
  minutes_remaining: z.number().int(),
  escalation_action: z.enum([
    'support_monitoring',
    'support_follow_up_due',
    'support_reassignment_required',
  ]),
});

export const deliveryExceptionSchema = z.object({
  reason_code: deliveryExceptionReasonCodeSchema,
  reason_label: z.string().min(1),
  note: z.string().nullable().optional(),
  reported_at: z.union([z.string(), z.date()]).nullable().optional(),
  reported_by: z.string().min(1),
  response_sla: deliveryExceptionResponseSlaSchema.optional(),
});

export const deliveryExceptionInputSchema = z.object({
  reason_code: deliveryExceptionReasonCodeSchema,
  note: z.string().max(1000).nullable().optional(),
});

export const orderSchema = z.object({
  uuid: z.string().uuid(),
  status: z.enum(orderStatuses),
  payment_status: z.enum(paymentStatuses),
  currency: z.string().length(3),
  total_minor: z.number(),
  applied_offer_ids: z.array(z.string()).default([]),
  discount_minor: z.number().int().nonnegative().optional(),
  pricing_snapshot: z.record(z.string(), z.any()).optional(),
  active_delivery_exception: deliveryExceptionSchema.nullable().optional(),
  timeline: z.array(orderTimelineEntrySchema),
});

export const merchantOrderSchema = orderSchema.extend({
  subtotal_minor: z.number().int().nonnegative().optional(),
  delivery_fee_minor: z.number().int().nonnegative().optional(),
  platform_commission_minor: z.number().int().nonnegative().optional(),
  rider_earning_minor: z.number().int().nonnegative().optional(),
  pricing_snapshot: z.record(z.string(), z.any()).nullable().optional(),
  pickup_branch_snapshot: z.record(z.string(), z.any()).nullable().optional(),
  delivery_address_snapshot: z
    .record(z.string(), z.any())
    .nullable()
    .optional(),
  notes: z.string().nullable().optional(),
  placed_at: z.union([z.string(), z.date()]).nullable().optional(),
  accepted_at: z.union([z.string(), z.date()]).nullable().optional(),
  delivered_at: z.union([z.string(), z.date()]).nullable().optional(),
  customer_name: z.string().nullable().optional(),
  branch_name: z.string().nullable().optional(),
  item_count: z.number().int().nonnegative().optional(),
  merchant_actions: z.array(z.string()).default([]),
  items: z
    .array(
      z.object({
        catalog_item_id: z.number().int().nullable().optional(),
        quantity: z.number().int().min(1),
        unit_price_minor: z.number().int().nonnegative(),
        line_total_minor: z.number().int().nonnegative(),
        item_snapshot: z.record(z.string(), z.any()),
      })
    )
    .optional(),
});

export const riderAvailabilitySchema = z.enum(riderAvailabilities);
export const deliveryProofSchema = z.object({
  proof_type: z.enum(['photo', 'recipient_confirmation', 'handoff_code']),
  recipient_name: z.string().nullable().optional(),
  proof_notes: z.string().nullable().optional(),
  proof_reference: z.string().nullable().optional(),
});

export const deliveryAssignmentSchema = z.object({
  status: z.string().min(1),
  assignment_type: z.string().nullable().optional(),
  score: z.number().nullable().optional(),
  assigned_at: z.union([z.string(), z.date()]).nullable().optional(),
  accepted_at: z.union([z.string(), z.date()]).nullable().optional(),
  picked_up_at: z.union([z.string(), z.date()]).nullable().optional(),
  delivered_at: z.union([z.string(), z.date()]).nullable().optional(),
  proof_captured_at: z.union([z.string(), z.date()]).nullable().optional(),
  proof_metadata: deliveryProofSchema.nullable().optional(),
});

export const riderOrderSchema = merchantOrderSchema.extend({
  delivery_assignment: deliveryAssignmentSchema.nullable().optional(),
  rider_actions: z.array(z.string()).default([]),
});

export const mapLocationSchema = z.object({
  label: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
});

export const dispatchReassignmentReasonCodeSchema = z.enum(
  dispatchReassignmentReasonCodes
);

export const dispatchReassignmentInputSchema = z.object({
  rider_uuid: z.string().uuid(),
  reason_code: dispatchReassignmentReasonCodeSchema,
  reason_note: z.string().max(1000).nullable().optional(),
});

export const dispatchSlaSchema = z.object({
  level: z.enum(['on_track', 'warning', 'breached']),
  label: z.string().min(1),
  targetMinutes: z.number().int().positive(),
  elapsedMinutes: z.number().int().nonnegative(),
  minutesRemaining: z.number().int(),
});

export const dispatchEligibleRiderSchema = z.object({
  riderUuid: z.string().uuid(),
  riderName: z.string().min(1),
  availability: riderAvailabilitySchema,
  score: z.number(),
  activeLoad: z.number().int().nonnegative(),
  pickupEtaMinutes: z.number().int().positive(),
  distanceBucket: z.string().min(1),
  lastSeenAt: z.union([z.string(), z.date()]).nullable().optional(),
  isCurrent: z.boolean(),
});

export const dispatchAssignmentSchema = z.object({
  assignmentId: z.number().int().positive().optional(),
  orderUuid: z.string().uuid(),
  orderStatus: z.enum(orderStatuses).optional(),
  orderPlacedAt: z.union([z.string(), z.date()]).nullable().optional(),
  orderAcceptedAt: z.union([z.string(), z.date()]).nullable().optional(),
  zone: z.string().min(1),
  riderUuid: z.string().uuid().optional(),
  riderName: z.string().min(1),
  riderAvailability: riderAvailabilitySchema,
  assignmentStatus: z.string().min(1).optional(),
  assignmentType: z.string().min(1).optional(),
  assignedAt: z.union([z.string(), z.date()]).nullable().optional(),
  acceptedAt: z.union([z.string(), z.date()]).nullable().optional(),
  lastRiderSeenAt: z.union([z.string(), z.date()]).nullable().optional(),
  riderLocationAgeMinutes: z.number().int().nonnegative().optional(),
  orderAgeMinutes: z.number().int().nonnegative().optional(),
  assignmentAgeMinutes: z.number().int().nonnegative().optional(),
  score: z.number(),
  activeLoad: z.number().int().nonnegative(),
  distanceBucket: z.string().min(1),
  pickupEtaMinutes: z.number().int().positive(),
  dropoffEtaMinutes: z.number().int().positive(),
  riderLocation: mapLocationSchema,
  pickupLocation: mapLocationSchema,
  dropoffLocation: mapLocationSchema,
  mapsProvider: z.string().min(1).optional(),
  exception: deliveryExceptionSchema.nullable().optional(),
  sla: dispatchSlaSchema.optional(),
  reassignment: z
    .object({
      canReassign: z.boolean(),
      reasonRequired: z.boolean(),
      reasonCodes: z.array(dispatchReassignmentReasonCodeSchema).default([]),
      lastReassignedAt: z.union([z.string(), z.date()]).nullable().optional(),
    })
    .optional(),
  eligibleRiders: z.array(dispatchEligibleRiderSchema).default([]),
  realtime: z
    .object({
      channel: z.string().min(1),
      event: z.string().min(1),
    })
    .optional(),
});

export const ledgerEntryTypeSchema = z.enum(ledgerEntryTypes);
export const auditActionTypeSchema = z.enum(auditActionTypes);
export const notificationChannelSchema = z.enum(notificationChannels);
export const notificationDeliveryStatusSchema = z.enum(
  notificationDeliveryStatuses
);
export const notificationTypeSchema = z.enum(notificationTypes);

export const settlementLedgerQuerySchema = z.object({
  entry_type: ledgerEntryTypeSchema.optional(),
  order_uuid: z.string().uuid().optional(),
  direction: z.enum(['positive', 'negative']).optional(),
});

export const settlementAdjustmentSchema = z.object({
  amount_minor: z
    .number()
    .int()
    .refine((value) => value !== 0, {
      message: 'Adjustment amount cannot be zero.',
    }),
  notes: z.string().min(1).max(255),
});

export const ledgerEntrySchema = z.object({
  id: z.number().int(),
  order_id: z.number().int(),
  order_uuid: z.string().uuid().nullable().optional(),
  merchant_id: z.number().int(),
  merchant_name: z.string().nullable().optional(),
  rider_profile_id: z.number().int().nullable().optional(),
  rider_name: z.string().nullable().optional(),
  entry_type: ledgerEntryTypeSchema,
  amount_minor: z.number().int(),
  currency: z.string().length(3),
  notes: z.string().nullable().optional(),
  occurred_at: z.union([z.string(), z.date()]).nullable().optional(),
});

export const settlementLedgerMetaSchema = z.object({
  total_entries: z.number().int().nonnegative(),
  total_amount_minor: z.number().int(),
  entry_type_totals: z.record(z.string(), z.number()),
});

export const supportNoteSchema = z.object({
  id: z.number().int(),
  order_id: z.number().int().optional(),
  order_uuid: z.string().uuid().nullable().optional(),
  author_user_id: z.number().int(),
  author_name: z.string().nullable().optional(),
  body: z.string().min(1),
  attachment_disk: z.string().nullable().optional(),
  attachment_path: z.string().nullable().optional(),
  created_at: z.union([z.string(), z.date()]).nullable().optional(),
});

export const supportNoteInputSchema = z.object({
  body: z.string().min(1),
});

export const supportCaseStatusSchema = z.enum(supportCaseStatuses);
export const supportIssueTypeSchema = z.enum(supportIssueTypes);
export const supportResolutionTypeSchema = z.enum(supportResolutionTypes);
export const supportCancellationReasonCodeSchema = z.enum(
  supportCancellationReasonCodes
);

export const supportCaseSchema = z.object({
  uuid: z.string().uuid(),
  order_id: z.number().int(),
  order_uuid: z.string().uuid().nullable().optional(),
  status: supportCaseStatusSchema,
  issue_type: supportIssueTypeSchema,
  summary: z.string().min(1),
  cancellation_reason_code: supportCancellationReasonCodeSchema
    .nullable()
    .optional(),
  resolution_type: supportResolutionTypeSchema.nullable().optional(),
  resolution_notes: z.string().nullable().optional(),
  opened_by_user_id: z.number().int(),
  opened_by_name: z.string().nullable().optional(),
  resolved_by_user_id: z.number().int().nullable().optional(),
  resolved_by_name: z.string().nullable().optional(),
  opened_at: z.union([z.string(), z.date()]).nullable().optional(),
  resolved_at: z.union([z.string(), z.date()]).nullable().optional(),
  created_at: z.union([z.string(), z.date()]).nullable().optional(),
  updated_at: z.union([z.string(), z.date()]).nullable().optional(),
});

export const supportCaseInputSchema = z.object({
  summary: z.string().min(1).max(255),
  issue_type: supportIssueTypeSchema,
  status: supportCaseStatusSchema.optional(),
  resolution_type: supportResolutionTypeSchema.nullable().optional(),
  resolution_notes: z.string().max(1000).nullable().optional(),
});

export const supportCaseUpdateSchema = z
  .object({
    summary: z.string().min(1).max(255).optional(),
    issue_type: supportIssueTypeSchema.optional(),
    status: supportCaseStatusSchema.optional(),
    cancellation_reason_code: supportCancellationReasonCodeSchema
      .nullable()
      .optional(),
    resolution_type: supportResolutionTypeSchema.nullable().optional(),
    resolution_notes: z.string().max(1000).nullable().optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'Provide at least one support case field.',
  });

export const cancelSupportOrderInputSchema = z.object({
  summary: z.string().min(1).max(255),
  issue_type: supportIssueTypeSchema,
  reason_code: supportCancellationReasonCodeSchema,
  reason_note: z.string().max(1000).nullable().optional(),
});

export const supportOrderSchema = merchantOrderSchema.extend({
  merchant_name: z.string().nullable().optional(),
  support_notes: z.array(supportNoteSchema).default([]),
  support_case: supportCaseSchema.nullable().optional(),
});

export const supportSearchQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
});

export const notificationDeliverySchema = z.object({
  id: z.number().int(),
  order_id: z.number().int().nullable().optional(),
  order_uuid: z.string().uuid().nullable().optional(),
  recipient_user_id: z.number().int(),
  recipient_actor: z.enum(['customer', 'merchant', 'rider']),
  recipient_name: z.string().nullable().optional(),
  recipient_email: z.string().email().nullable().optional(),
  notification_type: notificationTypeSchema,
  channel: notificationChannelSchema,
  provider: z.enum(notificationProviders).or(z.string().min(1)),
  provider_reference: z.string().nullable().optional(),
  status: notificationDeliveryStatusSchema,
  attempt_count: z.number().int().nonnegative().default(0),
  title: z.string().min(1),
  body: z.string().min(1),
  payload: z.record(z.string(), z.any()).nullable().optional(),
  queued_at: z.union([z.string(), z.date()]).nullable().optional(),
  last_attempted_at: z.union([z.string(), z.date()]).nullable().optional(),
  next_retry_at: z.union([z.string(), z.date()]).nullable().optional(),
  last_error: z.string().nullable().optional(),
  sent_at: z.union([z.string(), z.date()]).nullable().optional(),
  read_at: z.union([z.string(), z.date()]).nullable().optional(),
  created_at: z.union([z.string(), z.date()]).nullable().optional(),
});

export const actorNotificationQuerySchema = z.object({
  order_uuid: z.string().uuid().optional(),
  unread_only: z.boolean().optional(),
});

export const opsNotificationQuerySchema = z.object({
  order_uuid: z.string().uuid().optional(),
  recipient_actor: z.enum(['customer', 'merchant', 'rider']).optional(),
  channel: notificationChannelSchema.optional(),
  provider: z.string().min(1).optional(),
  status: notificationDeliveryStatusSchema.optional(),
  notification_type: notificationTypeSchema.optional(),
});

export const notificationQueueMetaSchema = z.object({
  total: z.number().int().nonnegative(),
});

export const notificationInboxMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  unread_count: z.number().int().nonnegative(),
});
