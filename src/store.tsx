import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_AGENDA, newId } from './data';
import { Agenda, BodyPart, DayPlan, Profile, Weekday, WorkoutLog } from './types';

const AGENDA_KEY = 'gymtracker:agenda:v1';
const LOGS_KEY = 'gymtracker:logs:v1';
const PROFILE_KEY = 'gymtracker:profile:v1';

const EMPTY_PROFILE: Profile = { heightCm: null, weightKg: null, level: 'beginner' };

type Store = {
  ready: boolean;
  agenda: Agenda;
  logs: WorkoutLog[];
  profile: Profile;
  updateProfile: (patch: Partial<Profile>) => void;
  updateDay: (day: Weekday, plan: DayPlan) => void;
  resetAgenda: () => void;
  /** Creates or replaces the log for a date. Empty body parts + empty note deletes it. */
  saveLog: (date: string, bodyParts: BodyPart[], note: string) => void;
  deleteLog: (id: string) => void;
  logForDate: (date: string) => WorkoutLog | undefined;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [agenda, setAgenda] = useState<Agenda>(DEFAULT_AGENDA);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);

  useEffect(() => {
    (async () => {
      try {
        const [a, l, p] = await Promise.all([
          AsyncStorage.getItem(AGENDA_KEY),
          AsyncStorage.getItem(LOGS_KEY),
          AsyncStorage.getItem(PROFILE_KEY),
        ]);
        if (a) setAgenda(JSON.parse(a));
        if (l) setLogs(JSON.parse(l));
        if (p) setProfile({ ...EMPTY_PROFILE, ...JSON.parse(p) });
      } catch (e) {
        console.warn('Failed to load saved data', e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(AGENDA_KEY, JSON.stringify(agenda)).catch(console.warn);
  }, [agenda, ready]);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(LOGS_KEY, JSON.stringify(logs)).catch(console.warn);
  }, [logs, ready]);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile)).catch(console.warn);
  }, [profile, ready]);

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setProfile((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateDay = useCallback((day: Weekday, plan: DayPlan) => {
    setAgenda((prev) => ({ ...prev, [day]: plan }));
  }, []);

  const resetAgenda = useCallback(() => setAgenda(DEFAULT_AGENDA), []);

  const saveLog = useCallback((date: string, bodyParts: BodyPart[], note: string) => {
    setLogs((prev) => {
      const rest = prev.filter((l) => l.date !== date);
      if (bodyParts.length === 0 && !note.trim()) return rest;
      const existing = prev.find((l) => l.date === date);
      const log: WorkoutLog = { id: existing?.id ?? newId(), date, bodyParts, note: note.trim() };
      return [...rest, log].sort((a, b) => b.date.localeCompare(a.date));
    });
  }, []);

  const deleteLog = useCallback((id: string) => {
    setLogs((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const logForDate = useCallback((date: string) => logs.find((l) => l.date === date), [logs]);

  const value = useMemo(
    () => ({ ready, agenda, logs, profile, updateProfile, updateDay, resetAgenda, saveLog, deleteLog, logForDate }),
    [ready, agenda, logs, profile, updateProfile, updateDay, resetAgenda, saveLog, deleteLog, logForDate],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
