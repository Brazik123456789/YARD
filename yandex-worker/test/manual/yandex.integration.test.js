import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { TechnicalAccountRuntime } from '../../src/technical-account-runtime.js';

test('real APIRequestContext discovers branches then reads two locations without UI switching', { skip: process.env.YANDEX_MANUAL_TESTS !== 'true' }, async () => {
  assert.ok(process.env.YANDEX_SESSION_STATE_ENCRYPTION_KEY, 'Set YANDEX_SESSION_STATE_ENCRYPTION_KEY');
  assert.ok(process.env.YANDEX_MANUAL_CHAIN_ID, 'Set YANDEX_MANUAL_CHAIN_ID');
  assert.ok(process.env.YANDEX_MANUAL_CHAIN_PERMALINK, 'Set YANDEX_MANUAL_CHAIN_PERMALINK');
  const runtime = new TechnicalAccountRuntime({
    accountId: process.env.YANDEX_MANUAL_ACCOUNT ?? 'yandex-agent-01',
    sessionDirectory: path.resolve(process.env.YANDEX_SESSION_STATE_DIR ?? 'runtime/yandex-sessions'),
    encryptionSecret: process.env.YANDEX_SESSION_STATE_ENCRYPTION_KEY
  });
  try {
    await runtime.start({ headless: true });
    await runtime.checkConnection();
    const organizations = await runtime.execute(() => runtime.client.discoverOrganizations());
    const chain = organizations.find((organization) => organization.chainId === process.env.YANDEX_MANUAL_CHAIN_ID || organization.permanentId === process.env.YANDEX_MANUAL_CHAIN_PERMALINK);
    assert.ok(chain, 'Organization discovery must contain the approved chain');
    const branches = await runtime.execute(() => runtime.client.discoverLocations({
      chainId: process.env.YANDEX_MANUAL_CHAIN_ID,
      chainPermalink: process.env.YANDEX_MANUAL_CHAIN_PERMALINK
    }));
    assert.ok(branches.locations.length >= 2, 'The approved chain must expose two branches');
    const [first, second] = branches.locations;
    const firstPage = await runtime.execute(() => runtime.client.listReviews({ locationId: first.externalLocationId, page: 1 }));
    const secondPage = await runtime.execute(() => runtime.client.listReviews({ locationId: first.externalLocationId, page: 2 }));
    const otherLocation = await runtime.execute(() => runtime.client.listReviews({ locationId: second.externalLocationId, page: 1 }));
    assert.ok(organizations.length >= 1);
    assert.ok(firstPage.pager.total > firstPage.pager.limit, 'Location A must have enough reviews to verify pagination');
    assert.ok(firstPage.pager.limit >= 1);
    assert.notEqual(secondPage.pager.offset, firstPage.pager.offset);
    assert.ok(otherLocation.pager.total >= 0);
  } finally {
    await runtime.stop();
  }
});

test('a new runtime restores saved session state before repeating an authenticated read', { skip: process.env.YANDEX_MANUAL_TESTS !== 'true' }, async () => {
  assert.ok(process.env.YANDEX_SESSION_STATE_ENCRYPTION_KEY, 'Set YANDEX_SESSION_STATE_ENCRYPTION_KEY');
  const options = {
    accountId: process.env.YANDEX_MANUAL_ACCOUNT ?? 'yandex-agent-01',
    sessionDirectory: path.resolve(process.env.YANDEX_SESSION_STATE_DIR ?? 'runtime/yandex-sessions'),
    encryptionSecret: process.env.YANDEX_SESSION_STATE_ENCRYPTION_KEY
  };
  const initial = new TechnicalAccountRuntime(options);
  try {
    await initial.start({ headless: true });
    await initial.checkConnection();
  } finally {
    await initial.stop();
  }

  const restored = new TechnicalAccountRuntime(options);
  try {
    await restored.start({ headless: true });
    await restored.checkConnection();
    assert.ok((await restored.execute(() => restored.client.discoverOrganizations())).length >= 1);
  } finally {
    await restored.stop();
  }
});

test('controlled reply is separately gated and reconciles provider state', { skip: process.env.YANDEX_MANUAL_TESTS !== 'true' || process.env.YANDEX_CONTROLLED_WRITE_APPROVED !== 'true' }, async () => {
  assert.ok(process.env.YANDEX_MANUAL_LOCATION_ID, 'Set YANDEX_MANUAL_LOCATION_ID');
  assert.ok(process.env.YANDEX_MANUAL_REVIEW_ID, 'Set YANDEX_MANUAL_REVIEW_ID');
  assert.ok(process.env.YANDEX_MANUAL_REPLY_TEXT, 'Set YANDEX_MANUAL_REPLY_TEXT');
  assert.ok(process.env.YANDEX_MANUAL_REVIEW_PAGE, 'Set YANDEX_MANUAL_REVIEW_PAGE');
  const runtime = new TechnicalAccountRuntime({
    accountId: process.env.YANDEX_MANUAL_ACCOUNT ?? 'yandex-agent-01',
    sessionDirectory: path.resolve(process.env.YANDEX_SESSION_STATE_DIR ?? 'runtime/yandex-sessions'),
    encryptionSecret: process.env.YANDEX_SESSION_STATE_ENCRYPTION_KEY
  });
  try {
    await runtime.start({ headless: false });
    assert.equal(await runtime.refreshWriteRequestState(), true, 'The authenticated Yandex Business page must expose fresh in-memory request state');
    const result = await runtime.execute(() => runtime.client.writeReply({
      locationId: process.env.YANDEX_MANUAL_LOCATION_ID,
      reviewId: process.env.YANDEX_MANUAL_REVIEW_ID,
      text: process.env.YANDEX_MANUAL_REPLY_TEXT,
      page: Number(process.env.YANDEX_MANUAL_REVIEW_PAGE)
    }));
    assert.notEqual(result.outcome, 'NOT_CONFIRMED');
  } finally {
    await runtime.stop();
  }
});
