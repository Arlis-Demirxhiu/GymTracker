import cors from 'cors';
import express from 'express';
import { BODY_PARTS, isBodyPart, type BodyPart } from './catalog.ts';
import { isLevel, LEVELS, MAX_BODYWEIGHT, MIN_BODYWEIGHT, withLoads, type Level } from './load.ts';
import { MAX_EXERCISES, selectExercises } from './select.ts';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/body-parts', (_req, res) => {
  res.json({ bodyParts: BODY_PARTS });
});

/**
 * GET /exercises?parts=chest,triceps&limit=6
 * Returns at most six exercises covering the requested body parts.
 */
app.get('/exercises', (req, res) => {
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

  // Weights are optional: without a bodyweight we simply suggest the movements.
  let bodyweight: number | null = null;
  if (req.query.bodyweight !== undefined) {
    bodyweight = Number(req.query.bodyweight);
    if (!Number.isFinite(bodyweight) || bodyweight < MIN_BODYWEIGHT || bodyweight > MAX_BODYWEIGHT) {
      return res.status(400).json({ error: `bodyweight must be between ${MIN_BODYWEIGHT} and ${MAX_BODYWEIGHT} kg` });
    }
  }

  let level: Level = 'beginner';
  if (req.query.level !== undefined) {
    const raw = String(req.query.level).toLowerCase();
    if (!isLevel(raw)) return res.status(400).json({ error: `level must be one of ${LEVELS.join(', ')}` });
    level = raw;
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
