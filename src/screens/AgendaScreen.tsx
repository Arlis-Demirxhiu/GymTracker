import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchSuggestions } from '../api';
import { useAuth } from '../auth';
import { BodyPartSelector, BodyPartTag, Button, Card } from '../components';
import { dayTitle, newId, partsTitle, WEEK_ORDER, WEEKDAY_NAMES } from '../data';
import { useStore } from '../store';
import { colors, radius } from '../theme';
import { BodyPart, DayPlan, Weekday } from '../types';

export default function AgendaScreen() {
  const { agenda, updateDay, resetAgenda } = useStore();
  const [editing, setEditing] = useState<Weekday | null>(null);
  const today = new Date().getDay();

  const confirmReset = () =>
    Alert.alert('Clear agenda?', 'Every day goes back to empty. Your logged workouts are not affected.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: resetAgenda },
    ]);

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.h1}>Weekly Agenda</Text>
          <Pressable onPress={confirmReset} hitSlop={10}>
            <Ionicons name="refresh" size={22} color={colors.textDim} />
          </Pressable>
        </View>
        <Text style={styles.sub}>
          Optional: plan a day ahead of time. Leave it empty and Today will just ask what you feel like training.
        </Text>

        {WEEK_ORDER.map((d) => {
          const plan = agenda[d];
          const isToday = d === today;
          return (
            <Pressable key={d} onPress={() => setEditing(d)} style={({ pressed }) => pressed && { opacity: 0.8 }}>
              <Card style={isToday ? { borderColor: colors.accent } : undefined}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayName}>{WEEKDAY_NAMES[d]}</Text>
                  {isToday && <Text style={styles.todayBadge}>TODAY</Text>}
                  <View style={{ flex: 1 }} />
                  <Ionicons name="create-outline" size={18} color={colors.textFaint} />
                </View>
                <Text style={[styles.dayTitle, plan.rest && { color: colors.textDim }]}>
                  {plan.rest ? `😴 ${dayTitle(plan)}` : dayTitle(plan)}
                </Text>
                {!plan.rest && plan.bodyParts.length > 0 && (
                  <View style={styles.tagRow}>
                    {plan.bodyParts.map((p) => (
                      <BodyPartTag key={p} part={p} small />
                    ))}
                  </View>
                )}
                {!plan.rest && plan.exercises.length > 0 && (
                  <Text style={styles.exSummary} numberOfLines={1}>
                    {plan.exercises.map((e) => e.name).join(' · ')}
                  </Text>
                )}
              </Card>
            </Pressable>
          );
        })}
      </ScrollView>

      {editing !== null && (
        <DayEditor
          day={editing}
          initial={agenda[editing]}
          onClose={() => setEditing(null)}
          onSave={(plan) => {
            updateDay(editing, plan);
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function DayEditor({
  day,
  initial,
  onClose,
  onSave,
}: {
  day: Weekday;
  initial: DayPlan;
  onClose: () => void;
  onSave: (plan: DayPlan) => void;
}) {
  const [plan, setPlan] = useState<DayPlan>(initial);
  const [exName, setExName] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const { token } = useAuth();

  /** Fills the day from the API, keeping whatever is already listed. */
  const suggestExercises = async () => {
    setSuggesting(true);
    try {
      const { exercises: suggested } = await fetchSuggestions(plan.bodyParts, token);
      setPlan((prev) => {
        const have = new Set(prev.exercises.map((e) => e.name.toLowerCase()));
        const additions = suggested
          .filter((s) => !have.has(s.name.toLowerCase()))
          .map((s) => ({ id: newId(), name: s.name, sets: s.sets, reps: s.reps }));
        return { ...prev, exercises: [...prev.exercises, ...additions] };
      });
    } catch {
      Alert.alert('No suggestions', "Couldn't reach the exercise server. Check that it is running.");
    } finally {
      setSuggesting(false);
    }
  };

  const toggle = (p: BodyPart) =>
    setPlan((prev) => ({
      ...prev,
      bodyParts: prev.bodyParts.includes(p) ? prev.bodyParts.filter((x) => x !== p) : [...prev.bodyParts, p],
    }));

  const addExercise = () => {
    if (!exName.trim()) return;
    setPlan((prev) => ({
      ...prev,
      exercises: [...prev.exercises, { id: newId(), name: exName.trim(), sets: sets.trim(), reps: reps.trim() }],
    }));
    setExName('');
    setSets('');
    setReps('');
  };

  const removeExercise = (id: string) =>
    setPlan((prev) => ({ ...prev, exercises: prev.exercises.filter((e) => e.id !== id) }));

  const moveExercise = (index: number, dir: -1 | 1) =>
    setPlan((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.exercises.length) return prev;
      const list = [...prev.exercises];
      [list[index], list[target]] = [list[target], list[index]];
      return { ...prev, exercises: list };
    });

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modal} edges={['top', 'bottom']}>
        <View style={styles.modalHeader}>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </Pressable>
          <Text style={styles.modalTitle}>{WEEKDAY_NAMES[day]}</Text>
          <Pressable onPress={() => onSave({ ...plan, title: plan.title.trim() })} hitSlop={10}>
            <Text style={styles.modalSave}>Save</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
            <Text style={styles.label}>Workout name</Text>
            <TextInput
              value={plan.title}
              onChangeText={(title) => setPlan((p) => ({ ...p, title }))}
              placeholder={plan.rest ? 'Rest' : plan.bodyParts.length > 0 ? partsTitle(plan.bodyParts) : 'e.g. Push, Leg Day, Upper'}
              placeholderTextColor={colors.textFaint}
              style={styles.input}
            />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Rest day</Text>
              <Switch
                value={plan.rest}
                onValueChange={(rest) => setPlan((p) => ({ ...p, rest }))}
                trackColor={{ true: colors.accent, false: colors.border }}
              />
            </View>

            {!plan.rest && (
              <>
                <Text style={styles.label}>Body parts</Text>
                <BodyPartSelector selected={plan.bodyParts} onToggle={toggle} />

                <Text style={[styles.label, { marginTop: 24 }]}>Exercises</Text>
                <Button
                  label={suggesting ? 'Finding exercises…' : '✨ Suggest exercises'}
                  variant="ghost"
                  onPress={suggestExercises}
                  disabled={suggesting || plan.bodyParts.length === 0}
                  style={{ marginBottom: 10 }}
                />
                {plan.exercises.length === 0 && <Text style={styles.empty}>No exercises yet — add one below.</Text>}
                {plan.exercises.map((e, i) => (
                  <View key={e.id} style={styles.exItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.exItemName}>{e.name}</Text>
                      {!!(e.sets || e.reps) && (
                        <Text style={styles.exItemMeta}>
                          {[e.sets && `${e.sets} sets`, e.reps && `${e.reps} reps`].filter(Boolean).join(' × ')}
                        </Text>
                      )}
                    </View>
                    <Pressable onPress={() => moveExercise(i, -1)} hitSlop={6} style={styles.iconBtn} disabled={i === 0}>
                      <Ionicons name="arrow-up" size={18} color={i === 0 ? colors.textFaint : colors.textDim} />
                    </Pressable>
                    <Pressable
                      onPress={() => moveExercise(i, 1)}
                      hitSlop={6}
                      style={styles.iconBtn}
                      disabled={i === plan.exercises.length - 1}
                    >
                      <Ionicons
                        name="arrow-down"
                        size={18}
                        color={i === plan.exercises.length - 1 ? colors.textFaint : colors.textDim}
                      />
                    </Pressable>
                    <Pressable onPress={() => removeExercise(e.id)} hitSlop={6} style={styles.iconBtn}>
                      <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    </Pressable>
                  </View>
                ))}

                <View style={styles.addBox}>
                  <TextInput
                    value={exName}
                    onChangeText={setExName}
                    placeholder="Exercise name"
                    placeholderTextColor={colors.textFaint}
                    style={styles.input}
                    returnKeyType="done"
                    onSubmitEditing={addExercise}
                  />
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <TextInput
                      value={sets}
                      onChangeText={setSets}
                      placeholder="Sets"
                      placeholderTextColor={colors.textFaint}
                      keyboardType="number-pad"
                      style={[styles.input, { flex: 1, minWidth: 0 }]}
                    />
                    <TextInput
                      value={reps}
                      onChangeText={setReps}
                      placeholder="Reps (e.g. 8-12)"
                      placeholderTextColor={colors.textFaint}
                      style={[styles.input, { flex: 2, minWidth: 0 }]}
                    />
                  </View>
                  <Button label="+ Add exercise" variant="ghost" onPress={addExercise} disabled={!exName.trim()} style={{ marginTop: 10 }} />
                </View>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  h1: { color: colors.text, fontSize: 32, fontWeight: '800' },
  sub: { color: colors.textDim, fontSize: 14, marginTop: 4, marginBottom: 16 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  dayName: { color: colors.textDim, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  todayBadge: {
    marginLeft: 8,
    backgroundColor: colors.accent,
    color: colors.accentText,
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  dayTitle: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 8 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap' },
  exSummary: { color: colors.textFaint, fontSize: 13, marginTop: 2 },

  modal: { flex: 1, backgroundColor: colors.bg },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  modalTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  modalCancel: { color: colors.textDim, fontSize: 16 },
  modalSave: { color: colors.accent, fontSize: 16, fontWeight: '700' },
  modalBody: { padding: 16, paddingBottom: 48 },
  label: { color: colors.textDim, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  input: { backgroundColor: colors.cardAlt, borderRadius: radius.md, color: colors.text, padding: 12, fontSize: 15 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 20,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 14,
  },
  switchLabel: { color: colors.text, fontSize: 16, fontWeight: '600' },
  empty: { color: colors.textFaint, fontSize: 14, marginBottom: 10 },
  exItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 8,
  },
  exItemName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  exItemMeta: { color: colors.textDim, fontSize: 13, marginTop: 2 },
  iconBtn: { padding: 6, marginLeft: 2 },
  addBox: { marginTop: 8, padding: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
});
