import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { describe } from '../api';
import { useAuth } from '../auth';
import { BodyInputs, EquipmentPicker, LevelPicker } from '../BodyInputs';
import { Button, Card, SectionTitle } from '../components';
import { DEFAULT_PROFILE } from '../data';
import { colors } from '../theme';
import { ExperienceLevel, Profile } from '../types';

/** Shown once, right after the first sign-in: weights need a bodyweight. */
export default function OnboardingScreen() {
  const { user, updateProfile, signOut } = useAuth();
  const [draft, setDraft] = useState<Profile>(user?.profile ?? DEFAULT_PROFILE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!draft.weightKg) return;
    setBusy(true);
    setError(null);
    try {
      await updateProfile(draft);
    } catch (err) {
      setError(describe(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.h1}>A couple of numbers</Text>
        <Text style={styles.sub}>
          Your weight sets the starting kg for every exercise the app suggests. You can change these any time.
        </Text>

        <Card>
          <SectionTitle>Body</SectionTitle>
          <BodyInputs
            initial={draft}
            onCommit={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
          />
          <Text style={styles.note}>
            Height is only used for BMI — how tall you are barely changes what you can lift.
          </Text>
        </Card>

        <Card>
          <SectionTitle>Experience</SectionTitle>
          <LevelPicker
            value={draft.level}
            onChange={(level: ExperienceLevel) => setDraft((prev) => ({ ...prev, level }))}
          />
        </Card>

        <Card>
          <SectionTitle>Where do you train?</SectionTitle>
          <EquipmentPicker
            value={draft.equipment}
            onChange={(equipment) => setDraft((prev) => ({ ...prev, equipment }))}
          />
        </Card>

        {!!error && <Text style={styles.error}>{error}</Text>}

        <Button
          label={busy ? 'Saving…' : 'Start training'}
          onPress={save}
          disabled={!draft.weightKg || busy}
          style={{ marginTop: 4 }}
        />
        {!draft.weightKg && <Text style={styles.hint}>Enter your weight to continue.</Text>}

        <Button label="Sign out" variant="ghost" onPress={signOut} style={{ marginTop: 12 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingTop: 40, paddingBottom: 32, flexGrow: 1, justifyContent: 'center' },
  h1: { color: colors.text, fontSize: 30, fontWeight: '800', marginBottom: 6 },
  sub: { color: colors.textDim, fontSize: 14, lineHeight: 20, marginBottom: 18 },
  note: { color: colors.textFaint, fontSize: 12, lineHeight: 17, marginTop: 6 },
  error: { color: colors.danger, fontSize: 13, marginBottom: 10 },
  hint: { color: colors.textFaint, fontSize: 12, textAlign: 'center', marginTop: 8 },
});
