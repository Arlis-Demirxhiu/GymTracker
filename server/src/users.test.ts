process.env.DATA_FILE = new URL('../data/test-db.json', import.meta.url).pathname;

import assert from 'node:assert/strict';
import { readFile, rm } from 'node:fs/promises';
import { after, beforeEach, test } from 'node:test';
import {
  createUser,
  findByEmail,
  hashPassword,
  isEmail,
  issueToken,
  normaliseEmail,
  publicUser,
  resetCache,
  revokeToken,
  updateProfile,
  userForToken,
  verifyPassword,
} from './users.ts';

const DB = process.env.DATA_FILE!;

beforeEach(async () => {
  await rm(DB, { force: true });
  resetCache();
});

after(async () => {
  await rm(DB, { force: true });
});

test('stores a password as a salted scrypt hash, never in the clear', async () => {
  const hash = await hashPassword('correct horse battery');
  assert.ok(hash.startsWith('scrypt$'));
  assert.ok(!hash.includes('correct horse battery'));
  assert.ok(await verifyPassword('correct horse battery', hash));
  assert.ok(!(await verifyPassword('wrong password', hash)));
});

test('salts differ, so the same password hashes differently', async () => {
  assert.notEqual(await hashPassword('same-password'), await hashPassword('same-password'));
});

test('rejects a malformed stored hash instead of throwing', async () => {
  assert.equal(await verifyPassword('anything', 'not-a-hash'), false);
  assert.equal(await verifyPassword('anything', ''), false);
});

test('emails are matched case-insensitively', async () => {
  await createUser('Lifter@Example.com', 'hunter2hunter2');
  assert.ok(await findByEmail('lifter@example.com'));
  assert.ok(await findByEmail('  LIFTER@EXAMPLE.COM '));
  assert.equal(normaliseEmail(' A@B.co '), 'a@b.co');
});

test('a new account starts with an empty profile', async () => {
  const user = await createUser('new@example.com', 'hunter2hunter2');
  assert.deepEqual(user.profile, { heightCm: null, weightKg: null, level: 'beginner' });
});

test('the public view never carries the password hash', async () => {
  const user = await createUser('safe@example.com', 'hunter2hunter2');
  assert.ok(!('passwordHash' in publicUser(user)));
  assert.equal(publicUser(user).email, 'safe@example.com');
});

test('a token resolves to its user and stops working once revoked', async () => {
  const user = await createUser('token@example.com', 'hunter2hunter2');
  const token = await issueToken(user.id);
  assert.equal((await userForToken(token))?.id, user.id);

  await revokeToken(token);
  assert.equal(await userForToken(token), undefined);
});

test('an unknown token resolves to nobody', async () => {
  assert.equal(await userForToken('made-up'), undefined);
});

test('profile updates persist across a reload from disk', async () => {
  const user = await createUser('persist@example.com', 'hunter2hunter2');
  await updateProfile(user.id, { heightCm: 178, weightKg: 82, level: 'intermediate' });

  resetCache(); // force a fresh read of the file
  const reloaded = await findByEmail('persist@example.com');
  assert.deepEqual(reloaded?.profile, { heightCm: 178, weightKg: 82, level: 'intermediate' });
});

test('writes to the file named by DATA_FILE, not the real database', async () => {
  await createUser('isolated@example.com', 'hunter2hunter2');
  const written = JSON.parse(await readFile(DB, 'utf8')) as { users: { email: string }[] };
  assert.ok(written.users.some((u) => u.email === 'isolated@example.com'));

  const real = new URL('../data/db.json', import.meta.url).pathname;
  const contents = await readFile(real, 'utf8').catch(() => '');
  assert.ok(!contents.includes('isolated@example.com'), 'tests must not touch the real database');
});

test('accepts obvious addresses and rejects obvious rubbish', () => {
  assert.ok(isEmail('a@b.co'));
  assert.ok(!isEmail('no-at-sign'));
  assert.ok(!isEmail('two@@at.com'));
  assert.ok(!isEmail('spaces in@email.com'));
});
