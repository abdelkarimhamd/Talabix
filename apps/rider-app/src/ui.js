import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from './i18n';

export const colors = {
  background: '#ffffff',
  surface: '#ffffff',
  surfaceWarm: '#fff9cf',
  surfaceSoft: '#f6f6f2',
  ink: '#202124',
  muted: '#62666d',
  subtle: '#8d9198',
  line: '#ececec',
  primary: '#ffe500',
  primaryDeep: '#b09200',
  green: '#15945f',
  teal: '#0b8fa3',
  rose: '#e91e63',
  roseSoft: '#fff1f6',
  orange: '#f7a51d',
  brown: '#6e5a12',
  dark: '#17191c',
};

export const riderDockTabs = [
  { href: '/', icon: 'H', key: 'home', label: 'Home' },
  { href: '/assignments', icon: 'A', key: 'assignments', label: 'Queue' },
  { href: '/delivery', icon: 'D', key: 'delivery', label: 'Run' },
  { href: '/notifications', icon: 'N', key: 'notifications', label: 'Inbox' },
  { href: '/earnings', icon: 'SAR', key: 'earnings', label: 'Pay' },
];

const lightSurfaceShadow = Platform.select({
  web: {
    boxShadow: '0 5px 14px rgba(0, 0, 0, 0.05)',
  },
  default: {
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
  },
});

const floatingDockShadow = Platform.select({
  web: {
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.12)',
  },
  default: {
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },
});

export function ScreenFrame({
  activeTab,
  children,
  description,
  eyebrow,
  preserveHeaderText = true,
  showHeader = true,
  title,
}) {
  const { textAlign, writingDirection } = useI18n();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          activeTab ? styles.scrollContentWithDock : null,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {showHeader ? (
          <View style={styles.header}>
            <Text style={[styles.eyebrow, { textAlign, writingDirection }]}>
              {eyebrow}
            </Text>
            <Text style={[styles.title, { textAlign, writingDirection }]}>
              {title}
            </Text>
            <Text
              style={[styles.description, { textAlign, writingDirection }]}
            >
              {description}
            </Text>
          </View>
        ) : preserveHeaderText ? (
          <View style={styles.hiddenHeader}>
            <Text>{eyebrow}</Text>
            <Text>{title}</Text>
            <Text>{description}</Text>
          </View>
        ) : null}
        {children}
      </ScrollView>
      {activeTab ? <FloatingTabDock activeTab={activeTab} /> : null}
    </SafeAreaView>
  );
}

