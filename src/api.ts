import { useCallback, useEffect, useRef, useState } from 'react';
import { BodyPart, Exercise, ExperienceLevel, Profile } from './types';

/**
 * Base URL of the exercise API (see ../server).
 * Override with EXPO_PUBLIC_API_URL — a real phone needs this Mac's LAN
 * address, e.g. EXPO_PUBLIC_API_URL=http://192.168.1.143:3001
 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

const TIMEOUT_MS = 8000;

export type AuthUser = { id: string; email: string; profile: Profile };

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
  /** Only present once the account has a bodyweight. */
  suggestedLoad?: SuggestedLoad;
};

type RequestOptions = { method?: string; body?: unknown; token?: string | null };

/** One place for JSON, auth headers, timeouts and turning errors into messages. */
async function request<T>(path: string, { method = 'GET', body, token }: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        ...(body ? { 'content-type': 'application/json' } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      const error = new Error(payload?.error ?? `Server returned ${res.status}`);
      error.name = res.status === 401 ? 'UnauthorizedError' : error.name;
      throw error;
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

// ---- accounts ----

export const signUp = (email: string, password: string) =>
  request<{ token: string; user: AuthUser }>('/auth/signup', { method: 'POST', body: { email, password } });

export const signIn = (email: string, password: string) =>
  request<{ token: string; user: AuthUser }>('/auth/login', { method: 'POST', body: { email, password } });

export const signOutRequest = (token: string) => request<{ ok: true }>('/auth/logout', { method: 'POST', token });

export const fetchMe = (token: string) => request<{ user: AuthUser }>('/me', { token });

export const patchProfile = (token: string, patch: Partial<Profile>) =>
  request<{ user: AuthUser }>('/me', { method: 'PATCH', body: patch, token });

// ---- exercises ----

export async function fetchSuggestions(parts: BodyPart[], token?: string | null): Promise<Suggestion[]> {
  if (parts.length === 0) return [];
  // The server reads bodyweight and level from the signed-in account.
  const query = new URLSearchParams({ parts: parts.join(',') });
  const body = await request<{ exercises: Suggestion[] }>(`/exercises?${query.toString()}`, { token });
  return body.exercises;
}

/** A message worth showing: the server's complaint beats a generic network error. */
export function describe(err: unknown): string {
  if (!(err instanceof Error)) return "Couldn't reach the exercise server.";
  if (err.name === 'AbortError') return 'Server took too long to answer.';
  // fetch() rejects with an opaque message when the host is unreachable.
  if (/network request failed|failed to fetch/i.test(err.message)) return "Couldn't reach the exercise server.";
  return err.message;
}

/** Fetches suggestions for `parts`, re-running when the selection or profile changes. */
export function useSuggestions(parts: BodyPart[], token: string | null, level?: ExperienceLevel, weightKg?: number | null) {
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
    fetchSuggestions(wanted, token)
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
    // level and weightKg are not sent, but a change to either must refetch.
  }, [key, token, level, weightKg]);

  useEffect(load, [load]);

  return { exercises, loading, error, reload: load };
}
