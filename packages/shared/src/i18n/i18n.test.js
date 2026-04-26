import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createTranslator,
  formatCurrency,
  formatDate,
  getDirection,
  labelForEnum,
  normalizeLocale,
} from './index.js';

test('normalizes supported locales and falls back to English', () => {
  assert.equal(normalizeLocale('ar-SA'), 'ar');
  assert.equal(normalizeLocale('en-US'), 'en');
  assert.equal(normalizeLocale('fr-FR'), 'en');
  assert.equal(getDirection('ar'), 'rtl');
  assert.equal(getDirection('en'), 'ltr');
});

test('translates with interpolation and fallback lookup', () => {
  const en = createTranslator('en');
  const ar = createTranslator('ar');

  assert.equal(en.t('common.language.english'), 'English');
  assert.equal(ar.t('common.language.arabic'), 'العربية');
  assert.equal(
    en.t('orders.orderCode', { code: '4AA0F507' }),
    'Order 4AA0F507'
  );
  assert.equal(ar.t('orders.orderCode', { code: '4AA0F507' }), 'طلب 4AA0F507');
  assert.equal(ar.t('missing.key', { value: 'x' }), 'missing.key');
});

test('returns localized enum labels without changing wire values', () => {
  assert.equal(
    labelForEnum('orderStatus', 'ready_for_pickup', 'en'),
    'Ready for pickup'
  );
  assert.equal(
    labelForEnum('orderStatus', 'ready_for_pickup', 'ar'),
    'جاهز للاستلام'
  );
  assert.equal(labelForEnum('riderAvailability', 'available', 'ar'), 'متاح');
  assert.equal(
    labelForEnum('proofType', 'recipient_confirmation', 'en'),
    'Recipient confirmation'
  );
  assert.equal(
    labelForEnum('notificationType', 'order_status_updated', 'en'),
    'Order status updated'
  );
  assert.notEqual(
    labelForEnum('notificationType', 'order_status_updated', 'ar'),
    labelForEnum('notificationType', 'order_status_updated', 'en')
  );
  assert.equal(
    labelForEnum('notificationDeliveryStatus', 'failed', 'en'),
    'Failed'
  );
  assert.equal(labelForEnum('notificationChannel', 'in_app', 'en'), 'In-app');
  assert.equal(
    labelForEnum('supportCaseStatus', 'investigating', 'en'),
    'Investigating'
  );
  assert.equal(
    labelForEnum('supportIssueType', 'delivery_delay', 'en'),
    'Delivery delay'
  );
  assert.equal(
    labelForEnum('supportResolutionType', 'customer_contacted', 'en'),
    'Customer contacted'
  );
  assert.equal(
    labelForEnum('supportCancellationReasonCode', 'out_of_stock', 'en'),
    'Out of stock'
  );
  assert.equal(labelForEnum('actorRole', 'merchant', 'en'), 'Merchant');
  assert.equal(
    labelForEnum('actorRole', 'merchant_manager', 'en'),
    'Merchant manager'
  );
  assert.equal(
    labelForEnum('auditActionType', 'maps_configuration_updated', 'en'),
    'Maps configuration updated'
  );
  assert.notEqual(
    labelForEnum('supportIssueType', 'delivery_delay', 'ar'),
    labelForEnum('supportIssueType', 'delivery_delay', 'en')
  );
  assert.equal(
    labelForEnum('unknownGroup', 'new_backend_value', 'en'),
    'New Backend Value'
  );
});

test('formats money and dates with locale-aware output', () => {
  assert.match(formatCurrency(1250, 'SAR', 'en'), /SAR|ر\.س/);
  assert.match(formatCurrency(1250, 'SAR', 'ar'), /ر\.س|SAR/);
  assert.match(formatDate('2026-04-16T12:00:00Z', 'en'), /2026|Apr|4/);
  assert.match(formatDate('2026-04-16T12:00:00Z', 'ar'), /٢٠٢٦|2026|أبريل|٤/);
});
