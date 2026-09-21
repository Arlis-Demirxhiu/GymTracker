import type { NextFunction, Request, Response } from 'express';
import type { User } from './users.ts';
import { userForToken } from './users.ts';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
      token?: string;
    }
  }
}

const bearer = (req: Request): string | null => {
  const header = req.get('authorization');
  if (!header?.toLowerCase().startsWith('bearer ')) return null;
  return header.slice(7).trim() || null;
};

/** Attaches req.user when a valid token is present, but lets anonymous calls through. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = bearer(req);
  if (token) {
    const user = await userForToken(token);
    if (user) {
      req.user = user;
      req.token = token;
    }
  }
  next();
}

/** Rejects the request unless a valid token is present. */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = bearer(req);
  const user = token ? await userForToken(token) : undefined;
  if (!user || !token) return res.status(401).json({ error: 'Sign in to continue' });
  req.user = user;
  req.token = token;
  next();
}

/**
 * Slows down password guessing: five misses locks that email for a minute.
 * In memory on purpose — a restart clearing it is fine for a single server.
 */
const MAX_ATTEMPTS = 5;
const LOCK_MS = 60_000;
const attempts = new Map<string, { count: number; until: number }>();

export function lockedFor(key: string): number {
  const entry = attempts.get(key);
  if (!entry || entry.until < Date.now()) return 0;
  return entry.count >= MAX_ATTEMPTS ? Math.ceil((entry.until - Date.now()) / 1000) : 0;
}

export function recordFailure(key: string): void {
  const entry = attempts.get(key);
  const count = entry && entry.until > Date.now() ? entry.count + 1 : 1;
  attempts.set(key, { count, until: Date.now() + LOCK_MS });
}

export function clearFailures(key: string): void {
  attempts.delete(key);
}
