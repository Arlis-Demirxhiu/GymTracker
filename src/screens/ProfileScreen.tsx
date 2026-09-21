import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card, SectionTitle } from '../components';
import { useStore } from '../store';
import { colors, radius } from '../theme';
import { ExperienceLevel } from '../types';

const LEVELS: { key: ExperienceLevel; label: string; blurb: string }[] = [
  { key: 'beginner', label: 'Beginner', blurb: 'First months of lifting' },
  { key: 'intermediate', label: 'Intermediate', blurb: 'Training consistently for a year or so' },
  { key: 'advanced', label: 'Advanced', blurb: 'Several years of steady progress' },
];

/** Keeps only digits and a single decimal separator, so the field can't hold junk. */
const clean = (text: string) => text.replace(',', '.').replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');

/** Ranges the API accepts; anything outside is a typo, not a person. */
const RANGE = {
  heightCm: { min: 100, max: 250, hint: 'Enter a height between 100 and 250 cm' },
  weightKg: { min: 30, max: 300, hint: 'Enter a weight between 30 and 300 kg' },
};

export default function ProfileScreen() {
  const { profile, updateProfile } = useStore();
  const [height, setHeight] = useState(profile.heightCm ? String(profile.heightCm) : '');
  const [weight, setWeight] = useState(profile.weightKg ? String(profile.weightKg) : '');

  const invalid = (field: keyof typeof RANGE, text: string) => {
    const value = Number(text);
    if (!text.trim()) return false;
    return !Number.isFinite(value) || value < RANGE[field].min || value > RANGE[field].max;
  };

  /** Saves on blur, but only a believable number — a typo leaves the stored value empty. */
  const commit = (field: keyof typeof RANGE, text: string) => {
    updateProfile({ [field]: invalid(field, text) || !text.trim() ? null : Number(text) });
  };

  const bmi =
    profile.heightCm && profile.weightKg ? profile.weightKg / (profile.heightCm / 100) ** 2 : null;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.h1}>You</Text>
      <Text style={styles.sub}>Your weight sets the starting kg for suggested exercises.</Text>

      <Card>
        <SectionTitle>Body</SectionTitle>

        <View style={styles.field}>
          <Text style={styles.label}>Height</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={height}
              onChangeText={(t) => setHeight(clean(t))}
              onBlur={() => commit('heightCm', height)}
              placeholder="180"
              placeholderTextColor={colors.textFaint}
              keyboardType="decimal-pad"
              returnKeyType="done"
              maxLength={5}
              style={[styles.input, invalid('heightCm', height) && styles.inputBad]}
            />
            <Text style={styles.unit}>cm</Text>
          </View>
        </View>
        {invalid('heightCm', height) && <Text style={styles.badHint}>{RANGE.heightCm.hint}</Text>}

        <View style={styles.field}>
          <Text style={styles.label}>Weight</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={weight}
              onChangeText={(t) => setWeight(clean(t))}
              onBlur={() => commit('weightKg', weight)}
              placeholder="80"
              placeholderTextColor={colors.textFaint}
              keyboardType="decimal-pad"
              returnKeyType="done"
              maxLength={5}
              style={[styles.input, invalid('weightKg', weight) && styles.inputBad]}
            />
            <Text style={styles.unit}>kg</Text>
          </View>
        </View>
        {invalid('weightKg', weight) && <Text style={styles.badHint}>{RANGE.weightKg.hint}</Text>}

        {bmi !== null && (
          <View style={styles.bmiRow}>
            <Text style={styles.bmiLabel}>BMI</Text>
            <Text style={styles.bmiValue}>{bmi.toFixed(1)}</Text>
          </View>
        )}
        <Text style={styles.note}>
          Height is only used for BMI. Suggested weights come from your bodyweight and experience — how tall you are
          barely changes what you can lift.
        </Text>
      </Card>

      <Card>
        <SectionTitle>Experience</SectionTitle>
        {LEVELS.map((l) => {
          const on = profile.level === l.key;
          return (
            <Pressable
              key={l.key}
              onPress={() => updateProfile({ level: l.key })}
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
      </Card>

      <Card>
        <SectionTitle>How the weights are worked out</SectionTitle>
        <Text style={styles.note}>
          Each lift has a share of bodyweight that suits a beginner — a bench press starts near 55% of what you weigh —
          and your experience level scales it up. The result is rounded to the plates and dumbbells a gym actually has.
        </Text>
        <Text style={[styles.note, { marginTop: 10, color: colors.textDim }]}>
          Treat every number as a first warm-up-and-see guess, not a target. Technique, sleep, leverages and the day all
          matter more than a formula. Stop if your form breaks down, and get a coach's eye on the big lifts.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  h1: { color: colors.text, fontSize: 32, fontWeight: '800', marginBottom: 4 },
  sub: { color: colors.textDim, fontSize: 14, marginBottom: 16 },
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
  bmiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  bmiLabel: { color: colors.textDim, fontSize: 15 },
  bmiValue: { color: colors.text, fontSize: 15, fontWeight: '700' },
  note: { color: colors.textFaint, fontSize: 12, lineHeight: 17, marginTop: 10 },
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
