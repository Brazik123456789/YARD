import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { EncryptedSessionStore } from '../../src/session-store.js';

test('encrypts and restores storage state without leaving cleartext on disk', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'yard-session-'));
  const file = path.join(directory, 'account.state.enc');
  try {
    const store = new EncryptedSessionStore(file, 'test-secret');
    await store.save({ cookies: [{ name: 'session', value: 'must-not-appear' }], origins: [] });
    assert.equal((await readFile(file, 'utf8')).includes('must-not-appear'), false);
    assert.deepEqual(await store.load(), { cookies: [{ name: 'session', value: 'must-not-appear' }], origins: [] });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
