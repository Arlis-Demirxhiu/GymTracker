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

/**
 * Kit someone may or may not have. An exercise lists everything it needs;
 * an empty list means it can be done anywhere with just your body (a chair
 * or a wall counts as "anywhere").
 */
export const GEAR = [
  'barbell',
  'dumbbell',
  'kettlebell',
  'bench',
  'machine',
  'cable',
  'pullup-bar',
  'dip-bars',
  'cardio-machine',
  'jump-rope',
  'ab-wheel',
] as const;

export type Gear = (typeof GEAR)[number];

const GEAR_LABEL: Record<Gear, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbells',
  kettlebell: 'Kettlebell',
  bench: 'Bench',
  machine: 'Machine',
  cable: 'Cable',
  'pullup-bar': 'Pull-up bar',
  'dip-bars': 'Dip bars',
  'cardio-machine': 'Cardio machine',
  'jump-rope': 'Jump rope',
  'ab-wheel': 'Ab wheel',
};

/** "Barbell + Bench", or "Bodyweight" when nothing is needed. */
export const equipmentLabel = (requires: readonly Gear[]) =>
  requires.length === 0 ? 'Bodyweight' : requires.map((g) => GEAR_LABEL[g]).join(' + ');

/**
 * How to put load on a lift.
 *
 * `factor` is the share of bodyweight a beginner can expect to work with for
 * the listed reps — bench at 0.55 means a 80 kg lifter starts around 44 kg.
 * Dumbbell factors are per hand; `machine` also covers a single weight held
 * in both hands (goblet squat, kettlebell). `min` is the lightest sensible
 * load, e.g. an empty 20 kg barbell.
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
  /** Every piece of kit the exercise needs. */
  requires: Gear[];
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
  requires: Gear[],
  compound: boolean,
  sets: string,
  reps: string,
  load: LoadSpec,
  also: BodyPart[] = [],
): CatalogExercise => ({ id, name, bodyPart, also, requires, compound, sets, reps, load });

