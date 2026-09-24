import { Agenda, BodyPart, DayPlan, Gear, Profile, Weekday } from './types';

export const BODY_PARTS: { key: BodyPart; label: string; color: string }[] = [
  { key: 'chest', label: 'Chest', color: '#FF6B6B' },
  { key: 'back', label: 'Back', color: '#4D96FF' },
  { key: 'shoulders', label: 'Shoulders', color: '#FFB84D' },
  { key: 'biceps', label: 'Biceps', color: '#9B7BFF' },
  { key: 'triceps', label: 'Triceps', color: '#E57BFF' },
  { key: 'forearms', label: 'Forearms', color: '#B38B6D' },
  { key: 'abs', label: 'Abs', color: '#FFD93D' },
  { key: 'quads', label: 'Quads', color: '#3DDC97' },
  { key: 'hamstrings', label: 'Hamstrings', color: '#2EC4B6' },
  { key: 'glutes', label: 'Glutes', color: '#FF8FAB' },
  { key: 'calves', label: 'Calves', color: '#7BD3EA' },
  { key: 'cardio', label: 'Cardio', color: '#F25F5C' },
];

export const BODY_PART_MAP = Object.fromEntries(BODY_PARTS.map((b) => [b.key, b])) as Record<
  BodyPart,
  (typeof BODY_PARTS)[number]
>;

export const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

// ---- equipment ----

/** Icons are MaterialCommunityIcons names. */
export const GEAR_OPTIONS: { key: Gear; label: string; icon: string }[] = [
  { key: 'barbell', label: 'Barbell & plates', icon: 'weight-lifter' },
  { key: 'dumbbell', label: 'Dumbbells', icon: 'dumbbell' },
  { key: 'kettlebell', label: 'Kettlebell', icon: 'kettlebell' },
  { key: 'bench', label: 'Bench', icon: 'bench' },
  { key: 'machine', label: 'Weight machines', icon: 'weight-kilogram' },
  { key: 'cable', label: 'Cable machine', icon: 'cable-data' },
  { key: 'pullup-bar', label: 'Pull-up bar', icon: 'gymnastics' },
  { key: 'dip-bars', label: 'Dip bars', icon: 'arm-flex' },
  { key: 'cardio-machine', label: 'Cardio machines', icon: 'bike' },
  { key: 'jump-rope', label: 'Jump rope', icon: 'jump-rope' },
  { key: 'ab-wheel', label: 'Ab wheel', icon: 'tire' },
];

export const ALL_GEAR: Gear[] = GEAR_OPTIONS.map((g) => g.key);

/** Starting points; the toggles fine-tune from there. */
export const EQUIPMENT_PRESETS: { key: string; label: string; icon: string; gear: Gear[] }[] = [
  { key: 'gym', label: 'Full gym', icon: 'office-building', gear: ALL_GEAR },
  { key: 'home', label: 'Dumbbells at home', icon: 'home-variant', gear: ['dumbbell'] },
  { key: 'none', label: 'No equipment', icon: 'human-handsup', gear: [] },
];

export const DEFAULT_PROFILE: Profile = { heightCm: null, weightKg: null, level: 'beginner', equipment: ALL_GEAR };

/** Display order: Monday first. */
export const WEEK_ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

let idCounter = 0;
export const newId = () => `${Date.now().toString(36)}-${(idCounter++).toString(36)}`;

/** A blank day: no title, no muscles, no exercises. */
const emptyDay = (): DayPlan => ({ title: '', rest: false, bodyParts: [], exercises: [] });

/** New accounts start with an empty week — the plan is whatever you decide to train. */
export const DEFAULT_AGENDA: Agenda = {
  0: emptyDay(),
  1: emptyDay(),
  2: emptyDay(),
  3: emptyDay(),
  4: emptyDay(),
  5: emptyDay(),
  6: emptyDay(),
};

/** True when a day has nothing planned at all. */
export const isEmptyDay = (plan: DayPlan) =>
  !plan.rest && !plan.title.trim() && plan.bodyParts.length === 0 && plan.exercises.length === 0;

// ---- date helpers (local time, not UTC) ----

export const toDateKey = (d: Date) => {
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

export const fromDateKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (d: Date, n: number) => {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
};

export const daysBetween = (a: Date, b: Date) => {
  const MS = 24 * 60 * 60 * 1000;
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ub - ua) / MS);
};

/** Monday of the week containing d. */
export const startOfWeek = (d: Date) => {
  const offset = (d.getDay() + 6) % 7;
  return addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -offset);
};

export const formatDate = (d: Date) =>
  d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
