/** Curated exercise catalog. Compound lifts are listed first per body part. */

export const BODY_PARTS = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'cardio',
] as const;

export type BodyPart = (typeof BODY_PARTS)[number];

export type Equipment = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'none';

/**
 * How to put load on a lift.
 *
 * `factor` is the share of bodyweight a beginner can expect to work with for
 * the listed reps — bench at 0.55 means a 80 kg lifter starts around 44 kg.
 * Dumbbell factors are per hand. `min` is the lightest sensible load, e.g. an
 * empty 20 kg barbell.
 */
export type LoadSpec =
  | { kind: 'barbell'; factor: number; min?: number }
  | { kind: 'dumbbell'; factor: number; min?: number }
  | { kind: 'machine'; factor: number; min?: number }
  | { kind: 'bodyweight' }
  | { kind: 'none' };

export type CatalogExercise = {
  id: string;
  name: string;
  bodyPart: BodyPart;
  /** Muscles worked meaningfully besides the primary one. */
  also: BodyPart[];
  equipment: Equipment;
  /** Multi-joint lifts are suggested before isolation work. */
  compound: boolean;
  sets: string;
  reps: string;
  load: LoadSpec;
};

const BW: LoadSpec = { kind: 'bodyweight' };
const NONE: LoadSpec = { kind: 'none' };
const bar = (factor: number, min?: number): LoadSpec => ({ kind: 'barbell', factor, min });
const db = (factor: number, min?: number): LoadSpec => ({ kind: 'dumbbell', factor, min });
const mach = (factor: number, min?: number): LoadSpec => ({ kind: 'machine', factor, min });

const e = (
  id: string,
  name: string,
  bodyPart: BodyPart,
  equipment: Equipment,
  compound: boolean,
  sets: string,
  reps: string,
  load: LoadSpec,
  also: BodyPart[] = [],
): CatalogExercise => ({ id, name, bodyPart, also, equipment, compound, sets, reps, load });

