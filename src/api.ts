import Constants from 'expo-constants';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BodyPart, Exercise, Profile } from './types';

const API_PORT = 3001;

/**
 * Base URL of the API (see ../server).
 *
 * A phone can't reach the dev machine's "localhost", so in development we
 * borrow the host Expo is already serving the bundle from — the same address
 * the QR code points at. Set EXPO_PUBLIC_API_URL to override, which a release
 * build needs since `hostUri` only exists while developing.
 */
function defaultApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.1.143:8081"
  const host = hostUri?.split(':')[0];
  if (host) return `http://${host}:${API_PORT}`;

  return `http://localhost:${API_PORT}`;
}

export const API_URL = defaultApiUrl();

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

export type Suggestions = {
  exercises: Suggestion[];
  /** Requested muscles that nothing in the account's equipment can train. */
  uncovered: BodyPart[];
};

export async function fetchSuggestions(parts: BodyPart[], token?: string | null): Promise<Suggestions> {
  if (parts.length === 0) return { exercises: [], uncovered: [] };
  // The server reads bodyweight, level and equipment from the signed-in account.
  const query = new URLSearchParams({ parts: parts.join(',') });
  const body = await request<Suggestions>(`/exercises?${query.toString()}`, { token });
  return { exercises: body.exercises, uncovered: body.uncovered ?? [] };
}

/** A message worth showing: the server's complaint beats a generic network error. */
export function describe(err: unknown): string {
  if (!(err instanceof Error)) return "Couldn't reach the exercise server.";
  if (err.name === 'AbortError') return 'Server took too long to answer.';
  // fetch() rejects with an opaque message when the host is unreachable.
  if (/network request failed|failed to fetch/i.test(err.message)) return `Couldn't reach the server at ${API_URL}.`;
  return err.message;
}

/** Fetches suggestions for `parts`, re-running when the selection or profile changes. */
export function useSuggestions(parts: BodyPart[], token: string | null, profile?: Profile) {
  const [exercises, setExercises] = useState<Suggestion[]>([]);
  const [uncovered, setUncovered] = useState<BodyPart[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const key = [...parts].sort().join(',');
  // The server reads the profile itself, but a change to it must still refetch.
  const profileKey = profile
    ? `${profile.level}|${profile.weightKg}|${[...profile.equipment].sort().join(',')}`
    : '';
  // Only the latest request may write to state.
  const requestId = useRef(0);

  const load = useCallback(() => {
    const id = ++requestId.current;
    const wanted = key ? (key.split(',') as BodyPart[]) : [];

    if (wanted.length === 0) {
      setExercises([]);
      setUncovered([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchSuggestions(wanted, token)
      .then((result) => {
        if (id !== requestId.current) return;
        setExercises(result.exercises);
        setUncovered(result.uncovered);
        setError(null);
      })
      .catch((err: unknown) => {
        if (id !== requestId.current) return;
        setExercises([]);
        setUncovered([]);
        setError(describe(err));
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- profileKey stands in for the profile
  }, [key, token, profileKey]);

  useEffect(load, [load]);

  return { exercises, uncovered, loading, error, reload: load };
}
