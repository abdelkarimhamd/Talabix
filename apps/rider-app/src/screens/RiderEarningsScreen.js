import { useQuery } from '@tanstack/react-query';
import { Text, View } from 'react-native';
import { getRiderEarningsReport } from '../rider-api';
import {
  ActionPill,
  InfoCard,
  MetricTile,
  ScreenFrame,
  SectionHeader,
  colors,
  screenStyles,
} from '../ui';

function formatMoney(amountMinor, currency = 'SAR') {
  return `${currency} ${(amountMinor / 100).toFixed(2)}`;
}

function formatDate(value) {
  if (!value) {
    return 'Date unavailable';
  }

  return new Date(value).toLocaleDateString();
}

export function RiderEarningsScreen() {
  const { data: report } = useQuery({
    queryKey: ['rider-earnings', 7],
    queryFn: () => getRiderEarningsReport({ range_days: 7 }),
  });

  const activeDays =
    report?.daily_earnings.filter((point) => point.deliveries_count > 0) ?? [];

  return (
    <ScreenFrame
      activeTab="earnings"
      description="Rider earnings are now read from the same ledger-backed reporting shape used by the API, scoped to the signed-in rider only."
      eyebrow="Rider earnings"
      preserveHeaderText={false}
      showHeader={false}
      title="Track completed deliveries and COD earnings."
    >
      <View style={screenStyles.section}>
        <Text style={screenStyles.pageKicker}>Rider earnings</Text>
        <Text style={screenStyles.compactTitle}>
          Track completed deliveries and COD earnings.
        </Text>
      </View>

      <View style={screenStyles.metricRail}>
        <MetricTile
          label="Delivered orders"
          tone="yellow"
          value={report ? report.summary.deliveries_count : '...'}
        />
        <MetricTile
          label="Average per delivery"
          value={
            report
              ? formatMoney(
                  report.summary.average_per_delivery_minor,
                  report.summary.currency
                )
              : '...'
          }
        />
      </View>

      <InfoCard
        accent={colors.primary}
        description={report ? `${report.rider.name} - ${report.rider.availability}` : 'Loading rider ledger'}
        eyebrow="Earnings this period"
        title={report ? formatMoney(report.summary.earnings_minor, report.summary.currency) : '...'}
      >
        <Text style={screenStyles.statValue}>
          {report ? `${report.summary.deliveries_count} delivered orders` : 'Loading orders'}
        </Text>
        <Text style={screenStyles.muted}>
          Average per delivery:{' '}
          {report
            ? formatMoney(report.summary.average_per_delivery_minor, report.summary.currency)
            : '...'}
        </Text>
        <View style={screenStyles.row}>
          <ActionPill label={report ? `${report.range.range_days} day range` : 'Loading range'} />
          <ActionPill label="Ledger-backed" />
        </View>
      </InfoCard>

      <View style={screenStyles.section}>
        <SectionHeader title="Daily activity" />
      </View>

      <InfoCard
        accent={colors.green}
        description="Only days with completed deliveries are highlighted so the rider can scan earning activity quickly."
        eyebrow="Daily activity"
        title="Delivery days"
      >
        <View style={screenStyles.stacked}>
          {activeDays.length ? (
            activeDays.map((point) => (
              <View key={point.date} style={screenStyles.row}>
                <ActionPill label={formatDate(point.date)} />
                <Text style={screenStyles.muted}>
                  {point.deliveries_count} delivery{point.deliveries_count === 1 ? '' : 'ies'} -{' '}
                  {formatMoney(point.earnings_minor, report.summary.currency)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={screenStyles.emptyState}>
              No completed delivery earnings have posted in this range.
            </Text>
          )}
        </View>
      </InfoCard>

      <View style={screenStyles.stacked}>
        {(report?.orders ?? []).map((order) => (
          <InfoCard
            accent={colors.dark}
            description={`${order.branch_name} - ${formatDate(order.delivered_at)}`}
            eyebrow="Paid delivery"
            key={order.order_uuid}
            title={order.merchant_name}
          >
            <Text style={screenStyles.statValue}>
              {formatMoney(order.earning_minor, order.currency)}
            </Text>
            <Text style={screenStyles.muted}>
              Order {order.order_uuid ? order.order_uuid.slice(0, 8).toUpperCase() : 'unavailable'} posted{' '}
              {formatDate(order.occurred_at)}.
            </Text>
          </InfoCard>
        ))}
      </View>
    </ScreenFrame>
  );
}
