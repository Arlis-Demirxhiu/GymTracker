import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CATALOG } from './catalog.ts';
import { HOW_TO, videoUrl } from './howto.ts';

test('every exercise in the catalog has setup notes and form steps', () => {
  for (const exercise of CATALOG) {
    const howTo = HOW_TO[exercise.id];
    assert.ok(howTo, `${exercise.id} has no how-to`);
    assert.ok(howTo.setup.length > 0, `${exercise.id} has no setup`);
    assert.ok(howTo.steps.length >= 2, `${exercise.id} needs at least two steps`);
  }
});

test('no how-to is left over for an exercise that no longer exists', () => {
  const ids = new Set(CATALOG.map((e) => e.id));
  for (const id of Object.keys(HOW_TO)) assert.ok(ids.has(id), `${id} is not in the catalog`);
});

test('machine exercises say which machine to use', () => {
  for (const exercise of CATALOG.filter((e) => e.requires.includes('machine') || e.requires.includes('cable'))) {
    assert.match(HOW_TO[exercise.id].setup, /machine|cable|station|sled/i, `${exercise.id} should name its machine`);
  }
});

test('the video link is a YouTube search for the exercise', () => {
  const url = new URL(videoUrl('Barbell Bench Press'));
  assert.equal(url.hostname, 'www.youtube.com');
  assert.match(url.searchParams.get('search_query') ?? '', /^Barbell Bench Press /);
});
