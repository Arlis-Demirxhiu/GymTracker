import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExerciseInfo, howToByName } from './api';
import { BodyPartTag } from './components';
import { colors, radius } from './theme';
import { YouTubePlayer } from './YouTubePlayer';

/** YouTube form tutorials for any exercise, including ones typed in by hand. */
export const videoSearchUrl = (name: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} exercise proper form`)}`;

/**
 * Play button for rows that only know an exercise's name (agenda days).
 * Catalog exercises open the how-to sheet with the in-app video; anything
 * else — a typed-in exercise, or the server being unreachable — falls back to
 * a YouTube search.
 */
export function WatchButton({ name }: { name: string }) {
  const [info, setInfo] = useState<ExerciseInfo | null>(null);
  const [looking, setLooking] = useState(false);

  const open = async () => {
    setLooking(true);
    try {
      const match = (await howToByName()).get(name.trim().toLowerCase());
      if (match) return setInfo(match);
    } catch {
      // offline: the search link below still works once back online
    } finally {
      setLooking(false);
    }
    Linking.openURL(videoSearchUrl(name));
  };

  return (
    <>
      <Pressable
        onPress={open}
        disabled={looking}
        hitSlop={8}
        style={({ pressed }) => [styles.watchIcon, pressed && { opacity: 0.6 }]}
        accessibilityRole="button"
        accessibilityLabel={`How to do ${name}`}
      >
        {looking ? (
          <ActivityIndicator size="small" color={colors.accentText} />
        ) : (
          <Ionicons name="play" size={13} color={colors.accentText} />
        )}
      </Pressable>
      <ExerciseSheet exercise={info} onClose={() => setInfo(null)} />
    </>
  );
}

/** How to do one exercise: the video, equipment, muscles and form cues. */
export function ExerciseSheet({ exercise, onClose }: { exercise: ExerciseInfo | null; onClose: () => void }) {
  const howTo = exercise?.howTo;
  const video = howTo?.video;
  const prescription = exercise
    ? [exercise.sets && `${exercise.sets} sets`, exercise.reps && `${exercise.reps} reps`].filter(Boolean).join(' × ')
    : '';

  return (
    <Modal visible={!!exercise} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      {exercise && (
        <SafeAreaView style={styles.sheet} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{exercise.name}</Text>
              {(!!prescription || !!exercise.suggestedLoad) && (
                <Text style={styles.meta}>
                  {prescription}
                  {exercise.suggestedLoad ? `${prescription ? '  ·  ' : ''}${exercise.suggestedLoad.label}` : ''}
                </Text>
              )}
            </View>
            <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close">
              <Ionicons name="close-circle" size={30} color={colors.textFaint} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {video ? (
              <>
                <YouTubePlayer videoId={video.videoId} title={video.title} />
                <Text style={styles.credit} numberOfLines={2}>
                  {video.title} · {video.channel}
                </Text>
              </>
            ) : (
              <View style={styles.noVideo}>
                <Ionicons name="videocam-off-outline" size={22} color={colors.textFaint} />
                <Text style={styles.noVideoText}>No video picked for this one yet.</Text>
              </View>
            )}

            <Pressable
              onPress={() => Linking.openURL(howTo?.videoUrl ?? videoSearchUrl(exercise.name))}
              hitSlop={8}
              style={styles.moreVideos}
              accessibilityRole="link"
            >
              <Ionicons name="logo-youtube" size={16} color={colors.textDim} />
              <Text style={styles.moreVideosText}>More videos on YouTube</Text>
            </Pressable>

            {!!exercise.equipment && (
              <>
                <Text style={styles.label}>Equipment</Text>
                <View style={styles.equipmentRow}>
                  <Ionicons name="barbell-outline" size={18} color={colors.accent} />
                  <Text style={styles.equipment}>{exercise.equipment}</Text>
                </View>
              </>
            )}
            {!!howTo?.setup && <Text style={styles.setup}>{howTo.setup}</Text>}

            {!!exercise.bodyPart && (
              <>
                <Text style={styles.label}>Works</Text>
                <View style={styles.tags}>
                  {[exercise.bodyPart, ...(exercise.also ?? [])].map((p) => (
                    <BodyPartTag key={p} part={p} small />
                  ))}
                </View>
              </>
            )}

            {!!howTo?.steps.length && (
              <>
                <Text style={styles.label}>How to do it</Text>
                {howTo.steps.map((step, i) => (
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
  credit: { color: colors.textFaint, fontSize: 12, marginTop: 8 },
  noVideo: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 20,
    borderRadius: radius.md,
    backgroundColor: colors.card,
  },
  noVideoText: { color: colors.textFaint, fontSize: 13 },
  moreVideos: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 12 },
  moreVideosText: { color: colors.textDim, fontSize: 14, fontWeight: '600' },
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