// Within a body part, gym staples come before the home alternatives, so a
// fully equipped gym still gets the classic lifts first.
export const CATALOG: CatalogExercise[] = [
  // chest
  e('bench-press', 'Barbell Bench Press', 'chest', ['barbell', 'bench'], true, '4', '6-8', bar(0.55), ['triceps', 'shoulders']),
  e('incline-db-press', 'Incline Dumbbell Press', 'chest', ['dumbbell', 'bench'], true, '3', '8-10', db(0.2), ['shoulders', 'triceps']),
  e('dips', 'Chest Dips', 'chest', ['dip-bars'], true, '3', '8-12', BW, ['triceps']),
  e('db-floor-press', 'Dumbbell Floor Press', 'chest', ['dumbbell'], true, '3', '8-12', db(0.2), ['triceps']),
  e('push-up', 'Push-up', 'chest', [], true, '3', '12-20', BW, ['triceps', 'abs']),
  e('decline-push-up', 'Decline Push-up', 'chest', [], true, '3', '8-15', BW, ['shoulders', 'triceps']),
  e('cable-fly', 'Cable Fly', 'chest', ['cable'], false, '3', '12-15', mach(0.12)),
  e('pec-deck', 'Pec Deck', 'chest', ['machine'], false, '3', '12-15', mach(0.25)),
  e('db-fly', 'Dumbbell Fly', 'chest', ['dumbbell', 'bench'], false, '3', '12-15', db(0.08)),

  // back
  e('pull-up', 'Pull-up', 'back', ['pullup-bar'], true, '4', '6-10', BW, ['biceps', 'forearms']),
  e('barbell-row', 'Barbell Row', 'back', ['barbell'], true, '4', '8-10', bar(0.5), ['biceps', 'forearms']),
  e('lat-pulldown', 'Lat Pulldown', 'back', ['machine'], true, '3', '10-12', mach(0.55), ['biceps']),
  e('seated-row', 'Seated Cable Row', 'back', ['cable'], true, '3', '10-12', mach(0.5), ['biceps']),
  e('deadlift', 'Deadlift', 'back', ['barbell'], true, '3', '5', bar(0.9), ['hamstrings', 'glutes', 'forearms']),
  e('db-row', 'One-arm Dumbbell Row', 'back', ['dumbbell'], true, '3', '8-12', db(0.25), ['biceps']),
  e('face-pull', 'Face Pull', 'back', ['cable'], false, '3', '15', mach(0.15), ['shoulders']),
  e('superman', 'Superman Hold', 'back', [], false, '3', '30s', BW, ['glutes']),

  // shoulders
  e('overhead-press', 'Overhead Press', 'shoulders', ['barbell'], true, '4', '6-8', bar(0.35), ['triceps']),
  e('db-shoulder-press', 'Dumbbell Shoulder Press', 'shoulders', ['dumbbell'], true, '3', '8-10', db(0.15), ['triceps']),
  e('arnold-press', 'Arnold Press', 'shoulders', ['dumbbell'], true, '3', '10', db(0.12)),
  e('pike-push-up', 'Pike Push-up', 'shoulders', [], true, '3', '8-12', BW, ['triceps']),
  e('lateral-raise', 'Lateral Raise', 'shoulders', ['dumbbell'], false, '4', '12-15', db(0.06)),
  e('rear-delt-fly', 'Rear Delt Fly', 'shoulders', ['dumbbell'], false, '3', '15', db(0.06), ['back']),
  e('upright-row', 'Upright Row', 'shoulders', ['cable'], false, '3', '12', mach(0.25), ['forearms']),

  // biceps
  e('chin-up', 'Chin-up', 'biceps', ['pullup-bar'], true, '3', '6-10', BW, ['back']),
  e('barbell-curl', 'Barbell Curl', 'biceps', ['barbell'], false, '4', '8-10', bar(0.25, 10), ['forearms']),
  e('db-curl', 'Dumbbell Curl', 'biceps', ['dumbbell'], false, '3', '10-12', db(0.1)),
  e('hammer-curl', 'Hammer Curl', 'biceps', ['dumbbell'], false, '3', '10-12', db(0.12), ['forearms']),
  e('incline-db-curl', 'Incline Dumbbell Curl', 'biceps', ['dumbbell', 'bench'], false, '3', '10-12', db(0.09)),
  e('preacher-curl', 'Preacher Curl', 'biceps', ['machine'], false, '3', '10-12', mach(0.2)),
  e('cable-curl', 'Cable Curl', 'biceps', ['cable'], false, '3', '12-15', mach(0.2)),
  e('concentration-curl', 'Concentration Curl', 'biceps', ['dumbbell'], false, '3', '12', db(0.08)),

  // triceps
  e('close-grip-bench', 'Close-grip Bench Press', 'triceps', ['barbell', 'bench'], true, '4', '8', bar(0.45), ['chest']),
  e('dip-triceps', 'Parallel Bar Dip', 'triceps', ['dip-bars'], true, '3', '8-12', BW, ['chest']),
  e('diamond-push-up', 'Diamond Push-up', 'triceps', [], true, '3', '8-15', BW, ['chest']),
  e('skullcrusher', 'Skullcrusher', 'triceps', ['barbell', 'bench'], false, '3', '10-12', bar(0.25, 10)),
  e('pushdown', 'Tricep Pushdown', 'triceps', ['cable'], false, '3', '12-15', mach(0.25)),
  e('overhead-ext', 'Overhead Tricep Extension', 'triceps', ['dumbbell'], false, '3', '12', db(0.12)),
  e('kickback', 'Tricep Kickback', 'triceps', ['dumbbell'], false, '3', '15', db(0.06)),
  e('chair-dip', 'Chair Dip', 'triceps', [], false, '3', '10-15', BW),

  // forearms
  e('farmers-walk', "Farmer's Walk", 'forearms', ['dumbbell'], true, '3', '40m', db(0.35), ['abs']),
  e('reverse-curl', 'Reverse Curl', 'forearms', ['barbell'], false, '3', '12', bar(0.15, 10), ['biceps']),
  e('wrist-curl', 'Wrist Curl', 'forearms', ['dumbbell'], false, '3', '15-20', db(0.08)),
  e('dead-hang', 'Dead Hang', 'forearms', ['pullup-bar'], false, '3', '30-60s', BW),
  e('plate-pinch', 'Plate Pinch Hold', 'forearms', ['barbell'], false, '3', '30s', db(0.12, 5)),
  e('wrist-roller', 'Wrist Roller', 'forearms', ['machine'], false, '2', '3 rolls', mach(0.05, 2.5)),

  // abs
  e('hanging-leg-raise', 'Hanging Leg Raise', 'abs', ['pullup-bar'], true, '3', '10-15', BW, ['forearms']),
  e('ab-wheel', 'Ab Wheel Rollout', 'abs', ['ab-wheel'], true, '3', '8-12', BW),
  e('cable-crunch', 'Cable Crunch', 'abs', ['cable'], false, '3', '12-15', mach(0.3)),
  e('plank', 'Plank', 'abs', [], false, '3', '45-60s', BW),
  e('lying-leg-raise', 'Lying Leg Raise', 'abs', [], false, '3', '12-15', BW),
  e('russian-twist', 'Russian Twist', 'abs', [], false, '3', '20', BW),
  e('dead-bug', 'Dead Bug', 'abs', [], false, '3', '12 each', BW),

  // quads
  e('back-squat', 'Back Squat', 'quads', ['barbell'], true, '4', '5-8', bar(0.7), ['glutes', 'hamstrings']),
  e('front-squat', 'Front Squat', 'quads', ['barbell'], true, '3', '6-8', bar(0.55), ['abs', 'glutes']),
  e('leg-press', 'Leg Press', 'quads', ['machine'], true, '4', '10-12', mach(1.2), ['glutes']),
  e('goblet-squat', 'Goblet Squat', 'quads', ['dumbbell'], true, '3', '10-12', mach(0.25), ['glutes']),
  e('walking-lunge', 'Walking Lunge', 'quads', ['dumbbell'], true, '3', '10 each', db(0.2), ['glutes']),
  e('bulgarian-split', 'Bulgarian Split Squat', 'quads', ['dumbbell', 'bench'], true, '3', '8-10', db(0.15), ['glutes']),
  e('bodyweight-squat', 'Bodyweight Squat', 'quads', [], true, '3', '15-20', BW, ['glutes']),
  e('split-squat', 'Split Squat', 'quads', [], true, '3', '10 each', BW, ['glutes']),
  e('leg-extension', 'Leg Extension', 'quads', ['machine'], false, '3', '12-15', mach(0.4)),

  // hamstrings
  e('romanian-deadlift', 'Romanian Deadlift', 'hamstrings', ['barbell'], true, '4', '8-10', bar(0.6), ['glutes', 'back']),
  e('good-morning', 'Good Morning', 'hamstrings', ['barbell'], true, '3', '10', bar(0.35), ['glutes']),
  e('db-rdl', 'Dumbbell Romanian Deadlift', 'hamstrings', ['dumbbell'], true, '3', '10-12', db(0.25), ['glutes']),
  e('kettlebell-swing', 'Kettlebell Swing', 'hamstrings', ['kettlebell'], true, '4', '15', mach(0.2, 8), ['glutes', 'cardio']),
  e('single-leg-rdl', 'Single-leg Romanian Deadlift', 'hamstrings', [], true, '3', '10 each', BW, ['glutes']),
  e('nordic-curl', 'Nordic Hamstring Curl', 'hamstrings', [], false, '3', '6-8', BW),
  e('lying-leg-curl', 'Lying Leg Curl', 'hamstrings', ['machine'], false, '3', '12-15', mach(0.3)),
  e('seated-leg-curl', 'Seated Leg Curl', 'hamstrings', ['machine'], false, '3', '12-15', mach(0.35)),

  // glutes
  e('hip-thrust', 'Hip Thrust', 'glutes', ['barbell', 'bench'], true, '4', '8-10', bar(0.75), ['hamstrings']),
  e('sumo-deadlift', 'Sumo Deadlift', 'glutes', ['barbell'], true, '3', '5-6', bar(0.9), ['hamstrings', 'back']),
  e('db-hip-thrust', 'Dumbbell Hip Thrust', 'glutes', ['dumbbell', 'bench'], true, '3', '10-12', mach(0.3), ['hamstrings']),
  e('step-up', 'Step-up', 'glutes', ['dumbbell'], true, '3', '10 each', db(0.15), ['quads']),
  e('cable-kickback', 'Cable Glute Kickback', 'glutes', ['cable'], false, '3', '12-15', mach(0.1)),
  e('abduction', 'Hip Abduction', 'glutes', ['machine'], false, '3', '15-20', mach(0.35)),
  e('glute-bridge', 'Glute Bridge', 'glutes', [], false, '3', '15', BW),
  e('single-leg-bridge', 'Single-leg Glute Bridge', 'glutes', [], false, '3', '10 each', BW, ['hamstrings']),

  // calves
  e('standing-calf-raise', 'Standing Calf Raise', 'calves', ['machine'], false, '4', '12-15', mach(0.7)),
  e('seated-calf-raise', 'Seated Calf Raise', 'calves', ['machine'], false, '4', '15-20', mach(0.45)),
  e('donkey-calf-raise', 'Donkey Calf Raise', 'calves', ['machine'], false, '3', '12-15', mach(0.6)),
  e('db-calf-raise', 'Dumbbell Calf Raise', 'calves', ['dumbbell'], false, '3', '15-20', db(0.25)),
  e('single-leg-calf-raise', 'Single-leg Calf Raise', 'calves', [], false, '3', '12-15 each', BW),
  e('jump-rope-calves', 'Jump Rope', 'calves', ['jump-rope'], false, '3', '60s', NONE, ['cardio']),
  e('tibialis-raise', 'Tibialis Raise', 'calves', [], false, '3', '15', BW),

  // cardio
  e('intervals', 'Bike Intervals', 'cardio', ['cardio-machine'], false, '8', '30s on / 90s off', NONE),
  e('incline-walk', 'Incline Treadmill Walk', 'cardio', ['cardio-machine'], false, '1', '20-30 min', NONE),
  e('row-erg', 'Rowing Machine', 'cardio', ['cardio-machine'], false, '1', '2000m', NONE, ['back']),
  e('stair-master', 'Stair Climber', 'cardio', ['cardio-machine'], false, '1', '15 min', NONE, ['glutes']),
  e('sled-push', 'Sled Push', 'cardio', ['machine'], true, '6', '20m', mach(0.4, 10), ['quads', 'glutes']),
  e('jump-rope', 'Jump Rope', 'cardio', ['jump-rope'], false, '5', '2 min', NONE, ['calves']),
  e('burpees', 'Burpees', 'cardio', [], true, '5', '10', BW, ['chest', 'quads']),
  e('mountain-climbers', 'Mountain Climbers', 'cardio', [], false, '4', '30s', BW, ['abs']),
  e('high-knees', 'High Knees', 'cardio', [], false, '4', '30s', BW),
];

export const isBodyPart = (v: string): v is BodyPart => (BODY_PARTS as readonly string[]).includes(v);

export const isGear = (v: string): v is Gear => (GEAR as readonly string[]).includes(v);
