import { Agenda, BodyPart, Exercise, Weekday } from './types';

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

/** Display order: Monday first. */
export const WEEK_ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

let idCounter = 0;
export const newId = () => `${Date.now().toString(36)}-${(idCounter++).toString(36)}`;

const ex = (name: string, sets: string, reps: string): Exercise => ({ id: newId(), name, sets, reps });

export const DEFAULT_AGENDA: Agenda = {
  1: {
    title: 'Push',
    rest: false,
    bodyParts: ['chest', 'shoulders', 'triceps'],
    exercises: [ex('Bench Press', '4', '6-8'), ex('Overhead Press', '3', '8-10'), ex('Tricep Pushdown', '3', '12')],
  },
  2: {
    title: 'Pull',
    rest: false,
    bodyParts: ['back', 'biceps'],
    exercises: [ex('Pull-ups', '4', '6-10'), ex('Barbell Row', '3', '8'), ex('Hammer Curl', '3', '12')],
  },
  3: {
    title: 'Legs',
    rest: false,
    bodyParts: ['quads', 'hamstrings', 'glutes', 'calves'],
    exercises: [ex('Back Squat', '4', '5'), ex('Romanian Deadlift', '3', '8'), ex('Calf Raise', '4', '15')],
  },
  4: { title: 'Rest', rest: true, bodyParts: [], exercises: [] },
  5: {
    title: 'Upper',
    rest: false,
    bodyParts: ['chest', 'back', 'shoulders'],
    exercises: [ex('Incline DB Press', '3', '10'), ex('Lat Pulldown', '3', '10'), ex('Lateral Raise', '3', '15')],
  },
  6: {
    title: 'Lower + Core',
    rest: false,
    bodyParts: ['quads', 'glutes', 'abs'],
    exercises: [ex('Leg Press', '4', '10'), ex('Hip Thrust', '3', '10'), ex('Hanging Leg Raise', '3', '12')],
  },
  0: { title: 'Rest', rest: true, bodyParts: [], exercises: [] },
};

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
