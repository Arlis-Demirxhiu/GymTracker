import { CATALOG, type BodyPart, type CatalogExercise, type Gear } from './catalog.ts';

/** A session should stay short: never suggest more than this. */
export const MAX_EXERCISES = 6;

/** True when everything the exercise needs is in `available` (undefined = a full gym). */
export const canDo = (exercise: CatalogExercise, available?: readonly Gear[]) =>
  !available || exercise.requires.every((gear) => available.includes(gear));

/** Requested parts that nothing in `available` can train. */
export const uncoveredParts = (parts: BodyPart[], available?: readonly Gear[]): BodyPart[] =>
  [...new Set(parts)].filter((part) => !CATALOG.some((x) => x.bodyPart === part && canDo(x, available)));

/**
 * Picks up to `limit` exercises covering the requested body parts, using only
 * exercises the lifter has the kit for.
 *
 * Parts take turns, least-covered first, so two parts get three exercises
 * each rather than six for whichever was listed first. An exercise that also
 * hits another requested part counts as half a turn for it, which nudges the
 * picks towards lifts that pull double duty.
 */
export function selectExercises(
  parts: BodyPart[],
  limit: number = MAX_EXERCISES,
  available?: readonly Gear[],
): CatalogExercise[] {
  const cap = Math.min(Math.max(1, Math.floor(limit)), MAX_EXERCISES);
  const wanted = [...new Set(parts)];
  if (wanted.length === 0) return [];

  // Compound lifts first within each part; catalog order breaks ties.
  const pools = new Map<BodyPart, CatalogExercise[]>(
    wanted.map((p) => [
      p,
      CATALOG.filter((x) => x.bodyPart === p && canDo(x, available)).sort(
        (a, b) => Number(b.compound) - Number(a.compound),
      ),
    ]),
  );
  const coverage = new Map<BodyPart, number>(wanted.map((p) => [p, 0]));
  const picked: CatalogExercise[] = [];

  while (picked.length < cap) {
    const next = wanted
      .filter((p) => (pools.get(p)?.length ?? 0) > 0)
      .sort((a, b) => coverage.get(a)! - coverage.get(b)! || wanted.indexOf(a) - wanted.indexOf(b))[0];
    if (!next) break; // nothing left that this kit can do

    const exercise = pools.get(next)!.shift()!;
    if (picked.some((p) => p.id === exercise.id)) continue;

    picked.push(exercise);
    coverage.set(next, coverage.get(next)! + 1);
    for (const secondary of exercise.also) {
      if (coverage.has(secondary)) coverage.set(secondary, coverage.get(secondary)! + 0.5);
    }
  }

  // Heavy compound work belongs at the start of a session.
  return picked.sort((a, b) => Number(b.compound) - Number(a.compound));
}
