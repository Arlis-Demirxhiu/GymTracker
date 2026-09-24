import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, SectionTitle } from './components';
import { useHealth } from './health';
import { colors, radius } from './theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const format = (value: number | null) => (value === null ? '—' : Math.round(value).toLocaleString());

/**
 * Today's numbers from Apple Health. Renders nothing where Health doesn't
 * exist (Expo Go, web), so the screen looks the same as before there.
 */
export function HealthCard({ day }: { day: Date }) {
  const { available, summary, loading, reload } = useHealth(day);
  if (!available) return null;

  const empty = Object.values(summary).every((v) => v === null);

  const tile = (icon: IconName, color: string, value: string, unit: string, label: string) => (
    <View style={styles.tile} key={label}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={styles.value}>
        {value}
        {value !== '—' && <Text style={styles.unit}> {unit}</Text>}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );

  return (
    <Card>
      <SectionTitle
        right={
          loading ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Pressable onPress={reload} hitSlop={10} accessibilityLabel="Refresh health data">
              <Ionicons name="refresh" size={18} color={colors.textDim} />
            </Pressable>
          )
        }
      >
        Apple Health
      </SectionTitle>

      <View style={styles.grid}>
        {tile('flame', '#FF6B6B', format(summary.activeEnergyKcal), 'kcal', 'Active calories')}
        {tile('flame-outline', '#FFB84D', format(summary.totalEnergyKcal), 'kcal', 'Total burned')}
        {tile('footsteps', colors.accent, format(summary.steps), '', 'Steps')}
        {tile('timer-outline', '#7BD3EA', format(summary.exerciseMinutes), 'min', 'Exercise')}
        {tile('heart', '#FF8FAB', format(summary.restingHeartRate), 'bpm', 'Resting HR')}
      </View>

      {!loading && empty && (
        <Text style={styles.note}>
          No readings yet. If you declined access, turn it on in Settings › Health › Data Access & Devices ›
          GymTracker — iOS won't ask twice.
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: {
    flexGrow: 1,
    flexBasis: '30%',
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    padding: 12,
    gap: 4,
  },
  value: { color: colors.text, fontSize: 20, fontWeight: '800' },
  unit: { color: colors.textDim, fontSize: 12, fontWeight: '600' },
  label: { color: colors.textFaint, fontSize: 11, fontWeight: '600' },
  note: { color: colors.textFaint, fontSize: 12, lineHeight: 17, marginTop: 12 },
});
