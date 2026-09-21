export type BodyPart =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'cardio';

/** 0 = Sunday … 6 = Saturday, matching Date#getDay(). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type Exercise = {
  id: string;
  name: string;
  sets: string;
  reps: string;
};

export type DayPlan = {
  title: string;
  rest: boolean;
  bodyParts: BodyPart[];
  exercises: Exercise[];
};

export type Agenda = Record<Weekday, DayPlan>;

export type WorkoutLog = {
  id: string;
  /** Local date key, YYYY-MM-DD. One log per date. */
  date: string;
  bodyParts: BodyPart[];
  note: string;
};

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type Profile = {
  /** Centimetres. Used for BMI only — it does not change suggested weights. */
  heightCm: number | null;
  weightKg: number | null;
  level: ExperienceLevel;
};
