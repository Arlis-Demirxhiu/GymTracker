import { useCallback, useEffect, useRef, useState } from 'react';
import { BodyPart, Exercise } from './types';

/**
 * Base URL of the exercise API (see ../server).
 * Override with EXPO_PUBLIC_API_URL — a real phone needs this Mac's LAN
 * address, e.g. EXPO_PUBLIC_API_URL=http://192.168.1.143:3001
 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

const TIMEOUT_MS = 6000;

export type Suggestion = Exercise & {
  bodyPart: BodyPart;
  also: BodyPart[];
  equipment: string;
  compound: boolean;
};

export async function fetchSuggestions(parts: BodyPart[]): Promise<Suggestion[]> {
  if (parts.length === 0) return [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const url = `${API_URL}/exercises?parts=${encodeURIComponent(parts.join(','))}`;
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

/** Fetches suggestions for `parts`, re-running when the selection changes. */
export function useSuggestions(parts: BodyPart[]) {
  const [exercises, setExercises] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const key = [...parts].sort().join(',');
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
    fetchSuggestions(wanted)
      .then((list) => {
        if (id !== requestId.current) return;
        setExercises(list);
        setError(null);
      })
      .catch((err: unknown) => {
        if (id !== requestId.current) return;
        setExercises([]);
        setError(err instanceof Error && err.name === 'AbortError' ? 'Server took too long to answer.' : "Couldn't reach the exercise server.");
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
  }, [key]);

  useEffect(load, [load]);

  return { exercises, loading, error, reload: load };
}
