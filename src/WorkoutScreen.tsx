import { Ionicons } from '@expo/vector-icons';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Suggestion } from './api';
import { Button } from './components';
import { ExerciseSheet } from './ExerciseSheet';
import { WorkoutProgress } from './store';
import { colors, radius } from './theme';

/**
 * A workout in progress: drag the handle to reorder, swipe a row right to
 * mark it done (swipe again to undo), tap it for the video and form cues.
 *
 * Built on PanResponder and Animated from React Native itself, so it needs no
 * extra native modules. Rows have a fixed height so a drag distance maps
 * straight onto a slot.
 */

const ROW_HEIGHT = 74;
const GAP = 10;
const SLOT = ROW_HEIGHT + GAP;
/** How far right a row must travel before letting go marks it done. */
const SWIPE_THRESHOLD = 110;

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

/** The saved order, minus exercises that are gone, plus new ones at the end. */
const reconcile = (exercises: Suggestion[], progress?: WorkoutProgress) => {
  const ids = exercises.map((e) => e.id);
  const kept = (progress?.order ?? []).filter((id) => ids.includes(id));
  return [...kept, ...ids.filter((id) => !kept.includes(id))];
};

export function WorkoutScreen({
  visible,
  exercises,
  progress,
  onChange,
  onClose,
}: {
  visible: boolean;
  exercises: Suggestion[];
  progress?: WorkoutProgress;
  onChange: (progress: WorkoutProgress) => void;
  onClose: () => void;
}) {
  const byId = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);
  const order = reconcile(exercises, progress);
  const done = (progress?.done ?? []).filter((id) => byId.has(id));
  const [howTo, setHowTo] = useState<Suggestion | null>(null);

  // ---- dragging ----
  // The picked-up row floats above the others, which stay put until it's
  // dropped; then the rows it passed slide over to make room.
  const [drag, setDrag] = useState<{ from: number; to: number } | null>(null);
  const dragRef = useRef(drag);
  dragRef.current = drag;
  const lastDy = useRef(0);
  const shifts = useRef(new Map<string, Animated.Value>()).current;
  const shiftFor = (id: string) => {
    if (!shifts.has(id)) shifts.set(id, new Animated.Value(0));
    return shifts.get(id)!;
  };
  /** A drop waiting for the new order to render before its rows settle. */
  const pendingDrop = useRef<{ from: number; to: number; dy: number; id: string } | null>(null);

  // After a drop renders, start each moved row where it was on screen and
  // slide it into its new slot, so nothing jumps.
  useLayoutEffect(() => {
    const p = pendingDrop.current;
    if (!p || drag || order[p.to] !== p.id) return; // new order not rendered yet
    pendingDrop.current = null;
    const settle = (id: string, from: number) => {
      const v = shiftFor(id);
      v.setValue(from);
      Animated.spring(v, { toValue: 0, useNativeDriver: true, speed: 24, bounciness: 4 }).start();
    };
    settle(p.id, p.dy - (p.to - p.from) * SLOT);
    if (p.from < p.to) for (let i = p.from; i < p.to; i++) settle(order[i], SLOT);
    if (p.from > p.to) for (let i = p.to + 1; i <= p.from; i++) settle(order[i], -SLOT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.join(), drag]);

  const save = (next: Partial<WorkoutProgress>) => onChange({ order, done, ...next });

  const move = (from: number, to: number) => {
    if (from === to) return;
    const next = [...order];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    save({ order: next });
  };

  const dragHandlers = {
    start: (index: number) => {
      // The dragged row rides on its own shift value — the same one it settles
      // with after the drop — so it never swaps values mid-gesture and flickers.
      shiftFor(order[index]).setValue(0);
      lastDy.current = 0;
      setDrag({ from: index, to: index });
    },
    move: (dy: number) => {
      const current = dragRef.current;
      if (!current) return;
      shiftFor(order[current.from]).setValue(dy);
      lastDy.current = dy;
      const to = clamp(current.from + Math.round(dy / SLOT), 0, order.length - 1);
      if (to !== current.to) setDrag({ from: current.from, to });
    },
    end: () => {
      const current = dragRef.current;
      if (!current) return;
      pendingDrop.current = { ...current, dy: lastDy.current, id: order[current.from] };
      setDrag(null);
      move(current.from, current.to);
    },
  };

  const toggleDone = (id: string) =>
    save({
      done: done.includes(id) ? done.filter((d) => d !== id) : [...done, id],
    });

  const total = order.length;
  const finished = done.length;
  const complete = total > 0 && finished === total;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      {/* A modal is its own root view, so it needs its own safe-area measurements. */}
      <SafeAreaProvider>
        <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Your exercises</Text>
              <Text style={styles.count}>
                {finished} of {total} done
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close workout">
              <Ionicons name="close-circle" size={32} color={colors.textFaint} />
            </Pressable>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${total ? (finished / total) * 100 : 0}%` }]} />
          </View>

          <ScrollView contentContainerStyle={styles.list} scrollEnabled={!drag}>
            <Text style={styles.hint}>Hold ≡ and drag to reorder · swipe right when a set is finished</Text>

            {order.map((id, index) => {
              const exercise = byId.get(id);
              if (!exercise) return null;
              const isDragged = drag?.from === index;
              return (
                <Animated.View
                  key={id}
                  style={[
                    styles.slot,
                    {
                      zIndex: isDragged ? 10 : 0,
                      transform: [{ translateY: shiftFor(id) }, { scale: isDragged ? 1.03 : 1 }],
                    },
                    isDragged && styles.lifted,
                  ]}
                >
                  {drag && drag.to === index && drag.to !== drag.from && (
                    <View
                      pointerEvents="none"
                      style={[
                        styles.dropLine,
                        drag.to < drag.from ? { top: -GAP / 2 - 1.5 } : { bottom: -GAP / 2 - 1.5 },
                      ]}
                    />
                  )}
                  <WorkoutRow
                    exercise={exercise}
                    index={index}
                    count={total}
                    done={done.includes(id)}
                    onToggle={() => toggleDone(id)}
                    onOpen={() => setHowTo(exercise)}
                    onMove={(to) => move(index, to)}
                    drag={dragHandlers}
                  />
                </Animated.View>
              );
            })}

            {complete ? (
              <View style={styles.complete}>
                <Text style={styles.completeEmoji}>🎉</Text>
                <Text style={styles.completeTitle}>Workout complete</Text>
                <Text style={styles.completeText}>Nice work. Stretch, drink some water, and log how it felt.</Text>
                <Button label="Finish" onPress={onClose} style={{ marginTop: 14, alignSelf: 'stretch' }} />
              </View>
            ) : (
              <Button label="Finish for now" variant="ghost" onPress={onClose} style={{ marginTop: 8 }} />
            )}
          </ScrollView>
        </SafeAreaView>

        <ExerciseSheet exercise={howTo} onClose={() => setHowTo(null)} />
      </SafeAreaProvider>
    </Modal>
  );
}

function WorkoutRow({
  exercise,
  index,
  count,
  done,
  onToggle,
  onOpen,
  onMove,
  drag,
}: {
  exercise: Suggestion;
  index: number;
  count: number;
  done: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onMove: (to: number) => void;
  drag: {
    start: (index: number) => void;
    move: (dy: number) => void;
    end: () => void;
  };
}) {
  // Handlers read the latest props through refs: PanResponders are created once.
  const latest = useRef({ index, done, onToggle, drag });
  latest.current = { index, done, onToggle, drag };

  // ---- swipe right to mark done ----
  const swipeX = useRef(new Animated.Value(0)).current;
  const swipe = useRef(
    PanResponder.create({
      // Only claim clearly horizontal, rightward moves, so scrolling still works.
      onMoveShouldSetPanResponder: (_, g) => g.dx > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, g) => swipeX.setValue(Math.max(0, g.dx)),
      onPanResponderRelease: (_, g) => {
        if (g.dx > SWIPE_THRESHOLD) {
          Animated.timing(swipeX, {
            toValue: 400,
            duration: 160,
            useNativeDriver: true,
          }).start(() => {
            latest.current.onToggle();
            swipeX.setValue(0);
          });
        } else {
          Animated.spring(swipeX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => Animated.spring(swipeX, { toValue: 0, useNativeDriver: true }).start(),
    }),
  ).current;

  // ---- drag handle ----
  const handle = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => latest.current.drag.start(latest.current.index),
      onPanResponderMove: (_, g) => latest.current.drag.move(g.dy),
      onPanResponderRelease: () => latest.current.drag.end(),
      onPanResponderTerminate: () => latest.current.drag.end(),
    }),
  ).current;

  const revealed = swipeX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const prescription = [exercise.sets && `${exercise.sets} × ${exercise.reps}`, exercise.suggestedLoad?.label]
    .filter(Boolean)
    .join('  ·  ');

  return (
    <View style={styles.rowWrap}>
      <Animated.View style={[styles.swipeBack, { opacity: revealed }]}>
        <Ionicons name={done ? 'arrow-undo' : 'checkmark-circle'} size={24} color={colors.accentText} />
        <Text style={styles.swipeText}>{done ? 'Undo' : 'Done'}</Text>
      </Animated.View>

      <Animated.View
        style={[styles.row, done && styles.rowDone, { transform: [{ translateX: swipeX }] }]}
        {...swipe.panHandlers}
      >
        <Pressable
          onPress={onToggle}
          hitSlop={8}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: done }}
          accessibilityLabel={`${exercise.name} done`}
        >
          <Ionicons
            name={done ? 'checkmark-circle' : 'ellipse-outline'}
            size={28}
            color={done ? colors.accent : colors.textFaint}
          />
        </Pressable>

        <Pressable onPress={onOpen} style={styles.rowBody} accessibilityHint="Shows the video and how to do it">
          <Text style={[styles.name, done && styles.nameDone]} numberOfLines={1}>
            {exercise.name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {prescription}
          </Text>
        </Pressable>

        <View
          {...handle.panHandlers}
          style={styles.handle}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`Move ${exercise.name}, position ${index + 1} of ${count}`}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => {
            if (e.nativeEvent.actionName === 'decrement' && index < count - 1) onMove(index + 1);
            if (e.nativeEvent.actionName === 'increment' && index > 0) onMove(index - 1);
          }}
        >
          <Ionicons name="reorder-three" size={26} color={colors.textDim} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  count: { color: colors.textDim, fontSize: 14, marginTop: 2 },
  progressTrack: {
    height: 6,
    marginHorizontal: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.cardAlt,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
  },
  list: { padding: 20, paddingBottom: 40 },
  hint: {
    color: colors.textFaint,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 14,
  },
  slot: { height: ROW_HEIGHT, marginBottom: GAP },
  dropLine: {
    position: 'absolute',
    left: 6,
    right: 6,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  lifted: {
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  rowWrap: { flex: 1, borderRadius: radius.md, overflow: 'hidden' },
  swipeBack: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 20,
  },
  swipeText: { color: colors.accentText, fontSize: 16, fontWeight: '800' },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  rowDone: {
    backgroundColor: colors.cardAlt,
    borderColor: colors.accent + '55',
  },
  rowBody: { flex: 1, justifyContent: 'center', height: '100%' },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  nameDone: { color: colors.textDim, textDecorationLine: 'line-through' },
  meta: { color: colors.textDim, fontSize: 13, marginTop: 3 },
  handle: {
    width: 52,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  complete: {
    alignItems: 'center',
    padding: 20,
    marginTop: 8,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.accent + '55',
  },
  completeEmoji: { fontSize: 36 },
  completeTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 6,
  },
  completeText: {
    color: colors.textDim,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
  },
});
