import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { fetchSuggestions, useSuggestions } from '../api';
import { useAuth } from '../auth';
import { BodyPartSelector, BodyPartTag, Button, Card, SectionTitle } from '../components';
import { HealthCard } from '../HealthCard';
import {
  addDays,
  BODY_PART_MAP,
  BODY_PARTS,
  dayTitle,
  daysBetween,
  formatDate,
  fromDateKey,
  isEmptyDay,
  newId,
  toDateKey,
  WEEKDAY_NAMES,
} from '../data';
import { KeyboardAwareScrollView } from '../KeyboardAwareScrollView';
import { useStore } from '../store';
import { colors, radius } from '../theme';
import { BodyPart, Exercise, Weekday } from '../types';

const sameParts = (a: BodyPart[], b: BodyPart[]) => [...a].sort().join() === [...b].sort().join();

/** Yes/no question that also works in the browser, where Alert ignores buttons. */
const confirm = (title: string, message: string) =>
  new Promise<boolean>((resolve) => {
    if (Platform.OS === 'web') return resolve(window.confirm(`${title}\n\n${message}`));
    Alert.alert(title, message, [
      { text: 'Keep it', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Replace', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });

export default function TodayScreen() {
  const { agenda, logs, saveLog, logForDate, settings, updateSettings, updateDay } = useStore();
  const { token, user } = useAuth();
  const profile = user!.profile;
  const todayKey = toDateKey(new Date());
  const [dateKey, setDateKey] = useState(todayKey);
  const date = fromDateKey(dateKey);
  const isToday = dateKey === todayKey;
  const plan = agenda[date.getDay() as Weekday];
  const existing = logForDate(dateKey);

  const [selected, setSelected] = useState<BodyPart[]>([]);
  const [note, setNote] = useState('');

  // Load the saved log whenever the viewed date (or its saved log) changes.
  useEffect(() => {
    setSelected(existing?.bodyParts ?? []);
    setNote(existing?.note ?? '');
  }, [dateKey, existing]);

  const dirty =
    [...selected].sort().join() !== [...(existing?.bodyParts ?? [])].sort().join() || note.trim() !== (existing?.note ?? '');

  const toggle = (p: BodyPart) =>
    setSelected((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  // Suggestions follow the saved log, so they appear once the workout is logged.
  const savedParts = existing?.bodyParts ?? [];
  const suggestions = useSuggestions(savedParts, token, profile);

  const shiftDate = (n: number) => {
    const next = addDays(date, n);
    if (toDateKey(next) > todayKey) return;
    setDateKey(toDateKey(next));
  };

  const weekday = date.getDay() as Weekday;
  const dayName = WEEKDAY_NAMES[weekday];

  /**
   * Saves the log and, when the option is on, makes the workout that weekday's
   * agenda plan too — with the suggested exercises. A plan the user built
   * themselves is only replaced after asking.
   */
  const save = async () => {
    saveLog(dateKey, selected, note);
    if (!settings.syncAgenda || selected.length === 0) return;

    const current = agenda[weekday];
    if (!current.rest && sameParts(current.bodyParts, selected)) return; // already the plan

    if (!isEmptyDay(current)) {
      const replace = await confirm(
        `Replace ${dayName}'s plan?`,
        `${dayName} is planned as "${dayTitle(current)}". Put this workout there instead?`,
      );
      if (!replace) return;
    }

    let exercises: Exercise[] = [];
    try {
      const { exercises: suggested } = await fetchSuggestions(selected, token);
      exercises = suggested.map((x) => ({ id: newId(), name: x.name, sets: x.sets, reps: x.reps }));
    } catch {
      // Offline: still plan the muscles; the exercises can be filled in later.
    }
    updateDay(weekday, { title: '', rest: false, bodyParts: selected, exercises });
  };

  // Before anything is logged the screen simply asks what you feel like training.
  const askWhatToTrain = savedParts.length === 0;

  // Days since each body part was last trained, relative to the real today.
  const recovery = useMemo(() => {
    const now = new Date();
    return BODY_PARTS.map((bp) => {
      const last = logs.find((l) => l.bodyParts.includes(bp.key)); // logs are sorted newest first
      return { ...bp, days: last ? daysBetween(fromDateKey(last.date), now) : null };
    }).sort((a, b) => (b.days ?? Infinity) - (a.days ?? Infinity));
  }, [logs]);

  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.container}>
      <Text style={styles.h1}>{isToday ? 'Today' : WEEKDAY_NAMES[date.getDay()]}</Text>

      <View style={styles.dateRow}>
        <Pressable onPress={() => shiftDate(-1)} hitSlop={12} style={styles.dateBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <Pressable onPress={() => setDateKey(todayKey)}>
          <Text style={styles.dateText}>{formatDate(date)}</Text>
          {!isToday && <Text style={styles.backToday}>Tap to jump to today</Text>}
        </Pressable>
        <Pressable onPress={() => shiftDate(1)} hitSlop={12} style={[styles.dateBtn, isToday && { opacity: 0.25 }]} disabled={isToday}>
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </Pressable>
      </View>

      <HealthCard day={date} />

      {!isEmptyDay(plan) && !(savedParts.length > 0 && !plan.rest && sameParts(plan.bodyParts, savedParts)) && (
        <Card>
          <SectionTitle>Planned</SectionTitle>
          {plan.rest ? (
            <View style={styles.restRow}>
              <Ionicons name="bed-outline" size={22} color={colors.textDim} />
              <Text style={styles.restText}>{plan.title || 'Rest day'} — recover and stretch.</Text>
            </View>
          ) : (
            <>
              <Text style={styles.planTitle}>{dayTitle(plan)}</Text>
              <View style={styles.tagRow}>
                {plan.bodyParts.map((p) => (
                  <BodyPartTag key={p} part={p} />
                ))}
              </View>
              {plan.exercises.map((e) => (
                <View key={e.id} style={styles.exRow}>
                  <Text style={styles.exName}>{e.name}</Text>
                  <Text style={styles.exMeta}>
                    {[e.sets && `${e.sets} sets`, e.reps && `${e.reps} reps`].filter(Boolean).join(' × ')}
                  </Text>
                </View>
              ))}
              {plan.bodyParts.length > 0 && (
                <Button
                  label="Log planned workout"
                  variant="ghost"
                  style={{ marginTop: 12 }}
                  onPress={() => setSelected((prev) => Array.from(new Set([...prev, ...plan.bodyParts])))}
                />
              )}
            </>
          )}
        </Card>
      )}

      {savedParts.length > 0 && (
        <Card>
          <SectionTitle
            right={
              suggestions.loading ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Pressable onPress={suggestions.reload} hitSlop={10}>
                  <Ionicons name="refresh" size={18} color={colors.textDim} />
                </Pressable>
              )
            }
          >
            Your exercises
          </SectionTitle>

          {suggestions.error ? (
            <View>
              <Text style={styles.errText}>{suggestions.error}</Text>
              <Button label="Try again" variant="ghost" onPress={suggestions.reload} style={{ marginTop: 10 }} />
            </View>
          ) : (
            <>
              {suggestions.exercises.map((e) => (
                <View key={e.id} style={styles.exRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exName}>{e.name}</Text>
                    <Text style={styles.exSub}>{e.equipment}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    {!!e.suggestedLoad && (
                      <Text style={[styles.exLoad, e.suggestedLoad.kg === null && { color: colors.textDim }]}>
                        {e.suggestedLoad.label}
                      </Text>
                    )}
                    <Text style={styles.exMeta}>
                      {[e.sets && `${e.sets} sets`, e.reps && `${e.reps} reps`].filter(Boolean).join(' × ')}
                    </Text>
                  </View>
                </View>
              ))}
              {suggestions.uncovered.length > 0 && (
                <View style={styles.uncovered}>
                  <Ionicons name="alert-circle-outline" size={18} color="#FFB84D" />
                  <Text style={styles.uncoveredText}>
                    Nothing in your equipment trains{' '}
                    {suggestions.uncovered.map((p) => BODY_PART_MAP[p].label.toLowerCase()).join(' or ')}. Add
                    dumbbells or a pull-up bar on the You tab to get exercises for{' '}
                    {suggestions.uncovered.length === 1 ? 'it' : 'them'}.
                  </Text>
                </View>
              )}
              {suggestions.exercises.some((e) => e.suggestedLoad?.kg != null) && (
                <Text style={styles.loadNote}>
                  Starting weights for a {profile.level} at {profile.weightKg} kg — warm up first and adjust to your own
                  strength.
                </Text>
              )}
            </>
          )}
        </Card>
      )}

      <Card>
        <SectionTitle
          right={existing && !dirty ? <Text style={styles.saved}>✓ Saved</Text> : undefined}
        >
          {askWhatToTrain ? 'What do you want to train today?' : 'What will you train?'}
        </SectionTitle>
        <BodyPartSelector selected={selected} onToggle={toggle} planned={plan.rest ? [] : plan.bodyParts} />
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Notes (PRs, how it felt…)"
          placeholderTextColor={colors.textFaint}
          style={styles.input}
          multiline
        />
        <View style={styles.syncRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.syncLabel}>Save to {dayName}'s agenda</Text>
            <Text style={styles.syncHint}>{dayName} will show this workout and its exercises.</Text>
          </View>
          <Switch
            value={settings.syncAgenda}
            onValueChange={(syncAgenda) => updateSettings({ syncAgenda })}
            trackColor={{ true: colors.accent, false: colors.border }}
            accessibilityLabel={`Save to ${dayName}'s agenda`}
          />
        </View>
        <Button
          label={existing ? (selected.length || note.trim() ? 'Update log' : 'Clear log') : 'Save workout'}
          onPress={save}
          disabled={!dirty}
          style={{ marginTop: 12 }}
        />
      </Card>

      <Card>
        <SectionTitle>Last trained</SectionTitle>
        {recovery.map((r) => (
          <View key={r.key} style={styles.recRow}>
            <View style={[styles.recDot, { backgroundColor: r.color }]} />
            <Text style={styles.recLabel}>{r.label}</Text>
            <Text style={[styles.recDays, { color: recoveryColor(r.days) }]}>{recoveryLabel(r.days)}</Text>
          </View>
        ))}
      </Card>
    </KeyboardAwareScrollView>
  );
}

const recoveryLabel = (d: number | null) =>
  d === null ? 'Never' : d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d} days ago`;

// Green = recently hit, amber = due, red = neglected.
const recoveryColor = (d: number | null) =>
  d === null || d >= 7 ? colors.danger : d >= 4 ? '#FFB84D' : colors.accent;

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  h1: { color: colors.text, fontSize: 32, fontWeight: '800', marginBottom: 6 },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  dateBtn: { backgroundColor: colors.card, borderRadius: radius.pill, padding: 8, borderWidth: 1, borderColor: colors.border },
  dateText: { color: colors.text, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  backToday: { color: colors.accent, fontSize: 11, textAlign: 'center', marginTop: 2 },
  planTitle: { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 10 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },
  exRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  exName: { color: colors.text, fontSize: 15, flexShrink: 1 },
  exSub: { color: colors.textFaint, fontSize: 12, marginTop: 2 },
  exMeta: { color: colors.textDim, fontSize: 14, marginLeft: 12 },
  errText: { color: colors.textDim, fontSize: 14 },
  exLoad: { color: colors.accent, fontSize: 15, fontWeight: '700' },
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  syncLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
  syncHint: { color: colors.textFaint, fontSize: 12, marginTop: 2 },
  uncovered: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: '#FFB84D1A',
  },
  uncoveredText: { color: colors.textDim, fontSize: 13, lineHeight: 18, flex: 1 },
  loadNote: { color: colors.textFaint, fontSize: 11, lineHeight: 16, marginTop: 12 },
  restRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  restText: { color: colors.textDim, fontSize: 15, flexShrink: 1 },
  saved: { color: colors.accent, fontWeight: '700', fontSize: 13 },
  input: {
    marginTop: 14,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    color: colors.text,
    padding: 12,
    minHeight: 48,
    fontSize: 15,
  },
  recRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  recDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  recLabel: { color: colors.text, fontSize: 15, flex: 1 },
  recDays: { fontSize: 14, fontWeight: '600' },
});
