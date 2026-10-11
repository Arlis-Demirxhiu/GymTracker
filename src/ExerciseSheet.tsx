import { Ionicons } from '@expo/vector-icons';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Suggestion } from './api';
import { BodyPartTag, Button } from './components';
import { colors, radius } from './theme';

/** YouTube form tutorials for any exercise, including ones typed in by hand. */
export const videoSearchUrl = (name: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} exercise proper form`)}`;

/** Opens the videos in the YouTube app when installed, otherwise the browser. */
export const watchVideos = (name: string, url?: string) => Linking.openURL(url ?? videoSearchUrl(name));

/** Small "watch how" button for rows that only know an exercise's name. */
export function WatchButton({ name }: { name: string }) {
  return (
    <Pressable
      onPress={() => watchVideos(name)}
      hitSlop={8}
      style={({ pressed }) => [styles.watchIcon, pressed && { opacity: 0.6 }]}
      accessibilityRole="link"
      accessibilityLabel={`Watch how to do ${name}`}
    >
      <Ionicons name="play" size={13} color={colors.accentText} />
    </Pressable>
  );
}

/** How to do one suggested exercise: equipment, form cues, and videos. */
export function ExerciseSheet({ exercise, onClose }: { exercise: Suggestion | null; onClose: () => void }) {
  return (
    <Modal visible={!!exercise} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      {exercise && (
        <SafeAreaView style={styles.sheet} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{exercise.name}</Text>
              <Text style={styles.meta}>
                {[exercise.sets && `${exercise.sets} sets`, exercise.reps && `${exercise.reps} reps`]
                  .filter(Boolean)
                  .join(' × ')}
                {exercise.suggestedLoad ? `  ·  ${exercise.suggestedLoad.label}` : ''}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close">
              <Ionicons name="close-circle" size={30} color={colors.textFaint} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            <Button
              label="▶  Watch how to do it"
              onPress={() => watchVideos(exercise.name, exercise.howTo?.videoUrl)}
            />
            <Text style={styles.videoNote}>Opens form videos on YouTube.</Text>

            <Text style={styles.label}>Equipment</Text>
            <View style={styles.equipmentRow}>
              <Ionicons name="barbell-outline" size={18} color={colors.accent} />
              <Text style={styles.equipment}>{exercise.equipment}</Text>
            </View>
            {!!exercise.howTo?.setup && <Text style={styles.setup}>{exercise.howTo.setup}</Text>}

            <Text style={styles.label}>Works</Text>
            <View style={styles.tags}>
              {[exercise.bodyPart, ...exercise.also].map((p) => (
                <BodyPartTag key={p} part={p} small />
              ))}
            </View>

            {!!exercise.howTo?.steps.length && (
              <>
                <Text style={styles.label}>How to do it</Text>
                {exercise.howTo.steps.map((step, i) => (
                  <View key={i} style={styles.step}>
                    <Text style={styles.stepNumber}>{i + 1}</Text>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </>
            )}

            <Text style={styles.safety}>
              Start light and stop if anything hurts — get someone at the gym to check your form on the big lifts.
            </Text>
          </ScrollView>
        </SafeAreaView>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  meta: { color: colors.textDim, fontSize: 14, marginTop: 4 },
  body: { padding: 20, paddingBottom: 40 },
  videoNote: { color: colors.textFaint, fontSize: 12, textAlign: 'center', marginTop: 6 },
  label: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 10,
  },
  equipmentRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  equipment: { color: colors.text, fontSize: 16, fontWeight: '700' },
  setup: { color: colors.textDim, fontSize: 15, lineHeight: 21, marginTop: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap' },
  step: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  stepNumber: {
    color: colors.accentText,
    backgroundColor: colors.accent,
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 13,
    fontWeight: '800',
    overflow: 'hidden',
  },
  stepText: { color: colors.text, fontSize: 15, lineHeight: 22, flex: 1 },
  safety: { color: colors.textFaint, fontSize: 12, lineHeight: 17, marginTop: 16 },
  watchIcon: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
});
