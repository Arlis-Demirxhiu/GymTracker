import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BODY_PARTS } from './catalog.ts';
import { MAX_EXERCISES, selectExercises, uncoveredParts } from './select.ts';

test('never returns more than six exercises', () => {
  const all = selectExercises(['chest', 'back', 'shoulders', 'biceps', 'triceps', 'abs', 'quads']);
  assert.equal(all.length, MAX_EXERCISES);
});

test('splits the session evenly between requested parts', () => {
  const picked = selectExercises(['chest', 'back']);
  assert.equal(picked.length, 6);
  assert.equal(picked.filter((e) => e.bodyPart === 'chest').length, 3);
  assert.equal(picked.filter((e) => e.bodyPart === 'back').length, 3);
});

test('covers every requested part when parts outnumber slots is not possible', () => {
  const parts = ['chest', 'back', 'quads', 'abs'] as const;
  const picked = selectExercises([...parts]);
  for (const part of parts) {
    assert.ok(
      picked.some((e) => e.bodyPart === part),
      `expected an exercise for ${part}`,
    );
  }
});

test('leads with compound lifts', () => {
  const picked = selectExercises(['quads']);
  assert.equal(picked[0].compound, true);
  const lastCompound = picked.findLastIndex((e) => e.compound);
  const firstIsolation = picked.findIndex((e) => !e.compound);
  if (firstIsolation !== -1) assert.ok(lastCompound < firstIsolation);
});

test('honours a smaller limit and ignores duplicates in the request', () => {
  assert.equal(selectExercises(['abs'], 2).length, 2);
  assert.equal(selectExercises(['abs', 'abs'], 3).length, 3);
});

test('clamps a limit above the maximum', () => {
  assert.equal(selectExercises(['chest'], 99).length, MAX_EXERCISES);
});

test('returns nothing for an empty request', () => {
  assert.deepEqual(selectExercises([]), []);
});

test('runs out gracefully when the catalog is smaller than the limit', () => {
  const picked = selectExercises(['cardio'], 6);
  assert.ok(picked.length <= 6);
  assert.ok(picked.every((e) => e.bodyPart === 'cardio'));
});

// ---- equipment ----

test('only suggests exercises the lifter has the kit for', () => {
  const picked = selectExercises(['chest', 'back', 'quads', 'shoulders'], 6, ['dumbbell']);
  assert.ok(picked.length > 0);
  for (const exercise of picked) {
    assert.ok(
      exercise.requires.every((g) => g === 'dumbbell'),
      `${exercise.id} needs ${exercise.requires.join(', ')}`,
    );
  }
});

test('a bench unlocks bench exercises, which a dumbbell-only home misses', () => {
  const without = selectExercises(['chest'], 6, ['dumbbell']).map((e) => e.id);
  const withBench = selectExercises(['chest'], 6, ['dumbbell', 'bench']).map((e) => e.id);
  assert.ok(!without.includes('incline-db-press'));
  assert.ok(withBench.includes('incline-db-press'));
});

test('bodyweight only still trains everything except biceps and forearms', () => {
  const everything = [...BODY_PARTS];
  assert.deepEqual(uncoveredParts(everything, []), ['biceps', 'forearms']);
  for (const exercise of selectExercises(['chest', 'quads', 'abs'], 6, [])) {
    assert.deepEqual(exercise.requires, []);
  }
});

test('a set of dumbbells is enough to cover every muscle', () => {
  assert.deepEqual(uncoveredParts([...BODY_PARTS], ['dumbbell']), []);
});

test('does not pad a short session with exercises you cannot do', () => {
  const picked = selectExercises(['biceps'], 6, []);
  assert.equal(picked.length, 0);
});

test('with no equipment filter the full gym is used, classic lifts first', () => {
  assert.equal(selectExercises(['chest'])[0].id, 'bench-press');
  assert.deepEqual(uncoveredParts([...BODY_PARTS]), []);
});
