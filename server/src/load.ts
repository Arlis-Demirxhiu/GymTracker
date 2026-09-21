import type { CatalogExercise, LoadSpec } from './catalog.ts';

export const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type Level = (typeof LEVELS)[number];

/** Roughly how much more a lifter handles once past the first months. */
const LEVEL_FACTOR: Record<Level, number> = { beginner: 1, intermediate: 1.35, advanced: 1.7 };

/** Plate maths: barbells and stacks move in 2.5 kg steps, dumbbells in 2 kg. */
const STEP = { barbell: 2.5, machine: 2.5, dumbbell: 2 };
/** An empty bar, the lightest plate on a stack, the smallest dumbbell. */
const FLOOR = { barbell: 20, machine: 5, dumbbell: 2 };

export const MIN_BODYWEIGHT = 30;
export const MAX_BODYWEIGHT = 300;

export type SuggestedLoad = {
  /** Working weight in kg, per hand for dumbbells. Null when there is nothing to load. */
  kg: number | null;
  perHand: boolean;
  /** Ready-made text, e.g. "45 kg", "2 × 14 kg", "Bodyweight". */
  label: string;
};

const round = (value: number, step: number) => Math.round(value / step) * step;

/** Trims float noise like 42.50000000000001 without forcing decimals on whole numbers. */
const tidy = (value: number) => Number(value.toFixed(2));

/**
 * Estimates a working weight from bodyweight and experience.
 *
 * This is a starting point for the first set, not a prescription: real loads
 * depend on technique, leverages, sleep and the day. Callers should tell the
 * lifter to warm up and adjust.
 */
export function suggestLoad(load: LoadSpec, bodyweightKg: number, level: Level): SuggestedLoad {
  if (load.kind === 'bodyweight') return { kg: null, perHand: false, label: 'Bodyweight' };
  if (load.kind === 'none') return { kg: null, perHand: false, label: 'No weight' };

  const raw = bodyweightKg * load.factor * LEVEL_FACTOR[level];
  const floor = load.min ?? FLOOR[load.kind];
  const kg = tidy(Math.max(round(raw, STEP[load.kind]), floor));
  const perHand = load.kind === 'dumbbell';

  return { kg, perHand, label: perHand ? `2 × ${kg} kg` : `${kg} kg` };
}

export type ExerciseWithLoad = CatalogExercise & { suggestedLoad: SuggestedLoad };

export const withLoads = (
  exercises: CatalogExercise[],
  bodyweightKg: number,
  level: Level,
): ExerciseWithLoad[] =>
  exercises.map((exercise) => ({ ...exercise, suggestedLoad: suggestLoad(exercise.load, bodyweightKg, level) }));

export const isLevel = (v: string): v is Level => (LEVELS as readonly string[]).includes(v);
