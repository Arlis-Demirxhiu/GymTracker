import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BodyPartTag, Card, SectionTitle } from '../components';
import { addDays, BODY_PART_MAP, BODY_PARTS, formatDate, fromDateKey, startOfWeek, toDateKey } from '../data';
import { useStore } from '../store';
import { colors, radius } from '../theme';

const RANGES = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

export default function HistoryScreen() {
  const { logs, deleteLog } = useStore();
  const [range, setRange] = useState(RANGES[1]);
  const todayKey = toDateKey(new Date());
  const [weekOffset, setWeekOffset] = useState(0);

  const weekStart = addDays(startOfWeek(new Date()), weekOffset * 7);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const logsByDate = useMemo(() => new Map(logs.map((l) => [l.date, l])), [logs]);
  const weekCount = weekDays.filter((d) => logsByDate.get(toDateKey(d))?.bodyParts.length).length;

  const counts = useMemo(() => {
    const cutoff = toDateKey(addDays(new Date(), -(range.days - 1)));
    const recent = logs.filter((l) => l.date >= cutoff);
    return BODY_PARTS.map((bp) => ({
      ...bp,
      count: recent.filter((l) => l.bodyParts.includes(bp.key)).length,
    })).sort((a, b) => b.count - a.count);
  }, [logs, range]);
  const maxCount = Math.max(1, ...counts.map((c) => c.count));

  const confirmDelete = (id: string, date: string) =>
    Alert.alert('Delete workout?', `Remove the log for ${formatDate(fromDateKey(date))}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteLog(id) },
    ]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.h1}>History</Text>

      <Card>
        <SectionTitle
          right={
            <View style={styles.weekNav}>
              <Pressable onPress={() => setWeekOffset((w) => w - 1)} hitSlop={10}>
                <Ionicons name="chevron-back" size={18} color={colors.textDim} />
              </Pressable>
              <Pressable onPress={() => setWeekOffset(0)} hitSlop={6}>
                <Text style={styles.weekLabel}>
                  {weekOffset === 0 ? 'This week' : `${formatShort(weekDays[0])} – ${formatShort(weekDays[6])}`}
                </Text>
              </Pressable>
              <Pressable onPress={() => setWeekOffset((w) => Math.min(0, w + 1))} hitSlop={10} disabled={weekOffset === 0}>
                <Ionicons name="chevron-forward" size={18} color={weekOffset === 0 ? colors.textFaint : colors.textDim} />
              </Pressable>
            </View>
          }
        >
          {weekCount} / 7 days
        </SectionTitle>
        <View style={styles.weekRow}>
          {weekDays.map((d) => {
            const key = toDateKey(d);
            const log = logsByDate.get(key);
            const trained = !!log?.bodyParts.length;
            return (
              <View key={key} style={styles.weekDay}>
                <Text style={[styles.weekDayName, key === todayKey && { color: colors.accent }]}>
                  {d.toLocaleDateString(undefined, { weekday: 'narrow' })}
                </Text>
                <View
                  style={[
                    styles.weekCircle,
                    trained && { backgroundColor: colors.accent, borderColor: colors.accent },
                    key === todayKey && !trained && { borderColor: colors.accent },
                  ]}
                >
                  <Text style={[styles.weekDate, trained && { color: colors.accentText }]}>{d.getDate()}</Text>
                </View>
                <View style={styles.weekDots}>
                  {log?.bodyParts.slice(0, 4).map((p) => (
                    <View key={p} style={[styles.miniDot, { backgroundColor: BODY_PART_MAP[p].color }]} />
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      </Card>

      <Card>
        <SectionTitle>Sessions per body part</SectionTitle>
        <View style={styles.rangeRow}>
          {RANGES.map((r) => (
            <Pressable
              key={r.days}
              onPress={() => setRange(r)}
              style={[styles.rangeBtn, r.days === range.days && styles.rangeBtnOn]}
            >
              <Text style={[styles.rangeText, r.days === range.days && { color: colors.accentText }]}>{r.label}</Text>
            </Pressable>
          ))}
        </View>
        {counts.map((c) => (
          <View key={c.key} style={styles.barRow}>
            <Text style={styles.barLabel}>{c.label}</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { width: `${(c.count / maxCount) * 100}%`, backgroundColor: c.color, minWidth: c.count ? 6 : 0 },
                ]}
              />
            </View>
            <Text style={styles.barCount}>{c.count}</Text>
          </View>
        ))}
      </Card>

      <SectionTitle>All workouts ({logs.length})</SectionTitle>
      {logs.length === 0 && (
        <Card>
          <Text style={styles.empty}>No workouts logged yet. Head to Today and tap the muscles you trained.</Text>
        </Card>
      )}
      {logs.map((l) => (
        <Card key={l.id}>
          <View style={styles.logHeader}>
            <Text style={styles.logDate}>{formatDate(fromDateKey(l.date))}</Text>
            <Pressable onPress={() => confirmDelete(l.id, l.date)} hitSlop={10}>
              <Ionicons name="trash-outline" size={18} color={colors.textFaint} />
            </Pressable>
          </View>
          <View style={styles.tagRow}>
            {l.bodyParts.map((p) => (
              <BodyPartTag key={p} part={p} small />
            ))}
          </View>
          {!!l.note && <Text style={styles.note}>{l.note}</Text>}
        </Card>
      ))}
    </ScrollView>
  );
}

const formatShort = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  h1: { color: colors.text, fontSize: 32, fontWeight: '800', marginBottom: 16 },
  weekNav: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  weekLabel: { color: colors.textDim, fontSize: 13, fontWeight: '600' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDay: { alignItems: 'center', flex: 1 },
  weekDayName: { color: colors.textFaint, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  weekCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDate: { color: colors.text, fontSize: 14, fontWeight: '700' },
  weekDots: { flexDirection: 'row', gap: 2, marginTop: 6, height: 6 },
  miniDot: { width: 6, height: 6, borderRadius: 3 },
  rangeRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  rangeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.cardAlt },
  rangeBtnOn: { backgroundColor: colors.accent },
  rangeText: { color: colors.textDim, fontSize: 13, fontWeight: '600' },
  barRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  barLabel: { color: colors.text, fontSize: 14, width: 92 },
  barTrack: { flex: 1, height: 10, backgroundColor: colors.cardAlt, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
  barCount: { color: colors.textDim, fontSize: 14, fontWeight: '600', width: 28, textAlign: 'right' },
  empty: { color: colors.textDim, fontSize: 15, lineHeight: 21 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  logDate: { color: colors.text, fontSize: 16, fontWeight: '700' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap' },
  note: { color: colors.textDim, fontSize: 14, marginTop: 6, fontStyle: 'italic' },
});
