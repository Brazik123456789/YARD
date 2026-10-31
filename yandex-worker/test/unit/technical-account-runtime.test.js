import test from 'node:test';
import assert from 'node:assert/strict';
import { AccountState } from '../../src/account-state.js';
import { AuthRequiredError } from '../../src/errors.js';
import { TechnicalAccountRuntime } from '../../src/technical-account-runtime.js';

test('moves an account to AUTH_REQUIRED when its connection check loses authentication', async () => {
  const runtime = new TechnicalAccountRuntime({ accountId: 'a', sessionDirectory: '/tmp', encryptionSecret: 'secret' });
  runtime.context = {};
  runtime.client = { checkConnection: async () => { throw new AuthRequiredError(); } };
  await assert.rejects(runtime.checkConnection(), AuthRequiredError);
  assert.equal(runtime.state, AccountState.AUTH_REQUIRED);
});

test('stops later operations after authentication loss', async () => {
  const runtime = new TechnicalAccountRuntime({ accountId: 'a', sessionDirectory: '/tmp', encryptionSecret: 'secret' });
  runtime.context = {};
  runtime.client = {};
  await assert.rejects(runtime.execute(async () => { throw new AuthRequiredError(); }), AuthRequiredError);
  await assert.rejects(runtime.execute(async () => 'must not run'), AuthRequiredError);
});
