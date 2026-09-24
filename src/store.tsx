import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './auth';
import { DEFAULT_AGENDA, newId } from './data';
import { Agenda, BodyPart, DayPlan, Weekday, WorkoutLog } from './types';

/**
 * Storage is namespaced per account, so two people sharing a phone never see
 * each other's workouts. Signed out, nothing is read or written.
 */
const agendaKey = (userId: string) => `gymtracker:agenda:v2:${userId}`;
const logsKey = (userId: string) => `gymtracker:logs:v2:${userId}`;
const settingsKey = (userId: string) => `gymtracker:settings:v1:${userId}`;

type Settings = {
  /** Saving a workout on Today also makes it that weekday's agenda plan. */
  syncAgenda: boolean;
};

const DEFAULT_SETTINGS: Settings = { syncAgenda: true };

type Store = {
  ready: boolean;
  agenda: Agenda;
  logs: WorkoutLog[];
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  updateDay: (day: Weekday, plan: DayPlan) => void;
  resetAgenda: () => void;
  /** Creates or replaces the log for a date. Empty body parts + empty note deletes it. */
  saveLog: (date: string, bodyParts: BodyPart[], note: string) => void;
  deleteLog: (id: string) => void;
  logForDate: (date: string) => WorkoutLog | undefined;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [ready, setReady] = useState(false);
  const [agenda, setAgenda] = useState<Agenda>(DEFAULT_AGENDA);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  // Swap to the signed-in account's data (and away from it on sign-out).
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setAgenda(DEFAULT_AGENDA);
    setLogs([]);
    setSettings(DEFAULT_SETTINGS);

    if (!userId) {
      setReady(true);
      return;
    }

    (async () => {
      try {
        const [a, l, st] = await Promise.all([
          AsyncStorage.getItem(agendaKey(userId)),
          AsyncStorage.getItem(logsKey(userId)),
          AsyncStorage.getItem(settingsKey(userId)),
        ]);
        if (cancelled) return;
        if (a) setAgenda(JSON.parse(a));
        if (l) setLogs(JSON.parse(l));
        if (st) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(st) });
      } catch (e) {
        console.warn('Failed to load saved data', e);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (ready && userId) AsyncStorage.setItem(agendaKey(userId), JSON.stringify(agenda)).catch(console.warn);
  }, [agenda, ready, userId]);

  useEffect(() => {
    if (ready && userId) AsyncStorage.setItem(logsKey(userId), JSON.stringify(logs)).catch(console.warn);
  }, [logs, ready, userId]);

  useEffect(() => {
    if (ready && userId) AsyncStorage.setItem(settingsKey(userId), JSON.stringify(settings)).catch(console.warn);
  }, [settings, ready, userId]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
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
    () => ({ ready, agenda, logs, settings, updateSettings, updateDay, resetAgenda, saveLog, deleteLog, logForDate }),
    [ready, agenda, logs, settings, updateSettings, updateDay, resetAgenda, saveLog, deleteLog, logForDate],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
