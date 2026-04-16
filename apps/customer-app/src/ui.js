import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function ScreenFrame({
  eyebrow,
  title,
  description,
  children,
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function InfoCard({
  accent = '#ff8c42',
  eyebrow,
  title,
  description,
  children,
}) {
  return (
    <View style={[styles.card, { borderColor: accent }]}>
      <Text style={styles.cardEyebrow}>{eyebrow}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
      {description ? <Text style={styles.cardDescription}>{description}</Text> : null}
      {children}
    </View>
  );
}

export function ActionPill({ label }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

export function AccentButton({ label, onPress, testID }) {
  return (
    <Pressable onPress={onPress} style={styles.button} testID={testID}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, testID }) {
  return (
    <Pressable onPress={onPress} style={styles.secondaryButton} testID={testID}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
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
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8893a1"
        style={[styles.input, multiline ? styles.multilineInput : null]}
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
    gap: 12,
  },
  stacked: {
    gap: 12,
  },
  form: {
    gap: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statValue: {
    color: '#102033',
    fontSize: 24,
    fontWeight: '700',
  },
  muted: {
    color: '#5c6a78',
    fontSize: 14,
    lineHeight: 20,
  },
  helperText: {
    color: '#7d4f2a',
    fontSize: 13,
    lineHeight: 18,
  },
  inlinePanel: {
    gap: 8,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#f1e6d9',
  },
  inlineTitle: {
    color: '#102033',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyState: {
    color: '#556474',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f6efe6',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 16,
  },
  header: {
    gap: 10,
    marginBottom: 4,
  },
  eyebrow: {
    color: '#637282',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    color: '#102033',
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 34,
  },
  description: {
    color: '#556474',
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#fffaf3',
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 8,
  },
  cardEyebrow: {
    color: '#d16b22',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: '#102033',
    fontSize: 20,
    fontWeight: '700',
  },
  cardDescription: {
    color: '#566677',
    fontSize: 14,
    lineHeight: 20,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#ece5db',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pillText: {
    color: '#39495a',
    fontSize: 12,
    fontWeight: '700',
  },
  button: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: '#ff8c42',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#102033',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#c9b59a',
    backgroundColor: '#fff4e8',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#102033',
    fontSize: 14,
    fontWeight: '700',
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    color: '#39495a',
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d6c8b5',
    backgroundColor: '#fffaf3',
    color: '#102033',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  multilineInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
});
