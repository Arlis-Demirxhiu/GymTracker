import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MAX_EXERCISES, selectExercises } from './select.ts';

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