function FloatingTabDock({ activeTab }) {
  const router = useRouter();

  return (
    <View style={styles.tabDock}>
      {riderDockTabs.map((tab) => {
        const active = tab.key === activeTab;

        return (
          <Pressable
            accessibilityRole="link"
            key={tab.key}
            onPress={() => router.push(tab.href)}
            style={[styles.tabItem, active ? styles.tabItemActive : null]}
            testID={`dock-tab-${tab.key}`}
          >
            <Text style={[styles.tabIcon, active ? styles.tabIconActive : null]}>
              {tab.icon}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.tabLabel, active ? styles.tabLabelActive : null]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function RiderTopBar({ meta, name, status }) {
  const { rowDirection, textAlign, writingDirection } = useI18n();

  return (
    <View style={[styles.riderTopBar, { flexDirection: rowDirection }]}>
      <View style={styles.riderAvatar}>
        <Text style={styles.riderAvatarText}>
          {String(name ?? 'R').slice(0, 1).toUpperCase()}
        </Text>
      </View>
      <View style={styles.riderTopCopy}>
        <Text
          numberOfLines={1}
          style={[styles.riderName, { textAlign, writingDirection }]}
        >
          {name}
        </Text>
        {meta ? (
          <Text
            numberOfLines={1}
            style={[styles.riderMeta, { textAlign, writingDirection }]}
          >
            {meta}
          </Text>
        ) : null}
      </View>
      <View style={styles.statusChip}>
        <View style={styles.statusDot} />
        <Text numberOfLines={1} style={styles.statusChipText}>
          {status}
        </Text>
      </View>
    </View>
  );
}

export function InfoCard({
  accent = colors.primaryDeep,
  eyebrow,
  title,
  description,
  children,
}) {
  const { textAlign, writingDirection } = useI18n();

  return (
    <View style={[styles.card, { borderTopColor: accent }]}>
      {eyebrow ? (
        <Text style={[styles.cardEyebrow, { textAlign, writingDirection }]}>
          {eyebrow}
        </Text>
      ) : null}
      <Text style={[styles.cardTitle, { textAlign, writingDirection }]}>
        {title}
      </Text>
      {description ? (
        <Text style={[styles.cardDescription, { textAlign, writingDirection }]}>
          {description}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

export function SectionHeader({ action, title }) {
  const { rowDirection, textAlign, writingDirection } = useI18n();

  return (
    <View style={[styles.sectionHeader, { flexDirection: rowDirection }]}>
      <Text style={[styles.sectionTitle, { textAlign, writingDirection }]}>
        {title}
      </Text>
      {action ? <View>{action}</View> : null}
    </View>
  );
}

export function MetricTile({ label, tone = 'default', value }) {
  const { textAlign, writingDirection } = useI18n();

  return (
    <View
      style={[
        styles.metricTile,
        tone === 'yellow' ? styles.metricTileYellow : null,
        tone === 'dark' ? styles.metricTileDark : null,
      ]}
    >
      <Text
        numberOfLines={2}
        style={[
          styles.metricValue,
          tone === 'dark' ? styles.metricValueLight : null,
          { textAlign, writingDirection },
        ]}
      >
        {value}
      </Text>
      <Text
        numberOfLines={2}
        style={[
          styles.metricLabel,
          tone === 'dark' ? styles.metricLabelLight : null,
          { textAlign, writingDirection },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export function RouteStopCard({
  action,
  accent = colors.primary,
  description,
  eyebrow,
  meta,
  title,
}) {
  const { rowDirection, textAlign, writingDirection } = useI18n();

  return (
    <View style={styles.routeStopCard}>
      <View style={[styles.routeStopTop, { flexDirection: rowDirection }]}>
        <View style={[styles.routeStopMark, { backgroundColor: accent }]}>
          <Text style={styles.routeStopMarkText}>
            {String(eyebrow ?? title ?? 'S').slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <View style={styles.routeStopCopy}>
          {eyebrow ? (
            <Text style={[styles.routeStopEyebrow, { textAlign, writingDirection }]}>
              {eyebrow}
            </Text>
          ) : null}
          <Text
            numberOfLines={2}
            style={[styles.routeStopTitle, { textAlign, writingDirection }]}
          >
            {title}
          </Text>
        </View>
      </View>
      {description ? (
        <Text style={[styles.routeStopDescription, { textAlign, writingDirection }]}>
          {description}
        </Text>
      ) : null}
      {meta ? (
        <Text style={[styles.routeStopMeta, { textAlign, writingDirection }]}>
          {meta}
        </Text>
      ) : null}
      {action ? <View style={styles.routeStopAction}>{action}</View> : null}
    </View>
  );
}

export function TimelineEventRow({ description, label, title }) {
  const { rowDirection, textAlign, writingDirection } = useI18n();

  return (
    <View style={[styles.timelineRow, { flexDirection: rowDirection }]}>
      <View style={styles.timelineDot} />
      <View style={styles.timelineCopy}>
        {label ? (
          <Text style={[styles.timelineLabel, { textAlign, writingDirection }]}>
            {label}
          </Text>
        ) : null}
        <Text style={[styles.timelineTitle, { textAlign, writingDirection }]}>
          {title}
        </Text>
        {description ? (
          <Text
            style={[styles.timelineDescription, { textAlign, writingDirection }]}
          >
            {description}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function ActionPill({ label, tone = 'neutral' }) {
  const { textAlign, writingDirection } = useI18n();

  return (
    <View
      style={[
        styles.pill,
        tone === 'success' ? styles.pillSuccess : null,
        tone === 'warning' ? styles.pillWarning : null,
        tone === 'critical' ? styles.pillCritical : null,
      ]}
    >
      <Text style={[styles.pillText, { textAlign, writingDirection }]}>
        {label}
      </Text>
    </View>
  );
}

export function AccentButton({ disabled = false, label, onPress, testID }) {
  const { textAlign, writingDirection } = useI18n();

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, disabled ? styles.disabledButton : null]}
      testID={testID}
    >
      <Text style={[styles.buttonText, { textAlign, writingDirection }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function SecondaryButton({
  active = false,
  disabled = false,
  label,
  onPress,
  testID,
}) {
  const { textAlign, writingDirection } = useI18n();

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.secondaryButton,
        active ? styles.secondaryButtonActive : null,
        disabled ? styles.disabledButton : null,
      ]}
      testID={testID}
    >
      <Text
        style={[
          styles.secondaryButtonText,
          active ? styles.secondaryButtonTextActive : null,
          { textAlign, writingDirection },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = 'default',
  testID,
}) {
  const { textAlign, writingDirection } = useI18n();

  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { textAlign, writingDirection }]}>
        {label}
      </Text>
      <TextInput
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8893a1"
        style={[
          styles.input,
          { textAlign, writingDirection },
          multiline ? styles.multilineInput : null,
        ]}
        testID={testID}
        value={value}
      />
    </View>
  );
}

export const screenStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stacked: {
    gap: 14,
  },
  section: {
    gap: 12,
  },
  form: {
    gap: 12,
  },
  metricRail: {
    flexDirection: 'row',
    gap: 10,
  },
  compactTitle: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 32,
  },
  pageKicker: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  statValue: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 29,
  },
  muted: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  helperText: {
    color: colors.brown,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  emptyState: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  inlinePanel: {
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.line,
    borderWidth: 1,
  },
  inlineTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  divider: {
    backgroundColor: colors.line,
    height: 1,
  },
  warningPanel: {
    backgroundColor: colors.roseSoft,
    borderColor: '#ffd6e2',
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    alignSelf: 'center',
    gap: 18,
    maxWidth: 390,
    paddingBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 14,
    width: '100%',
    ...Platform.select({
      web: {
        alignSelf: 'stretch',
        boxSizing: 'border-box',
        marginHorizontal: 'auto',
      },
      default: null,
    }),
  },
  scrollContentWithDock: {
    paddingBottom: 116,
  },
  header: {
    gap: 6,
    paddingBottom: 2,
  },
  hiddenHeader: {
    height: 0,
    opacity: 0,
    overflow: 'hidden',
  },
  eyebrow: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 31,
  },
  description: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  riderTopBar: {
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: 10,
    minHeight: 50,
    paddingTop: 2,
  },
  riderAvatar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  riderAvatarText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  riderTopCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  riderName: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900',
  },
  riderMeta: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  statusChip: {
    alignItems: 'center',
    backgroundColor: colors.surfaceSoft,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 6,
    minHeight: 34,
    maxWidth: 112,
    paddingHorizontal: 10,
  },
  statusDot: {
    backgroundColor: colors.green,
    borderRadius: 5,
    height: 9,
    width: 9,
  },
  statusChipText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '900',
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 14,
    borderTopWidth: 3,
    borderWidth: 1,
    gap: 10,
    padding: 16,
    ...lightSurfaceShadow,
  },
  cardEyebrow: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: '900',
    lineHeight: 23,
  },
  cardDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 30,
  },
  sectionTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 27,
  },
  metricTile: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    minHeight: 82,
    minWidth: 0,
    padding: 12,
  },
  metricTileYellow: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.primary,
  },
  metricTileDark: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  metricValue: {
    color: colors.ink,
    fontSize: 21,
    fontWeight: '900',
    lineHeight: 25,
  },
  metricValueLight: {
    color: colors.surface,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  metricLabelLight: {
    color: '#f7f0cf',
  },
  routeStopCard: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    gap: 8,
    paddingVertical: 12,
  },
  routeStopTop: {
    alignItems: 'center',
    gap: 10,
  },
  routeStopMark: {
    alignItems: 'center',
    borderRadius: 12,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  routeStopMarkText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  routeStopCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  routeStopEyebrow: {
    color: colors.green,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  routeStopTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 20,
  },
  routeStopDescription: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  routeStopMeta: {
    color: colors.green,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  routeStopAction: {
    alignItems: 'flex-start',
  },
  timelineRow: {
    alignItems: 'flex-start',
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    gap: 10,
    minHeight: 72,
    paddingVertical: 12,
  },
  timelineDot: {
    backgroundColor: colors.primary,
    borderColor: colors.ink,
    borderRadius: 8,
    borderWidth: 2,
    height: 16,
    marginTop: 2,
    width: 16,
  },
  timelineCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  timelineLabel: {
    color: colors.green,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  timelineTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 19,
  },
  timelineDescription: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceSoft,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillSuccess: {
    backgroundColor: '#ddf6e9',
  },
  pillWarning: {
    backgroundColor: '#fff0c2',
  },
  pillCritical: {
    backgroundColor: colors.roseSoft,
  },
  pillText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 22,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 16,
  },
  secondaryButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryButtonTextActive: {
    color: colors.ink,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 13,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  multilineInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  tabDock: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 28,
    borderWidth: 1,
    bottom: 24,
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'space-between',
    maxWidth: 356,
    padding: 8,
    position: 'absolute',
    width: '88%',
    ...floatingDockShadow,
  },
  tabItem: {
    alignItems: 'center',
    borderRadius: 24,
    flex: 1,
    gap: 3,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 5,
  },
  tabItemActive: {
    backgroundColor: colors.primary,
  },
  tabIcon: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  tabIconActive: {
    color: colors.ink,
  },
  tabLabel: {
    color: colors.ink,
    fontSize: 11,
  },
  tabLabelActive: {
    fontWeight: '900',
  },
});
