import cors from 'cors';
import express from 'express';
import { BODY_PARTS, isBodyPart, type BodyPart } from './catalog.ts';
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

  const parts = requested as BodyPart[];
  const exercises = selectExercises(parts, limit);
  res.json({ parts, count: exercises.length, exercises });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`GymTracker API listening on http://localhost:${port}`);
});
