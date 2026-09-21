import { useCallback, useEffect, useRef, useState } from 'react';
import { BodyPart, Exercise, ExperienceLevel } from './types';

/**
 * Base URL of the exercise API (see ../server).
 * Override with EXPO_PUBLIC_API_URL — a real phone needs this Mac's LAN
 * address, e.g. EXPO_PUBLIC_API_URL=http://192.168.1.143:3001
 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

const TIMEOUT_MS = 6000;

export type SuggestedLoad = {
  /** Working weight in kg, per hand for dumbbells. Null for bodyweight and cardio. */
  kg: number | null;
  perHand: boolean;
  label: string;
};

export type Suggestion = Exercise & {
  bodyPart: BodyPart;
  also: BodyPart[];
  equipment: string;
  compound: boolean;
  /** Only present when a bodyweight was sent with the request. */
  suggestedLoad?: SuggestedLoad;
};

/** Height is deliberately not sent: it does not predict how much you can lift. */
export type LoadProfile = { weightKg: number | null; level: ExperienceLevel };

export async function fetchSuggestions(parts: BodyPart[], profile?: LoadProfile): Promise<Suggestion[]> {
  if (parts.length === 0) return [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const query = new URLSearchParams({ parts: parts.join(',') });
    if (profile?.weightKg) {
      query.set('bodyweight', String(profile.weightKg));
      query.set('level', profile.level);
    }
    const url = `${API_URL}/exercises?${query.toString()}`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(body?.error ?? `Server returned ${res.status}`);
    }
    const body = (await res.json()) as { exercises: Suggestion[] };
    return body.exercises;
  } finally {
    clearTimeout(timer);
  }
}

/** A message worth showing: the server's complaint beats a generic network error. */
function describe(err: unknown): string {
  if (!(err instanceof Error)) return "Couldn't reach the exercise server.";
  if (err.name === 'AbortError') return 'Server took too long to answer.';
  // fetch() rejects with an opaque message when the host is unreachable.
  if (/network request failed|failed to fetch/i.test(err.message)) return "Couldn't reach the exercise server.";
  return err.message;
}

/** Fetches suggestions for `parts`, re-running when the selection or profile changes. */
export function useSuggestions(parts: BodyPart[], profile?: LoadProfile) {
  const [exercises, setExercises] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const key = [...parts].sort().join(',');
  const weightKg = profile?.weightKg ?? null;
  const level = profile?.level ?? 'beginner';
  // Only the latest request may write to state.
  const requestId = useRef(0);

  const load = useCallback(() => {
    const id = ++requestId.current;
    const wanted = key ? (key.split(',') as BodyPart[]) : [];

    if (wanted.length === 0) {
      setExercises([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchSuggestions(wanted, { weightKg, level })
      .then((list) => {
        if (id !== requestId.current) return;
        setExercises(list);
        setError(null);
      })
      .catch((err: unknown) => {
        if (id !== requestId.current) return;
        setExercises([]);
        setError(describe(err));
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
  }, [key, weightKg, level]);

  useEffect(load, [load]);

  return { exercises, loading, error, reload: load };
}
