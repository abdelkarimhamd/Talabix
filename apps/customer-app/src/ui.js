import {
  ImageBackground,
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
  blueSoft: '#e8f7ff',
  brown: '#6e5a12',
  dark: '#17191c',
};

export const customerDockTabs = [
  { href: '/', icon: 'H', key: 'home', label: 'Home' },
  { href: '/orders', icon: 'O', key: 'orders', label: 'Orders' },
  { href: '/offers', icon: '%', key: 'offers', label: 'Offers' },
  { href: '/points', icon: '+', key: 'points', label: 'Points' },
  { href: '/profile', icon: 'AH', key: 'profile', label: 'Profile' },
];

const productArtworkAssets = [
  {
    background: '#b8102f',
    fileName: 'burger.png',
    kind: 'packaged-raster-artwork',
    productLabel: 'burger',
    source: require('../assets/product-artwork/burger.png'),
  },
  {
    background: '#7b1b10',
    fileName: 'shawarma.png',
    kind: 'packaged-raster-artwork',
    productLabel: 'shawarma',
    source: require('../assets/product-artwork/shawarma.png'),
  },
  {
    background: '#0f7f56',
    fileName: 'market.png',
    kind: 'packaged-raster-artwork',
    productLabel: 'market',
    source: require('../assets/product-artwork/market.png'),
  },
  {
    background: '#1d5f87',
    fileName: 'coffee.png',
    kind: 'packaged-raster-artwork',
    productLabel: 'coffee',
    source: require('../assets/product-artwork/coffee.png'),
  },
  {
    background: '#7132a8',
    fileName: 'gift.png',
    kind: 'packaged-raster-artwork',
    productLabel: 'gift',
    source: require('../assets/product-artwork/gift.png'),
  },
];

export function getArtworkAssetForLabel(value = '') {
  const normalizedValue = value.toLowerCase();

  if (normalizedValue.includes('shawarma') || normalizedValue.includes('wrap')) {
    return productArtworkAssets[1];
  }

  if (
    normalizedValue.includes('market') ||
    normalizedValue.includes('basket') ||
    normalizedValue.includes('pharmacy') ||
    normalizedValue.includes('wellness')
  ) {
    return productArtworkAssets[2];
  }

  if (
    normalizedValue.includes('coffee') ||
    normalizedValue.includes('breakfast') ||
    normalizedValue.includes('foul')
  ) {
    return productArtworkAssets[3];
  }

  if (
    normalizedValue.includes('gift') ||
    normalizedValue.includes('bloom') ||
    normalizedValue.includes('rose')
  ) {
    return productArtworkAssets[4];
  }

  const hash = [...value].reduce(
    (total, character) => total + character.charCodeAt(0),
    0
  );

  return productArtworkAssets[hash % 2];
}

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

const artworkTitleShadow = Platform.select({
  web: {
    textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
  },
  default: {
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 3,
  },
});

export function FoodArtwork({
  badge,
  compact = false,
  label,
  showLabel = false,
  style,
}) {
  const { textAlign, writingDirection } = useI18n();
  const asset = getArtworkAssetForLabel(label);

  return (
    <ImageBackground
      imageStyle={styles.foodArtworkImage}
      resizeMode="cover"
      source={asset.source}
      style={[
        styles.foodArtwork,
        { backgroundColor: asset.background },
        compact ? styles.foodArtworkCompact : null,
        style,
      ]}
      testID={`packaged-artwork-${asset.productLabel}`}
    >
      <View style={styles.foodArtworkShade} />
      {badge ? (
        <View style={styles.offerBadge}>
          <Text style={styles.offerBadgeText}>{badge}</Text>
        </View>
      ) : null}
      {showLabel ? (
        <View style={styles.foodArtworkCopy}>
          <Text
            numberOfLines={2}
            style={[styles.foodArtworkTitle, { textAlign, writingDirection }]}
          >
            {label}
          </Text>
        </View>
      ) : null}
    </ImageBackground>
  );
}

