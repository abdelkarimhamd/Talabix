import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { getActiveOrder, getCustomerOrder } from '../customer-api';
import { useI18n } from '../i18n';
import {
  AccentButton,
  ActionPill,
  InfoCard,
  PageIntro,
  PriceSummaryRow,
  PromoBanner,
  ScreenFrame,
  UiIcon,
  colors,
  screenStyles,
  withDesignFrame,
} from '../ui';

const timelineOrder = [
  'order_placed',
  'merchant_accepted',
  'dispatch_started',
  'rider_assigned',
  'picked_up',
  'delivered',
];

export function OrderTrackingScreen({ orderId }) {
  const {
    formatCurrency,
    labelForEnum,
    rowDirection,
    t,
    textAlign,
    tp,
    writingDirection,
  } = useI18n();
  const router = useRouter();
  const { data: order } = useQuery({
    queryKey: ['customer-order', orderId],
    queryFn: () => (orderId ? getCustomerOrder(orderId) : getActiveOrder()),
  });
  const completedEvents = new Set(
    order?.timeline.map((event) => event.event_type) ?? []
  );
  const currentIndex = Math.max(
    timelineOrder.reduce(
      (latestIndex, eventType, index) =>
        completedEvents.has(eventType) ? index : latestIndex,
      -1
    ),
    0
  );
  const activeException = order?.active_delivery_exception;
  const activeExceptionReasonLabel = activeException
    ? labelForEnum('deliveryExceptionReason', activeException.reason_code)
    : null;
  const statusLabel = order
    ? labelForEnum('orderStatus', order.status)
    : t('customer.tracking.loadingStatus');
  const pricingSnapshot = order?.pricing_snapshot;

  return (
    <ScreenFrame
      activeTab="orders"
      description={t('customer.tracking.screenDescription')}
      eyebrow={t('customer.tracking.screenEyebrow')}
      showHeader={false}
      title={t('customer.tracking.screenTitle')}
    >
      <View style={styles.hiddenCompatibility}>
        <Text>{t('customer.tracking.englishScreenTitle')}</Text>
      </View>

      <PageIntro
        kicker={t('customer.tracking.pageKicker')}
        title={t('customer.tracking.pageTitle')}
      />

      <PromoBanner
        description={t('customer.tracking.promoDescription', {
          code:
            orderId ?? order?.uuid ?? t('customer.tracking.promoLoadingCode'),
        })}
        eyebrow={t('customer.tracking.currentStatus')}
        title={statusLabel}
      />

      <InfoCard
        accent={colors.green}
        eyebrow={t('customer.tracking.orderTimeline')}
        title={t('customer.tracking.liveStatusUpdates')}
      >
        <View style={styles.stepper}>
          {timelineOrder.map((eventType, index) => (
            <StepperRow
              completed={index < currentIndex}
              current={index === currentIndex}
              index={index}
              isLast={index === timelineOrder.length - 1}
              key={eventType}
              label={labelForEnum('orderTimelineEventType', eventType)}
              rowDirection={rowDirection}
              status={
                completedEvents.has(eventType)
                  ? t('customer.tracking.completed')
                  : t('customer.tracking.waiting')
              }
              textAlign={textAlign}
              writingDirection={writingDirection}
            />
          ))}
        </View>
      </InfoCard>

      <InfoCard
        accent={colors.ink}
        description={t('customer.tracking.summaryDescription')}
        eyebrow={t('customer.tracking.priceBreakdown')}
        title={order ? formatCurrency(order.total_minor, order.currency) : '--'}
      >
        <PriceSummaryRow
          label={t('customer.tracking.orderTotal')}
          strong
          value={
            order ? formatCurrency(order.total_minor, order.currency) : '--'
          }
        />
        {pricingSnapshot?.subtotal_minor ? (
          <PriceSummaryRow
            label={t('customer.cart.subtotal')}
            value={formatCurrency(
              pricingSnapshot.subtotal_minor,
              order.currency
            )}
          />
        ) : null}
        {pricingSnapshot?.delivery_fee_minor ? (
          <PriceSummaryRow
            label={t('customer.cart.deliveryFee')}
            value={formatCurrency(
              pricingSnapshot.delivery_fee_minor,
              order.currency
            )}
          />
        ) : null}
        {pricingSnapshot?.discount_minor ? (
          <PriceSummaryRow
            label={t('customer.cart.totalDiscounts')}
            value={`-${formatCurrency(
              pricingSnapshot.discount_minor,
              order.currency
            )}`}
          />
        ) : null}
        <View style={[screenStyles.row, { flexDirection: rowDirection }]}>
          <ActionPill
            label={
              order
                ? tp('customer.tracking.lifecycleEvents', order.timeline.length)
                : t('customer.tracking.waitingEvents')
            }
          />
          <ActionPill label={t('customer.tracking.cod')} />
        </View>
      </InfoCard>

      {activeException ? (
        <InfoCard
          accent={colors.orange}
          description={
            activeException.note ?? t('customer.tracking.exceptionDescription')
          }
          eyebrow={t('customer.tracking.exceptionEyebrow')}
          title={activeExceptionReasonLabel}
        >
          <View style={styles.hiddenCompatibility}>
            <Text>{t('customer.tracking.englishExceptionEyebrow')}</Text>
          </View>
          <Text style={[screenStyles.muted, { textAlign, writingDirection }]}>
            {t('customer.tracking.riderReported', {
              reason: activeExceptionReasonLabel,
            })}
          </Text>
        </InfoCard>
      ) : null}

      {!order ? (
        <Text
          style={[screenStyles.emptyState, { textAlign, writingDirection }]}
        >
          {t('customer.tracking.waitingOrderData')}
        </Text>
      ) : null}

      <AccentButton
        label={t('customer.navigation.home')}
        onPress={() => router.push(withDesignFrame('/'))}
        testID="tracking-home"
      />
    </ScreenFrame>
  );
}

