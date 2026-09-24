import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { describe } from '../api';
import { useAuth } from '../auth';
import { BodyInputs, EquipmentPicker, LevelPicker } from '../BodyInputs';
import { Button, Card, SectionTitle } from '../components';
import { getHealthSummary, isHealthAvailable, requestHealthAccess } from '../health';
import { DEFAULT_PROFILE } from '../data';
import { KeyboardAwareScrollView } from '../KeyboardAwareScrollView';
import { colors } from '../theme';
import { Profile } from '../types';

export default function ProfileScreen() {
  const { user, updateProfile, signOut } = useAuth();
  const profile: Profile = user?.profile ?? DEFAULT_PROFILE;
  const [error, setError] = useState<string | null>(null);

  const save = (patch: Partial<Profile>) => {
    setError(null);
    updateProfile(patch).catch((err) => setError(describe(err)));
  };

  const [importing, setImporting] = useState(false);

  /** Copies the latest height and weight Apple Health has on file. */
  const importFromHealth = async () => {
    setImporting(true);
    setError(null);
    try {
      await requestHealthAccess();
      const health = await getHealthSummary();
      if (health.weightKg === null && health.heightCm === null) {
        setError("Apple Health doesn't have a height or weight for you yet.");
        return;
      }
      await updateProfile({
        ...(health.weightKg !== null && { weightKg: Math.round(health.weightKg * 10) / 10 }),
        ...(health.heightCm !== null && { heightCm: Math.round(health.heightCm) }),
      });
    } catch (err) {
      setError(describe(err));
    } finally {
      setImporting(false);
    }
  };

  const confirmSignOut = () =>
    Alert.alert('Sign out?', 'Your workouts stay on this device; your profile stays on the server.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);

  const bmi = profile.heightCm && profile.weightKg ? profile.weightKg / (profile.heightCm / 100) ** 2 : null;

  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.container}>
      <Text style={styles.h1}>You</Text>
      <Text style={styles.sub}>{user?.email ?? 'Signed in'}</Text>

      <Card>
        <SectionTitle>Body</SectionTitle>
        <BodyInputs key={`${profile.heightCm}-${profile.weightKg}`} initial={profile} onCommit={save} />
        {isHealthAvailable() && (
          <Button
            label={importing ? 'Reading Apple Health…' : 'Fill in from Apple Health'}
            variant="ghost"
            onPress={importFromHealth}
            disabled={importing}
            style={{ marginTop: 4, marginBottom: 8 }}
          />
        )}

        {bmi !== null && (
          <View style={styles.bmiRow}>
            <Text style={styles.bmiLabel}>BMI</Text>
            <Text style={styles.bmiValue}>{bmi.toFixed(1)}</Text>
          </View>
        )}
        {!!error && <Text style={styles.error}>{error}</Text>}
        <Text style={styles.note}>
          Height is only used for BMI. Suggested weights come from your bodyweight and experience — how tall you are
          barely changes what you can lift.
        </Text>
      </Card>

      <Card>
        <SectionTitle>Experience</SectionTitle>
        <LevelPicker value={profile.level} onChange={(level) => save({ level })} />
      </Card>

      <Card>
        <SectionTitle>Equipment</SectionTitle>
        <EquipmentPicker value={profile.equipment} onChange={(equipment) => save({ equipment })} />
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

      <Button label="Sign out" variant="ghost" onPress={confirmSignOut} />
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  h1: { color: colors.text, fontSize: 32, fontWeight: '800', marginBottom: 4 },
  sub: { color: colors.textDim, fontSize: 14, marginBottom: 16 },
  bmiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  bmiLabel: { color: colors.textDim, fontSize: 15 },
  bmiValue: { color: colors.text, fontSize: 15, fontWeight: '700' },
  error: { color: colors.danger, fontSize: 13, marginTop: 10 },
  note: { color: colors.textFaint, fontSize: 12, lineHeight: 17, marginTop: 10 },
});
