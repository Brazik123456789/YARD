import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { TechnicalAccountRuntime } from '../../src/technical-account-runtime.js';

test('real APIRequestContext reads two locations without UI switching', { skip: process.env.YANDEX_MANUAL_TESTS !== 'true' }, async () => {
  assert.ok(process.env.YANDEX_SESSION_STATE_ENCRYPTION_KEY, 'Set YANDEX_SESSION_STATE_ENCRYPTION_KEY');
  assert.ok(process.env.YANDEX_MANUAL_LOCATION_A, 'Set YANDEX_MANUAL_LOCATION_A');
  assert.ok(process.env.YANDEX_MANUAL_LOCATION_B, 'Set YANDEX_MANUAL_LOCATION_B');
  const runtime = new TechnicalAccountRuntime({
    accountId: process.env.YANDEX_MANUAL_ACCOUNT ?? 'yandex-agent-01',
    sessionDirectory: path.resolve(process.env.YANDEX_SESSION_STATE_DIR ?? 'runtime/yandex-sessions'),
    encryptionSecret: process.env.YANDEX_SESSION_STATE_ENCRYPTION_KEY
  });
  try {
    await runtime.start({ headless: true });
    await runtime.checkConnection();
    const organizations = await runtime.execute(() => runtime.client.discoverOrganizations());
    const firstPage = await runtime.execute(() => runtime.client.listReviews({ locationId: process.env.YANDEX_MANUAL_LOCATION_A, page: 1 }));
    const secondPage = await runtime.execute(() => runtime.client.listReviews({ locationId: process.env.YANDEX_MANUAL_LOCATION_A, page: 2 }));
    const otherLocation = await runtime.execute(() => runtime.client.listReviews({ locationId: process.env.YANDEX_MANUAL_LOCATION_B, page: 1 }));
    assert.ok(organizations.length >= 1);
    assert.ok(firstPage.pager.total > firstPage.pager.limit, 'Location A must have enough reviews to verify pagination');
    assert.ok(firstPage.pager.limit >= 1);
    assert.notEqual(secondPage.pager.offset, firstPage.pager.offset);
    assert.ok(otherLocation.pager.total >= 0);
  } finally {
    await runtime.stop();
  }
});