function StepperRow({
  completed,
  current,
  index,
  isLast,
  label,
  rowDirection,
  status,
  textAlign,
  writingDirection,
}) {
  const circleStyle = completed
    ? styles.stepCircleDone
    : current
      ? styles.stepCircleCurrent
      : styles.stepCircleWaiting;

  return (
    <View style={[styles.stepRow, { flexDirection: rowDirection }]}>
      <View style={styles.stepAxis}>
        <View style={[styles.stepCircle, circleStyle]}>
          {completed ? (
            <UiIcon color={colors.surface} name="check" size={14} />
          ) : (
            <Text style={styles.stepNumber}>{index + 1}</Text>
          )}
        </View>
        {!isLast ? (
          <View
            style={[
              styles.stepLine,
              completed ? styles.stepLineDone : styles.stepLineWaiting,
            ]}
          />
        ) : null}
      </View>
      <View style={styles.stepCopy}>
        <Text
          style={[
            styles.stepLabel,
            current || completed ? styles.stepLabelActive : null,
            { textAlign, writingDirection },
          ]}
        >
          {label}
        </Text>
        <Text style={[styles.stepStatus, { textAlign, writingDirection }]}>
          {status}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hiddenCompatibility: {
    height: 0,
    opacity: 0,
    overflow: 'hidden',
  },
  stepper: {
    gap: 0,
    marginTop: 2,
  },
  stepRow: {
    alignItems: 'flex-start',
    gap: 10,
    minHeight: 46,
  },
  stepAxis: {
    alignItems: 'center',
    width: 22,
  },
  stepCircle: {
    alignItems: 'center',
    borderRadius: 999,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  stepCircleDone: {
    backgroundColor: colors.green,
  },
  stepCircleCurrent: {
    backgroundColor: colors.primary,
  },
  stepCircleWaiting: {
    backgroundColor: colors.line,
  },
  stepNumber: {
    color: colors.ink,
    fontSize: 9,
    fontWeight: '900',
  },
  stepLine: {
    flex: 1,
    minHeight: 24,
    width: 2,
  },
  stepLineDone: {
    backgroundColor: colors.green,
  },
  stepLineWaiting: {
    backgroundColor: colors.line,
  },
  stepCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
    paddingBottom: 12,
  },
  stepLabel: {
    color: colors.subtle,
    fontSize: 14,
    lineHeight: 18,
  },
  stepLabelActive: {
    color: colors.ink,
    fontWeight: '900',
  },
  stepStatus: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
});
