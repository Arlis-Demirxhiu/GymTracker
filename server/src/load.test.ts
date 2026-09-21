import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CATALOG } from './catalog.ts';
import { LEVELS, suggestLoad } from './load.ts';

const byId = (id: string) => CATALOG.find((e) => e.id === id)!;

test('scales a barbell lift with bodyweight', () => {
  const bench = byId('bench-press').load; // 0.55 of bodyweight
  assert.equal(suggestLoad(bench, 80, 'beginner').kg, 45); // 44 rounded to the nearest 2.5
  assert.equal(suggestLoad(bench, 100, 'beginner').kg, 55);
});

test('experience raises the estimate', () => {
  const squat = byId('back-squat').load;
  const beginner = suggestLoad(squat, 80, 'beginner').kg!;
  const intermediate = suggestLoad(squat, 80, 'intermediate').kg!;
  const advanced = suggestLoad(squat, 80, 'advanced').kg!;
  assert.ok(beginner < intermediate && intermediate < advanced);
});

test('never suggests less than an empty barbell', () => {
  const bench = byId('bench-press').load;
  assert.equal(suggestLoad(bench, 30, 'beginner').kg, 20);
});

test('dumbbell loads are per hand and labelled as a pair', () => {
  const curl = suggestLoad(byId('hammer-curl').load, 80, 'beginner');
  assert.equal(curl.perHand, true);
  assert.equal(curl.label, `2 × ${curl.kg} kg`);
});

test('bodyweight and cardio moves carry no weight', () => {
  assert.deepEqual(suggestLoad(byId('pull-up').load, 80, 'beginner'), {
    kg: null,
    perHand: false,
    label: 'Bodyweight',
  });
  assert.equal(suggestLoad(byId('row-erg').load, 80, 'advanced').kg, null);
});

test('every weighted suggestion lands on a loadable increment', () => {
  for (const exercise of CATALOG) {
    for (const level of LEVELS) {
      const { kg } = suggestLoad(exercise.load, 83, level);
      if (kg === null) continue;
      const step = exercise.load.kind === 'dumbbell' ? 2 : 2.5;
      const onStep = Math.abs(kg / step - Math.round(kg / step)) < 1e-9;
      // A floor like a 5 kg minimum may sit off the step; anything above it must not.
      const atFloor = kg === (exercise.load.kind !== 'bodyweight' && exercise.load.kind !== 'none' ? exercise.load.min : undefined);
      assert.ok(onStep || atFloor, `${exercise.id} at ${level}: ${kg} kg is not loadable`);
    }
  }
});

test('nobody is told to squat an absurd weight', () => {
  for (const exercise of CATALOG) {
    const { kg } = suggestLoad(exercise.load, 120, 'advanced');
    if (kg === null) continue;
    assert.ok(kg <= 120 * 2.5, `${exercise.id}: ${kg} kg looks too heavy`);
  }
});
