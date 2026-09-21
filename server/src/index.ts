import cors from 'cors';
import express from 'express';
import { clearFailures, lockedFor, optionalAuth, recordFailure, requireAuth } from './auth.ts';
import { BODY_PARTS, isBodyPart, type BodyPart } from './catalog.ts';
import { isLevel, LEVELS, MAX_BODYWEIGHT, MIN_BODYWEIGHT, withLoads, type Level } from './load.ts';
import { MAX_EXERCISES, selectExercises } from './select.ts';
import {
  createUser,
  findByEmail,
  isEmail,
  issueToken,
  MIN_PASSWORD_LENGTH,
  normaliseEmail,
  publicUser,
  revokeToken,
  updateProfile,
  verifyPassword,
} from './users.ts';

const app = express();
app.use(cors());
app.use(express.json());

const MIN_HEIGHT = 100;
const MAX_HEIGHT = 250;

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/body-parts', (_req, res) => {
  res.json({ bodyParts: BODY_PARTS });
});

// ---- accounts ----

app.post('/auth/signup', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || !isEmail(email)) return res.status(400).json({ error: 'Enter a valid email address' });
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
  }
  if (await findByEmail(email)) return res.status(409).json({ error: 'That email already has an account' });

  const user = await createUser(email, password);
  const token = await issueToken(user.id);
  res.status(201).json({ token, user: publicUser(user) });
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const key = normaliseEmail(email);
  const seconds = lockedFor(key);
  if (seconds) return res.status(429).json({ error: `Too many attempts. Try again in ${seconds}s.` });

  const user = await findByEmail(email);
  // Same message either way: don't reveal which emails have accounts.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    recordFailure(key);
    return res.status(401).json({ error: 'Email or password is wrong' });
  }

  clearFailures(key);
  const token = await issueToken(user.id);
  res.json({ token, user: publicUser(user) });
});

app.post('/auth/logout', requireAuth, async (req, res) => {
  await revokeToken(req.token!);
  res.json({ ok: true });
});

app.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user!) });
});

app.patch('/me', requireAuth, async (req, res) => {
  const { heightCm, weightKg, level } = req.body ?? {};
  const patch: { heightCm?: number | null; weightKg?: number | null; level?: Level } = {};

  if (heightCm !== undefined) {
    if (heightCm !== null && (typeof heightCm !== 'number' || heightCm < MIN_HEIGHT || heightCm > MAX_HEIGHT)) {
      return res.status(400).json({ error: `Height must be between ${MIN_HEIGHT} and ${MAX_HEIGHT} cm` });
    }
    patch.heightCm = heightCm;
  }
  if (weightKg !== undefined) {
    if (weightKg !== null && (typeof weightKg !== 'number' || weightKg < MIN_BODYWEIGHT || weightKg > MAX_BODYWEIGHT)) {
      return res.status(400).json({ error: `Weight must be between ${MIN_BODYWEIGHT} and ${MAX_BODYWEIGHT} kg` });
    }
    patch.weightKg = weightKg;
  }
  if (level !== undefined) {
    if (typeof level !== 'string' || !isLevel(level)) {
      return res.status(400).json({ error: `level must be one of ${LEVELS.join(', ')}` });
    }
    patch.level = level;
  }

  const updated = await updateProfile(req.user!.id, patch);
  res.json({ user: publicUser(updated!) });
});

// ---- exercises ----

/**
 * GET /exercises?parts=chest,triceps&limit=6
 * Returns at most six exercises covering the requested body parts. Signed-in
 * callers get weights from their saved profile; bodyweight/level override it.
 */
app.get('/exercises', optionalAuth, (req, res) => {
  const raw = typeof req.query.parts === 'string' ? req.query.parts : '';
  const requested = raw
    .split(',')
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);

  if (requested.length === 0) {
    return res.status(400).json({ error: 'Pass at least one body part, e.g. /exercises?parts=chest,triceps' });
  }

  const unknown = requested.filter((p) => !isBodyPart(p));
  if (unknown.length > 0) {
    return res.status(400).json({ error: `Unknown body part: ${unknown.join(', ')}`, allowed: BODY_PARTS });
  }

  let limit = MAX_EXERCISES;
  if (req.query.limit !== undefined) {
    limit = Number(req.query.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_EXERCISES) {
      return res.status(400).json({ error: `limit must be a whole number between 1 and ${MAX_EXERCISES}` });
    }
  }

  let bodyweight: number | null = req.user?.profile.weightKg ?? null;
  if (req.query.bodyweight !== undefined) {
    bodyweight = Number(req.query.bodyweight);
    if (!Number.isFinite(bodyweight) || bodyweight < MIN_BODYWEIGHT || bodyweight > MAX_BODYWEIGHT) {
      return res.status(400).json({ error: `bodyweight must be between ${MIN_BODYWEIGHT} and ${MAX_BODYWEIGHT} kg` });
    }
  }

  let level: Level = req.user?.profile.level ?? 'beginner';
  if (req.query.level !== undefined) {
    const rawLevel = String(req.query.level).toLowerCase();
    if (!isLevel(rawLevel)) return res.status(400).json({ error: `level must be one of ${LEVELS.join(', ')}` });
    level = rawLevel;
  }

  const parts = requested as BodyPart[];
  const picked = selectExercises(parts, limit);
  const exercises = bodyweight === null ? picked : withLoads(picked, bodyweight, level);

  res.json({
    parts,
    count: exercises.length,
    ...(bodyweight === null
      ? {}
      : {
          level,
          bodyweightKg: bodyweight,
          disclaimer: 'Starting estimates from bodyweight and experience. Warm up and adjust — stop if form breaks down.',
        }),
    exercises,
  });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`GymTracker API listening on http://localhost:${port}`);
});