export const CATALOG: CatalogExercise[] = [
  // chest
  e('bench-press', 'Barbell Bench Press', 'chest', 'barbell', true, '4', '6-8', bar(0.55), ['triceps', 'shoulders']),
  e('incline-db-press', 'Incline Dumbbell Press', 'chest', 'dumbbell', true, '3', '8-10', db(0.2), ['shoulders', 'triceps']),
  e('dips', 'Chest Dips', 'chest', 'bodyweight', true, '3', '8-12', BW, ['triceps']),
  e('push-up', 'Push-up', 'chest', 'bodyweight', true, '3', '12-20', BW, ['triceps', 'abs']),
  e('cable-fly', 'Cable Fly', 'chest', 'cable', false, '3', '12-15', mach(0.12)),
  e('pec-deck', 'Pec Deck', 'chest', 'machine', false, '3', '12-15', mach(0.25)),

  // back
  e('pull-up', 'Pull-up', 'back', 'bodyweight', true, '4', '6-10', BW, ['biceps', 'forearms']),
  e('barbell-row', 'Barbell Row', 'back', 'barbell', true, '4', '8-10', bar(0.5), ['biceps', 'forearms']),
  e('lat-pulldown', 'Lat Pulldown', 'back', 'machine', true, '3', '10-12', mach(0.55), ['biceps']),
  e('seated-row', 'Seated Cable Row', 'back', 'cable', true, '3', '10-12', mach(0.5), ['biceps']),
  e('deadlift', 'Deadlift', 'back', 'barbell', true, '3', '5', bar(0.9), ['hamstrings', 'glutes', 'forearms']),
  e('face-pull', 'Face Pull', 'back', 'cable', false, '3', '15', mach(0.15), ['shoulders']),

  // shoulders
  e('overhead-press', 'Overhead Press', 'shoulders', 'barbell', true, '4', '6-8', bar(0.35), ['triceps']),
  e('db-shoulder-press', 'Dumbbell Shoulder Press', 'shoulders', 'dumbbell', true, '3', '8-10', db(0.15), ['triceps']),
  e('arnold-press', 'Arnold Press', 'shoulders', 'dumbbell', true, '3', '10', db(0.12)),
  e('lateral-raise', 'Lateral Raise', 'shoulders', 'dumbbell', false, '4', '12-15', db(0.06)),
  e('rear-delt-fly', 'Rear Delt Fly', 'shoulders', 'dumbbell', false, '3', '15', db(0.06), ['back']),
  e('upright-row', 'Upright Row', 'shoulders', 'cable', false, '3', '12', mach(0.25), ['forearms']),

  // biceps
  e('barbell-curl', 'Barbell Curl', 'biceps', 'barbell', false, '4', '8-10', bar(0.25, 10), ['forearms']),
  e('hammer-curl', 'Hammer Curl', 'biceps', 'dumbbell', false, '3', '10-12', db(0.12), ['forearms']),
  e('incline-db-curl', 'Incline Dumbbell Curl', 'biceps', 'dumbbell', false, '3', '10-12', db(0.09)),
  e('preacher-curl', 'Preacher Curl', 'biceps', 'machine', false, '3', '10-12', mach(0.2)),
  e('cable-curl', 'Cable Curl', 'biceps', 'cable', false, '3', '12-15', mach(0.2)),
  e('chin-up', 'Chin-up', 'biceps', 'bodyweight', true, '3', '6-10', BW, ['back']),

  // triceps
  e('close-grip-bench', 'Close-grip Bench Press', 'triceps', 'barbell', true, '4', '8', bar(0.45), ['chest']),
  e('dip-triceps', 'Parallel Bar Dip', 'triceps', 'bodyweight', true, '3', '8-12', BW, ['chest']),
  e('skullcrusher', 'Skullcrusher', 'triceps', 'barbell', false, '3', '10-12', bar(0.25, 10)),
  e('pushdown', 'Tricep Pushdown', 'triceps', 'cable', false, '3', '12-15', mach(0.25)),
  e('overhead-ext', 'Overhead Tricep Extension', 'triceps', 'dumbbell', false, '3', '12', db(0.12)),
  e('kickback', 'Tricep Kickback', 'triceps', 'dumbbell', false, '3', '15', db(0.06)),

  // forearms
  e('farmers-walk', "Farmer's Walk", 'forearms', 'dumbbell', true, '3', '40m', db(0.35), ['abs']),
  e('wrist-curl', 'Wrist Curl', 'forearms', 'barbell', false, '3', '15-20', bar(0.15, 10)),
  e('reverse-curl', 'Reverse Curl', 'forearms', 'barbell', false, '3', '12', bar(0.15, 10), ['biceps']),
  e('dead-hang', 'Dead Hang', 'forearms', 'bodyweight', false, '3', '30-60s', BW),
  e('plate-pinch', 'Plate Pinch Hold', 'forearms', 'none', false, '3', '30s', db(0.12, 5)),
  e('wrist-roller', 'Wrist Roller', 'forearms', 'machine', false, '2', '3 rolls', mach(0.05, 2.5)),

  // abs
  e('hanging-leg-raise', 'Hanging Leg Raise', 'abs', 'bodyweight', true, '3', '10-15', BW, ['forearms']),
  e('cable-crunch', 'Cable Crunch', 'abs', 'cable', false, '3', '12-15', mach(0.3)),
  e('plank', 'Plank', 'abs', 'bodyweight', false, '3', '45-60s', BW),
  e('ab-wheel', 'Ab Wheel Rollout', 'abs', 'none', true, '3', '8-12', BW),
  e('russian-twist', 'Russian Twist', 'abs', 'none', false, '3', '20', mach(0.08, 2.5)),
  e('dead-bug', 'Dead Bug', 'abs', 'bodyweight', false, '3', '12 each', BW),

  // quads
  e('back-squat', 'Back Squat', 'quads', 'barbell', true, '4', '5-8', bar(0.7), ['glutes', 'hamstrings']),
  e('front-squat', 'Front Squat', 'quads', 'barbell', true, '3', '6-8', bar(0.55), ['abs', 'glutes']),
  e('leg-press', 'Leg Press', 'quads', 'machine', true, '4', '10-12', mach(1.2), ['glutes']),
  e('walking-lunge', 'Walking Lunge', 'quads', 'dumbbell', true, '3', '10 each', db(0.2), ['glutes']),
  e('bulgarian-split', 'Bulgarian Split Squat', 'quads', 'dumbbell', true, '3', '8-10', db(0.15), ['glutes']),
  e('leg-extension', 'Leg Extension', 'quads', 'machine', false, '3', '12-15', mach(0.4)),

  // hamstrings
  e('romanian-deadlift', 'Romanian Deadlift', 'hamstrings', 'barbell', true, '4', '8-10', bar(0.6), ['glutes', 'back']),
  e('good-morning', 'Good Morning', 'hamstrings', 'barbell', true, '3', '10', bar(0.35), ['glutes']),
  e('nordic-curl', 'Nordic Hamstring Curl', 'hamstrings', 'bodyweight', false, '3', '6-8', BW),
  e('lying-leg-curl', 'Lying Leg Curl', 'hamstrings', 'machine', false, '3', '12-15', mach(0.3)),
  e('seated-leg-curl', 'Seated Leg Curl', 'hamstrings', 'machine', false, '3', '12-15', mach(0.35)),
  e('kettlebell-swing', 'Kettlebell Swing', 'hamstrings', 'none', true, '4', '15', mach(0.2, 8), ['glutes', 'cardio']),

  // glutes
  e('hip-thrust', 'Hip Thrust', 'glutes', 'barbell', true, '4', '8-10', bar(0.75), ['hamstrings']),
  e('sumo-deadlift', 'Sumo Deadlift', 'glutes', 'barbell', true, '3', '5-6', bar(0.9), ['hamstrings', 'back']),
  e('step-up', 'Step-up', 'glutes', 'dumbbell', true, '3', '10 each', db(0.15), ['quads']),
  e('cable-kickback', 'Cable Glute Kickback', 'glutes', 'cable', false, '3', '12-15', mach(0.1)),
  e('glute-bridge', 'Glute Bridge', 'glutes', 'bodyweight', false, '3', '15', BW),
  e('abduction', 'Hip Abduction', 'glutes', 'machine', false, '3', '15-20', mach(0.35)),

  // calves
  e('standing-calf-raise', 'Standing Calf Raise', 'calves', 'machine', false, '4', '12-15', mach(0.7)),
  e('seated-calf-raise', 'Seated Calf Raise', 'calves', 'machine', false, '4', '15-20', mach(0.45)),
  e('db-calf-raise', 'Dumbbell Calf Raise', 'calves', 'dumbbell', false, '3', '15-20', db(0.25)),
  e('donkey-calf-raise', 'Donkey Calf Raise', 'calves', 'machine', false, '3', '12-15', mach(0.6)),
  e('jump-rope-calves', 'Jump Rope', 'calves', 'none', false, '3', '60s', NONE, ['cardio']),
  e('tibialis-raise', 'Tibialis Raise', 'calves', 'bodyweight', false, '3', '15', BW),

  // cardio
  e('intervals', 'Bike Intervals', 'cardio', 'machine', false, '8', '30s on / 90s off', NONE),
  e('incline-walk', 'Incline Treadmill Walk', 'cardio', 'machine', false, '1', '20-30 min', NONE),
  e('row-erg', 'Rowing Machine', 'cardio', 'machine', false, '1', '2000m', NONE, ['back']),
  e('stair-master', 'Stair Climber', 'cardio', 'machine', false, '1', '15 min', NONE, ['glutes']),
  e('jump-rope', 'Jump Rope', 'cardio', 'none', false, '5', '2 min', NONE, ['calves']),
  e('sled-push', 'Sled Push', 'cardio', 'none', true, '6', '20m', mach(0.4, 10), ['quads', 'glutes']),
];

export const isBodyPart = (v: string): v is BodyPart => (BODY_PARTS as readonly string[]).includes(v);
