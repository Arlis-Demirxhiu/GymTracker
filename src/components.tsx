import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { BODY_PART_MAP, BODY_PARTS } from './data';
import { colors, radius } from './theme';
import { BodyPart } from './types';

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {right}
    </View>
  );
}

export function BodyPartTag({ part, small }: { part: BodyPart; small?: boolean }) {
  const bp = BODY_PART_MAP[part];
  return (
    <View style={[styles.tag, small && styles.tagSmall, { backgroundColor: bp.color + '26', borderColor: bp.color + '66' }]}>
      <View style={[styles.dot, { backgroundColor: bp.color }]} />
      <Text style={[styles.tagText, small && { fontSize: 11 }]}>{bp.label}</Text>
    </View>
  );
}

export function BodyPartPicker({
  selected,
  onToggle,
  planned = [],
}: {
  selected: BodyPart[];
  onToggle: (p: BodyPart) => void;
  planned?: BodyPart[];
}) {
  return (
    <View style={styles.grid}>
      {BODY_PARTS.map((bp) => {
        const on = selected.includes(bp.key);
        const isPlanned = planned.includes(bp.key);
        return (
          <Pressable
            key={bp.key}
            onPress={() => onToggle(bp.key)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            style={({ pressed }) => [
              styles.chip,
              on && { backgroundColor: bp.color, borderColor: bp.color },
              !on && isPlanned && { borderColor: bp.color, borderStyle: 'dashed' },
              pressed && { opacity: 0.7 },
            ]}
          >
            {!on && <View style={[styles.dot, { backgroundColor: bp.color }]} />}
            <Text style={[styles.chipText, on && { color: colors.accentText, fontWeight: '700' }]}>{bp.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        variant === 'primary' && { backgroundColor: colors.accent },
        variant === 'ghost' && { backgroundColor: colors.cardAlt },
        variant === 'danger' && { backgroundColor: colors.danger + '22' },
        (pressed || disabled) && { opacity: disabled ? 0.4 : 0.75 },
        style,
      ]}
    >
      <Text
        style={[
          styles.btnText,
          variant === 'primary' && { color: colors.accentText },
          variant === 'danger' && { color: colors.danger },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 14,
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { color: colors.textDim, fontSize: 13, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
    marginBottom: 6,
  },
  tagSmall: { paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipText: { color: colors.text, fontSize: 14, fontWeight: '500' },
  btn: { borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center' },
  btnText: { color: colors.text, fontSize: 15, fontWeight: '700' },
});
