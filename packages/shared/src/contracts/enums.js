export const orderStatuses = [
  'placed',
  'accepted',
  'preparing',
  'ready_for_pickup',
  'assigned',
  'picked_up',
  'delivered',
  'cancelled',
];

export const orderTimelineEventTypes = [
  'order_placed',
  'merchant_accepted',
  'merchant_rejected',
  'dispatch_started',
  'rider_assigned',
  'rider_reassigned',
  'picked_up',
  'delivered',
  'cancelled',
  'support_note_added',
];

export const paymentStatuses = ['pending_cod', 'collected_cod', 'waived'];

export const riderAvailabilities = ['offline', 'available', 'busy', 'paused'];

export const dispatchReassignmentReasonCodes = [
  'sla_risk',
  'rider_unavailable',
  'customer_request',
  'load_balance',
  'ops_override',
  'other',
];

export const ledgerEntryTypes = [
  'merchant_receivable',
  'platform_commission',
  'rider_earning',
  'adjustment',
];

export const auditActionTypes = [
  'order_cancelled',
  'rider_reassigned',
  'branch_updated',
  'catalog_updated',
  'settlement_adjusted',
  'permission_changed',
  'support_case_updated',
  'support_note_added',
];

export const notificationChannels = ['in_app', 'email', 'push', 'sms'];

export const notificationDeliveryStatuses = ['queued', 'sent', 'failed'];

export const notificationTypes = ['order_status_updated', 'support_note_added'];

export const notificationProviders = ['internal', 'mail', 'log', 'sms-log', 'failing'];

export const supportCaseStatuses = ['open', 'investigating', 'resolved'];

export const supportIssueTypes = [
  'customer_request',
  'delivery_delay',
  'address_issue',
  'merchant_issue',
  'rider_issue',
  'order_accuracy',
  'payment_issue',
  'other',
];

export const supportResolutionTypes = [
  'customer_contacted',
  'merchant_contacted',
  'rider_contacted',
  'clarified_instructions',
  'cancelled_order',
  'compensation_offered',
  'monitoring_only',
  'other',
];

export const supportCancellationReasonCodes = [
  'customer_request',
  'merchant_unavailable',
  'out_of_stock',
  'address_unserviceable',
  'rider_issue',
  'duplicate_order',
  'fraud_review',
  'ops_override',
  'other',
];