export function ScreenFrame({
  activeTab,
  children,
  description,
  eyebrow,
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
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { textAlign, writingDirection }]}>
            {eyebrow}
          </Text>
          <Text style={[styles.title, { textAlign, writingDirection }]}>
            {title}
          </Text>
          <Text style={[styles.description, { textAlign, writingDirection }]}>
            {description}
          </Text>
        </View>
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
      {customerDockTabs.map((tab) => {
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

export function SectionHeader({ title, action }) {
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

export function AppHeader({
  addressLabel,
  addressLine,
  walletLabel,
  cartLabel,
}) {
  const { rowDirection, textAlign, writingDirection } = useI18n();

  return (
    <View style={[styles.appHeader, { flexDirection: rowDirection }]}>
      <View style={styles.locationPin}>
        <Text style={styles.locationPinText}>H</Text>
      </View>
      <View style={styles.appHeaderCopy}>
        <Text style={[styles.appHeaderLabel, { textAlign, writingDirection }]}>
          {addressLabel}
        </Text>
        <Text
          style={[styles.appHeaderAddress, { textAlign, writingDirection }]}
          numberOfLines={1}
        >
          {addressLine}
        </Text>
      </View>
      <View style={[styles.headerCounters, { flexDirection: rowDirection }]}>
        <View style={styles.headerCounterPlain}>
          <Text style={styles.headerCounterIcon}>Cart</Text>
        </View>
        <View style={styles.headerCounter}>
          <Text style={styles.headerCounterValue}>{walletLabel}</Text>
        </View>
        <View style={styles.headerCounter}>
          <Text style={styles.headerCounterValue}>{cartLabel}</Text>
        </View>
      </View>
    </View>
  );
}

export function PromoBanner({
  eyebrow,
  title,
  description,
  action,
  tone = 'yellow',
}) {
  const { textAlign, writingDirection } = useI18n();
  const bannerStyle =
    tone === 'dark' ? styles.promoBannerDark : styles.promoBanner;
  const titleStyle =
    tone === 'dark' ? styles.promoTitleLight : styles.promoTitle;
  const descriptionStyle =
    tone === 'dark' ? styles.promoDescriptionLight : styles.promoDescription;

  return (
    <View style={bannerStyle}>
      <View style={styles.promoContent}>
        <View style={styles.promoCopy}>
          {eyebrow ? (
            <Text
              style={[styles.promoEyebrow, { textAlign, writingDirection }]}
            >
              {eyebrow}
            </Text>
          ) : null}
          <Text style={[titleStyle, { textAlign, writingDirection }]}>
            {title}
          </Text>
          {description ? (
            <Text style={[descriptionStyle, { textAlign, writingDirection }]}>
              {description}
            </Text>
          ) : null}
        </View>
        <View style={styles.promoScene}>
          <Text style={styles.promoSceneMark}>%</Text>
          <Text style={styles.promoSceneText}>H</Text>
        </View>
      </View>
      {action ? <View style={styles.promoAction}>{action}</View> : null}
    </View>
  );
}

export function SearchBar({ value, onChangeText, placeholder, testID }) {
  const { textAlign, writingDirection } = useI18n();

  return (
    <View style={styles.searchShell}>
      <Text style={styles.searchIcon}>Q</Text>
      <TextInput
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#858585"
        style={[styles.searchInput, { textAlign, writingDirection }]}
        testID={testID}
        value={value}
      />
    </View>
  );
}

export function CategoryTile({
  active = false,
  kicker,
  label,
  meta,
  onPress,
  testID,
}) {
  const { textAlign, writingDirection } = useI18n();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.categoryTile, active ? styles.categoryTileActive : null]}
      testID={testID}
    >
      <View
        style={[styles.categoryArt, active ? styles.categoryArtActive : null]}
      >
        <Text style={styles.categoryArtText}>{kicker}</Text>
      </View>
      <Text
        style={[styles.categoryLabel, { textAlign, writingDirection }]}
        numberOfLines={2}
      >
        {label}
      </Text>
      {meta ? (
        <Text
          style={[styles.categoryMeta, { textAlign, writingDirection }]}
          numberOfLines={1}
        >
          {meta}
        </Text>
      ) : null}
    </Pressable>
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

export function MerchantRow({
  action,
  accent = colors.primary,
  badges = [],
  description,
  meta,
  title,
}) {
  const { rowDirection, textAlign, writingDirection } = useI18n();

  return (
    <View style={styles.merchantRow}>
      <FoodArtwork
        badge={badges[0] ?? 'H PLUS'}
        compact
        label={title}
        style={styles.merchantArtwork}
      />
      <View style={[styles.merchantTop, { flexDirection: rowDirection }]}>
        <View style={[styles.merchantLogo, { backgroundColor: accent }]}>
          <Text style={styles.merchantLogoText}>
            {title.slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <View style={styles.merchantCopy}>
          <Text style={[styles.merchantTitle, { textAlign, writingDirection }]}>
            {title}
          </Text>
          {description ? (
            <Text
              style={[
                styles.merchantDescription,
                { textAlign, writingDirection },
              ]}
              numberOfLines={2}
            >
              {description}
            </Text>
          ) : null}
        </View>
        {action ? <View style={styles.merchantAction}>{action}</View> : null}
      </View>
      {meta ? (
        <Text style={[styles.merchantMeta, { textAlign, writingDirection }]}>
          {meta}
        </Text>
      ) : null}
      {badges.length > 1 ? (
        <View style={[styles.badgeRow, { flexDirection: rowDirection }]}>
          {badges.slice(1).map((badge) => (
            <ActionPill key={badge} label={badge} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function PriceSummaryRow({ label, value, strong = false }) {
  const { rowDirection, textAlign, writingDirection } = useI18n();

  return (
    <View style={[styles.priceRow, { flexDirection: rowDirection }]}>
      <Text
        style={[
          strong ? styles.priceLabelStrong : styles.priceLabel,
          { textAlign, writingDirection },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          strong ? styles.priceValueStrong : styles.priceValue,
          { textAlign, writingDirection },
        ]}
      >
        {value}
      </Text>
    </View>
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
  stacked: {
    gap: 14,
  },
  section: {
    gap: 12,
  },
  form: {
    gap: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  offerRail: {
    flexDirection: 'row',
    gap: 10,
  },
  offerCard: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 88,
    padding: 12,
    width: 132,
  },
  offerCardBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.rose,
    borderRadius: 6,
    color: colors.surface,
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  offerCardTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 18,
  },
  offerCardMeta: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  statValue: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '800',
  },
  muted: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  helperText: {
    color: colors.brown,
    fontSize: 13,
    lineHeight: 18,
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
    fontWeight: '800',
  },
  emptyState: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
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
    maxWidth: 430,
    paddingBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 14,
    width: '100%',
  },
  scrollContentWithDock: {
    paddingBottom: 116,
  },
  header: {
    gap: 6,
    paddingBottom: 2,
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
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 14,
    borderTopWidth: 3,
    borderWidth: 1,
    padding: 16,
    gap: 10,
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
  appHeader: {
    alignItems: 'flex-start',
    backgroundColor: colors.background,
    gap: 10,
    paddingVertical: 4,
  },
  locationPin: {
    alignItems: 'center',
    backgroundColor: colors.green,
    borderRadius: 14,
    height: 30,
    justifyContent: 'center',
    marginTop: 1,
    width: 30,
  },
  locationPinText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '900',
  },
  appHeaderCopy: {
    flex: 1,
    gap: 2,
  },
  appHeaderLabel: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  appHeaderAddress: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  headerCounters: {
    gap: 6,
  },
  headerCounterPlain: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 2,
  },
  headerCounterIcon: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '900',
  },
  headerCounter: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
    minWidth: 50,
    paddingHorizontal: 8,
  },
  headerCounterValue: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '900',
  },
  promoBanner: {
    backgroundColor: '#fff8bd',
    borderColor: '#f2e57a',
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    overflow: 'hidden',
    padding: 18,
  },
  promoBannerDark: {
    backgroundColor: colors.dark,
    borderRadius: 18,
    gap: 12,
    overflow: 'hidden',
    padding: 18,
  },
  promoContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  promoCopy: {
    flex: 1,
    gap: 6,
  },
  promoEyebrow: {
    color: colors.rose,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  promoTitle: {
    color: colors.ink,
    fontSize: 25,
    fontWeight: '900',
    lineHeight: 29,
  },
  promoTitleLight: {
    color: colors.surface,
    fontSize: 25,
    fontWeight: '900',
    lineHeight: 29,
  },
  promoDescription: {
    color: '#3e3a20',
    fontSize: 14,
    lineHeight: 20,
  },
  promoDescriptionLight: {
    color: '#f7f0cf',
    fontSize: 14,
    lineHeight: 20,
  },
  promoAction: {
    alignItems: 'flex-start',
  },
  promoScene: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    height: 86,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 90,
  },
  promoSceneMark: {
    color: colors.rose,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 38,
  },
  promoSceneText: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
    marginTop: -2,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  searchShell: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 14,
  },
  searchIcon: {
    color: colors.subtle,
    fontSize: 17,
    fontWeight: '900',
  },
  searchInput: {
    color: colors.ink,
    flex: 1,
    fontSize: 16,
    minHeight: 54,
  },
  categoryTile: {
    backgroundColor: colors.surface,
    gap: 7,
    minHeight: 126,
    width: '22.8%',
  },
  categoryTileActive: {
    backgroundColor: colors.surface,
  },
  categoryArt: {
    alignItems: 'center',
    backgroundColor: colors.surfaceSoft,
    borderRadius: 14,
    height: 72,
    justifyContent: 'center',
  },
  categoryArtActive: {
    backgroundColor: colors.primary,
  },
  categoryArtText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  categoryLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 17,
  },
  categoryMeta: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 14,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 9,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillSuccess: {
    backgroundColor: '#ddf6e9',
  },
  pillWarning: {
    backgroundColor: '#fff0c2',
  },
  pillText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  button: {
    minHeight: 48,
    borderRadius: 13,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
    minHeight: 44,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
  merchantRow: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    overflow: 'hidden',
    padding: 12,
    ...lightSurfaceShadow,
  },
  merchantArtwork: {
    marginHorizontal: -12,
    marginTop: -12,
  },
  merchantTop: {
    alignItems: 'center',
    gap: 10,
  },
  merchantLogo: {
    alignItems: 'center',
    borderRadius: 12,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  merchantLogoText: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
  },
  merchantCopy: {
    flex: 1,
    gap: 3,
  },
  merchantTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900',
  },
  merchantDescription: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  merchantMeta: {
    color: colors.green,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  merchantAction: {
    maxWidth: 112,
  },
  badgeRow: {
    flexWrap: 'wrap',
    gap: 6,
  },
  priceRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 3,
  },
  priceLabel: {
    color: colors.muted,
    flex: 1,
    fontSize: 14,
  },
  priceLabelStrong: {
    color: colors.ink,
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
  },
  priceValue: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  priceValueStrong: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
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
    minHeight: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    color: colors.ink,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  multilineInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  foodArtwork: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: 16,
    height: 156,
    justifyContent: 'space-between',
    overflow: 'hidden',
    padding: 12,
  },
  foodArtworkCompact: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    height: 128,
  },
  foodArtworkImage: {
    borderRadius: 16,
  },
  foodArtworkShade: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  foodArtworkCopy: {
    marginTop: 'auto',
  },
  foodArtworkTitle: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
    maxWidth: '86%',
    ...artworkTitleShadow,
  },
  offerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.rose,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  offerBadgeText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '900',
  },
  tabDock: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderColor: colors.line,
    borderRadius: 30,
    borderWidth: 1,
    bottom: 22,
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'space-between',
    maxWidth: 430,
    padding: 8,
    position: 'absolute',
    width: '92%',
    ...floatingDockShadow,
  },
  tabItem: {
    alignItems: 'center',
    borderRadius: 24,
    flex: 1,
    gap: 3,
    minHeight: 54,
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tabItemActive: {
    backgroundColor: '#f0f0ed',
  },
  tabIcon: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  tabIconActive: {
    backgroundColor: colors.primary,
    borderRadius: 7,
    overflow: 'hidden',
    paddingHorizontal: 5,
  },
  tabLabel: {
    color: colors.ink,
    fontSize: 11,
  },
  tabLabelActive: {
    fontWeight: '900',
  },
});
