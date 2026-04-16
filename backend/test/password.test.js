import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../src/security/password.js';

test('hashPassword produces a derived hash format', async () => {
  const hash = await hashPassword('secret123');
  assert.ok(hash.startsWith('scrypt$'));
  assert.notEqual(hash, 'secret123');
});

test('verifyPassword matches scrypt hashes', async () => {
  const hash = await hashPassword('secret123');
  const ok = await verifyPassword('secret123', hash);
  const bad = await verifyPassword('wrong-pass', hash);

  assert.equal(ok, true);
  assert.equal(bad, false);
});

test('verifyPassword supports legacy plain-text values', async () => {
  const ok = await verifyPassword('legacy-pass', 'legacy-pass');
  const bad = await verifyPassword('different', 'legacy-pass');

  assert.equal(ok, true);
  assert.equal(bad, false);
});
