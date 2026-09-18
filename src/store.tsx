import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_AGENDA, newId } from './data';
import { Agenda, BodyPart, DayPlan, Weekday, WorkoutLog } from './types';

const AGENDA_KEY = 'gymtracker:agenda:v1';
const LOGS_KEY = 'gymtracker:logs:v1';

type Store = {
  ready: boolean;
  agenda: Agenda;
  logs: WorkoutLog[];
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

  useEffect(() => {
    (async () => {
      try {
        const [a, l] = await Promise.all([AsyncStorage.getItem(AGENDA_KEY), AsyncStorage.getItem(LOGS_KEY)]);
        if (a) setAgenda(JSON.parse(a));
        if (l) setLogs(JSON.parse(l));
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
    () => ({ ready, agenda, logs, updateDay, resetAgenda, saveLog, deleteLog, logForDate }),
    [ready, agenda, logs, updateDay, resetAgenda, saveLog, deleteLog, logForDate],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
