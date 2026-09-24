import { randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';
import { GEAR, isGear, type Gear } from './catalog.ts';
import { isLevel, type Level } from './load.ts';

const scryptAsync = promisify(scrypt) as (secret: string, salt: Buffer, keylen: number) => Promise<Buffer>;

/**
 * Resolved per call, not at import time: an ES module's imports are evaluated
 * before the importing file's own statements, so a test that sets DATA_FILE
 * would otherwise be ignored and write to the real database.
 */
const dataFile = () => process.env.DATA_FILE ?? join(import.meta.dirname, '..', 'data', 'db.json');

export const TOKEN_TTL_DAYS = 30;
export const MIN_PASSWORD_LENGTH = 8;

export type Profile = {
  heightCm: number | null;
  weightKg: number | null;
  level: Level;
  /** Kit the lifter has access to. Everything by default, i.e. a full gym. */
  equipment: Gear[];
};

export const DEFAULT_PROFILE = (): Profile => ({ heightCm: null, weightKg: null, level: 'beginner', equipment: [...GEAR] });

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  profile: Profile;
  createdAt: string;
};

/** What the client is allowed to see — never the hash. */
export type PublicUser = { id: string; email: string; profile: Profile };

type Token = { userId: string; expiresAt: number };

type Db = { users: User[]; tokens: Record<string, Token> };

const EMPTY_DB: Db = { users: [], tokens: {} };

let db: Db | null = null;
/** Writes are chained so two requests can't clobber the file. */
let writeQueue: Promise<void> = Promise.resolve();

async function load(): Promise<Db> {
  if (db) return db;
  try {
    const raw = await readFile(dataFile(), 'utf8');
    const parsed = JSON.parse(raw) as Partial<Db>;
    // Accounts from before a profile field existed get its default.
    const users = (parsed.users ?? []).map((u) => ({ ...u, profile: { ...DEFAULT_PROFILE(), ...u.profile } }));
    db = { users, tokens: parsed.tokens ?? {} };
  } catch {
    db = structuredClone(EMPTY_DB); // first run, or an unreadable file
  }
  return db;
}

function persist(): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    const file = dataFile();
    const snapshot = JSON.stringify(db, null, 2);
    await mkdir(dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    await writeFile(tmp, snapshot, { mode: 0o600 });
    await rename(tmp, file); // atomic: readers never see half a file
  });
  return writeQueue;
}

// ---- passwords ----

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = await scryptAsync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return timingSafeEqual(expected, actual);
}

// ---- users ----

export const normaliseEmail = (email: string) => email.trim().toLowerCase();

/** Deliberately loose: the point is to catch typos, not to police addresses. */
export const isEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const publicUser = (user: User): PublicUser => ({ id: user.id, email: user.email, profile: user.profile });

export async function findByEmail(email: string): Promise<User | undefined> {
  const store = await load();
  const wanted = normaliseEmail(email);
  return store.users.find((u) => u.email === wanted);
}

export async function createUser(email: string, password: string): Promise<User> {
  const store = await load();
  const user: User = {
    id: randomUUID(),
    email: normaliseEmail(email),
    passwordHash: await hashPassword(password),
    profile: DEFAULT_PROFILE(),
    createdAt: new Date().toISOString(),
  };
  store.users.push(user);
  await persist();
  return user;
}

export async function updateProfile(userId: string, patch: Partial<Profile>): Promise<User | undefined> {
  const store = await load();
  const user = store.users.find((u) => u.id === userId);
  if (!user) return undefined;

  if ('heightCm' in patch) user.profile.heightCm = patch.heightCm ?? null;
  if ('weightKg' in patch) user.profile.weightKg = patch.weightKg ?? null;
  if (patch.level && isLevel(patch.level)) user.profile.level = patch.level;
  if (Array.isArray(patch.equipment)) user.profile.equipment = [...new Set(patch.equipment.filter(isGear))];

  await persist();
  return user;
}

// ---- tokens ----

export async function issueToken(userId: string): Promise<string> {
  const store = await load();
  const token = randomBytes(32).toString('hex');
  store.tokens[token] = { userId, expiresAt: Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000 };
  await persist();
  return token;
}

export async function userForToken(token: string): Promise<User | undefined> {
  const store = await load();
  const entry = store.tokens[token];
  if (!entry) return undefined;
  if (entry.expiresAt < Date.now()) {
    delete store.tokens[token];
    await persist();
    return undefined;
  }
  return store.users.find((u) => u.id === entry.userId);
}

export async function revokeToken(token: string): Promise<void> {
  const store = await load();
  if (store.tokens[token]) {
    delete store.tokens[token];
    await persist();
  }
}

/** Test seam: forget the in-memory copy so the next call re-reads the file. */
export function resetCache(): void {
  db = null;
}
