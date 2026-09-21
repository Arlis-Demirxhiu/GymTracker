import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius } from './theme';
import { ExperienceLevel, Profile } from './types';

/** Ranges the API accepts; anything outside is a typo, not a person. */
export const RANGE = {
  heightCm: { min: 100, max: 250, hint: 'Enter a height between 100 and 250 cm' },
  weightKg: { min: 30, max: 300, hint: 'Enter a weight between 30 and 300 kg' },
};

export const LEVELS: { key: ExperienceLevel; label: string; blurb: string }[] = [
  { key: 'beginner', label: 'Beginner', blurb: 'First months of lifting' },
  { key: 'intermediate', label: 'Intermediate', blurb: 'Training consistently for a year or so' },
  { key: 'advanced', label: 'Advanced', blurb: 'Several years of steady progress' },
];

/** Keeps only digits and a single decimal separator, so the field can't hold junk. */
const clean = (text: string) => text.replace(',', '.').replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');

export const outOfRange = (field: keyof typeof RANGE, text: string) => {
  const value = Number(text);
  if (!text.trim()) return false;
  return !Number.isFinite(value) || value < RANGE[field].min || value > RANGE[field].max;
};

/**
 * Height and weight fields. `onCommit` fires on blur with a believable number,
 * or null when the field is empty or a typo.
 */
export function BodyInputs({
  initial,
  onCommit,
}: {
  initial: Pick<Profile, 'heightCm' | 'weightKg'>;
  onCommit: (patch: Partial<Profile>) => void;
}) {
  const [height, setHeight] = useState(initial.heightCm ? String(initial.heightCm) : '');
  const [weight, setWeight] = useState(initial.weightKg ? String(initial.weightKg) : '');

  const commit = (field: keyof typeof RANGE, text: string) =>
    onCommit({ [field]: outOfRange(field, text) || !text.trim() ? null : Number(text) });

  const field = (
    label: string,
    unit: string,
    key: keyof typeof RANGE,
    value: string,
    setValue: (t: string) => void,
    placeholder: string,
  ) => (
    <View key={key}>
      <View style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.inputWrap}>
          <TextInput
            value={value}
            onChangeText={(t) => setValue(clean(t))}
            onBlur={() => commit(key, value)}
            placeholder={placeholder}
            placeholderTextColor={colors.textFaint}
            keyboardType="decimal-pad"
            returnKeyType="done"
            maxLength={5}
            onSubmitEditing={() => commit(key, value)}
            style={[styles.input, outOfRange(key, value) && styles.inputBad]}
          />
          <Text style={styles.unit}>{unit}</Text>
        </View>
      </View>
      {outOfRange(key, value) && <Text style={styles.badHint}>{RANGE[key].hint}</Text>}
    </View>
  );

  return (
    <>
      {field('Height', 'cm', 'heightCm', height, setHeight, '180')}
      {field('Weight', 'kg', 'weightKg', weight, setWeight, '80')}
    </>
  );
}

export function LevelPicker({
  value,
  onChange,
}: {
  value: ExperienceLevel;
  onChange: (level: ExperienceLevel) => void;
}) {
  return (
    <>
      {LEVELS.map((l) => {
        const on = value === l.key;
        return (
          <Pressable
            key={l.key}
            onPress={() => onChange(l.key)}
            style={[styles.levelRow, on && styles.levelRowOn]}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.levelLabel, on && { color: colors.accent }]}>{l.label}</Text>
              <Text style={styles.levelBlurb}>{l.blurb}</Text>
            </View>
            <Ionicons
              name={on ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={on ? colors.accent : colors.textFaint}
            />
          </Pressable>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  field: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  label: { color: colors.text, fontSize: 16 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 96,
    textAlign: 'right',
  },
  unit: { color: colors.textDim, fontSize: 15, width: 24 },
  inputBad: { borderWidth: 1, borderColor: colors.danger },
  badHint: { color: colors.danger, fontSize: 12, textAlign: 'right', marginTop: -6, marginBottom: 10 },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  levelRowOn: { backgroundColor: colors.cardAlt, borderColor: colors.accent + '55' },
  levelLabel: { color: colors.text, fontSize: 16, fontWeight: '600' },
  levelBlurb: { color: colors.textFaint, fontSize: 12, marginTop: 2 },
});
