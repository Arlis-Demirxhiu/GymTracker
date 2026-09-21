import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import * as api from './api';
import { AuthUser } from './api';
import { Profile } from './types';

const TOKEN_KEY = 'gymtracker.token';

/**
 * SecureStore has no web implementation, so the browser build keeps the token
 * in AsyncStorage (localStorage). Fine for the dev preview; on a phone the
 * token lives in the keychain/keystore.
 */
const tokenStore = {
  get: () => (Platform.OS === 'web' ? AsyncStorage.getItem(TOKEN_KEY) : SecureStore.getItemAsync(TOKEN_KEY)),
  set: (token: string) =>
    Platform.OS === 'web' ? AsyncStorage.setItem(TOKEN_KEY, token) : SecureStore.setItemAsync(TOKEN_KEY, token),
  clear: () => (Platform.OS === 'web' ? AsyncStorage.removeItem(TOKEN_KEY) : SecureStore.deleteItemAsync(TOKEN_KEY)),
};

type Auth = {
  /** False until the stored token has been checked. */
  ready: boolean;
  token: string | null;
  user: AuthUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
};

const AuthContext = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  // Resume the previous session, unless the token has expired or been revoked.
  useEffect(() => {
    (async () => {
      try {
        const saved = await tokenStore.get();
        if (saved) {
          const { user: me } = await api.fetchMe(saved);
          setToken(saved);
          setUser(me);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'UnauthorizedError') await tokenStore.clear().catch(() => {});
        // Otherwise the server is simply unreachable: keep the token and let
        // the user try again rather than silently signing them out.
        else console.warn('Could not restore session', err);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const start = useCallback(async (result: { token: string; user: AuthUser }) => {
    await tokenStore.set(result.token);
    setToken(result.token);
    setUser(result.user);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => start(await api.signIn(email.trim(), password)),
    [start],
  );

  const signUp = useCallback(
    async (email: string, password: string) => start(await api.signUp(email.trim(), password)),
    [start],
  );

  const signOut = useCallback(async () => {
    const current = token;
    setToken(null);
    setUser(null);
    await tokenStore.clear().catch(() => {});
    // Best effort: the session is over locally even if the server is down.
    if (current) await api.signOutRequest(current).catch(() => {});
  }, [token]);

  const updateProfile = useCallback(
    async (patch: Partial<Profile>) => {
      if (!token) return;
      const { user: updated } = await api.patchProfile(token, patch);
      setUser(updated);
    },
    [token],
  );

  const value = useMemo(
    () => ({ ready, token, user, signIn, signUp, signOut, updateProfile }),
    [ready, token, user, signIn, signUp, signOut, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

/** The signed-in profile, with sane defaults before one is filled in. */
export function useProfile(): Profile {
  const { user } = useAuth();
  return user?.profile ?? { heightCm: null, weightKg: null, level: 'beginner' };
}
