import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ComponentProps, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { EQUIPMENT_PRESETS, GEAR_OPTIONS } from './data';
import { colors, radius } from './theme';
import { ExperienceLevel, Gear, Profile } from './types';

type MciName = ComponentProps<typeof MaterialCommunityIcons>['name'];

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

/**
 * What the lifter owns. Presets fill the toggles in one tap; the toggles then
 * fine-tune, e.g. "dumbbells at home" plus a pull-up bar.
 */
export function EquipmentPicker({ value, onChange }: { value: Gear[]; onChange: (next: Gear[]) => void }) {
  const has = (g: Gear) => value.includes(g);
  const toggle = (g: Gear) => onChange(has(g) ? value.filter((x) => x !== g) : [...value, g]);
  const sameSet = (a: Gear[], b: Gear[]) => a.length === b.length && a.every((g) => b.includes(g));

  return (
    <View>
      <View style={styles.presetRow}>
        {EQUIPMENT_PRESETS.map((p) => {
          const on = sameSet(value, p.gear);
          return (
            <Pressable
              key={p.key}
              onPress={() => onChange(p.gear)}
              style={[styles.preset, on && styles.presetOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <MaterialCommunityIcons
                name={p.icon as MciName}
                size={20}
                color={on ? colors.accentText : colors.textDim}
              />
              <Text style={[styles.presetText, on && { color: colors.accentText }]}>{p.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.gearGrid}>
        {GEAR_OPTIONS.map((g) => {
          const on = has(g.key);
          return (
            <Pressable
              key={g.key}
              onPress={() => toggle(g.key)}
              style={[styles.gear, on && styles.gearOn]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
            >
              <MaterialCommunityIcons name={g.icon as MciName} size={16} color={on ? colors.accent : colors.textFaint} />
              <Text style={[styles.gearText, on && { color: colors.text }]}>{g.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.gearNote}>
        {value.length === 0
          ? 'Bodyweight only — biceps and forearms need at least dumbbells or a pull-up bar.'
          : 'Exercises that need anything you haven\'t ticked are left out.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  presetRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  preset: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: radius.md,
    backgroundColor: colors.cardAlt,
  },
  presetOn: { backgroundColor: colors.accent },
  presetText: { color: colors.textDim, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  gearGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
  },
  gearOn: { borderColor: colors.accent, backgroundColor: colors.accent + '1F' },
  gearText: { color: colors.textDim, fontSize: 13, fontWeight: '600' },
  gearNote: { color: colors.textFaint, fontSize: 12, lineHeight: 17, marginTop: 12 },
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
