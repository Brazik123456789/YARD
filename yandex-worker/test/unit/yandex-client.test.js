import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthRequiredError, UnknownResultError } from '../../src/errors.js';
import { YandexBusinessClient } from '../../src/yandex-client.js';

function response({ status = 200, json = {}, contentType = 'application/json' } = {}) {
  return { ok: () => status >= 200 && status < 300, status: () => status, headers: () => ({ 'content-type': contentType }), json: async () => json };
}

test('maps authorization failure to AUTH_REQUIRED', async () => {
  const client = new YandexBusinessClient({ get: async () => response({ status: 401 }) });
  await assert.rejects(client.checkConnection(), AuthRequiredError);
});

test('uses the observed pagination query and normalizes the response', async () => {
  let requested;
  const client = new YandexBusinessClient({ get: async (url) => { requested = url; return response({ json: { list: { pager: { limit: 20, offset: 20, total: 50 }, items: [] } } }); } });
  const result = await client.listReviews({ locationId: '116', page: 2, ranking: 'by_time' });
  assert.match(requested, /\/sprav\/api\/116\/reviews\?page=2&ranking=by_time/);
  assert.equal(result.pager.offset, 20);
});

test('maps an unexpected reviews response to PROVIDER_CONTRACT_CHANGED', async () => {
  const client = new YandexBusinessClient({ get: async () => response({ json: { list: { items: [] } } }) });
  await assert.rejects(
    client.listReviews({ locationId: '116' }),
    (error) => error.category === 'PROVIDER_CONTRACT_CHANGED'
  );
});

test('maps a missing fresh review token to CSRF_INVALID without posting', async () => {
  const payload = { list: { csrf_token: 'reviews', pager: { limit: 20, offset: 0, total: 1 }, items: [{ id: 'r-1', object: { id: '/sprav/116' } }] } };
  const client = new YandexBusinessClient({
    get: async () => response({ json: payload }),
    post: async () => assert.fail('must not post')
  }, { requestHeadersProvider: () => ({ 'x-csrf-token': 'request', 'X-Yandex-ICookie': 'cookie' }) });
  await assert.rejects(
    client.writeReply({ locationId: '116', reviewId: 'r-1', text: 'Thanks', page: 1 }),
    (error) => error.category === 'CSRF_INVALID'
  );
});

test('keeps a controlled write disabled when BrowserContext request state is unavailable', async () => {
  const payload = { list: { csrf_token: 'reviews', pager: { limit: 20, offset: 0, total: 1 }, items: [{ id: 'r-1', object: { id: '/sprav/116' }, business_answer_csrf_token: 'answer' }] } };
  const client = new YandexBusinessClient({
    get: async () => response({ json: payload }),
    post: async () => assert.fail('must not post')
  });
  await assert.rejects(
    client.writeReply({ locationId: '116', reviewId: 'r-1', text: 'Thanks', page: 1 }),
    (error) => error.category === 'CSRF_INVALID'
  );
});

test('maps an observed CSRF rejection status to CSRF_INVALID', async () => {
  const client = new YandexBusinessClient({ get: async () => response({ status: 488 }) });
  await assert.rejects(client.checkConnection(), (error) => error.category === 'CSRF_INVALID');
});

test('reconciles an unknown write outcome without retrying the POST', async () => {
  let getCalls = 0;
  let postCalls = 0;
  const payload = (hasReply) => ({ list: { csrf_token: 'reviews', pager: { limit: 20, offset: 0, total: 1 }, items: [{ id: 'r-1', object: { id: '/sprav/116' }, business_answer_csrf_token: 'answer', ...(hasReply ? { owner_comment: { text: 'Thanks', moderation_status: 'in_progress' } } : {}) }] } });
  const client = new YandexBusinessClient({
    get: async () => response({ json: payload(getCalls++ > 0) }),
    post: async () => { postCalls += 1; throw new Error('socket timeout'); }
  }, { requestHeadersProvider: () => ({ 'x-csrf-token': 'request', 'X-Yandex-ICookie': 'cookie' }) });
  const result = await client.writeReply({ locationId: '116', reviewId: 'r-1', text: 'Thanks', page: 3 });
  assert.equal(result.outcome, 'RECONCILED_AFTER_UNKNOWN_RESULT');
  assert.equal(postCalls, 1);
  assert.equal(getCalls, 2);
});

test('reports unknown when reconciliation cannot confirm the reply', async () => {
  const payload = { list: { csrf_token: 'reviews', pager: { limit: 20, offset: 0, total: 1 }, items: [{ id: 'r-1', object: { id: '/sprav/116' }, business_answer_csrf_token: 'answer' }] } };
  const client = new YandexBusinessClient({ get: async () => response({ json: payload }), post: async () => { throw new Error('timeout'); } }, { requestHeadersProvider: () => ({ 'x-csrf-token': 'request', 'X-Yandex-ICookie': 'cookie' }) });
  await assert.rejects(client.writeReply({ locationId: '116', reviewId: 'r-1', text: 'Thanks', page: 1 }), UnknownResultError);
});

test('refuses a reply whose refreshed review belongs to another location', async () => {
  const payload = { list: { csrf_token: 'reviews', pager: { limit: 20, offset: 0, total: 1 }, items: [{ id: 'r-1', object: { id: '/sprav/579' }, business_answer_csrf_token: 'answer' }] } };
  const client = new YandexBusinessClient({ get: async () => response({ json: payload }), post: async () => assert.fail('must not post') }, { requestHeadersProvider: () => ({ 'x-csrf-token': 'request', 'X-Yandex-ICookie': 'cookie' }) });
  await assert.rejects(client.writeReply({ locationId: '116', reviewId: 'r-1', text: 'Thanks', page: 1 }), (error) => error.category === 'LOCATION_MISMATCH');
});

test('requires an explicit review page and never assumes the first page for a controlled write', async () => {
  const client = new YandexBusinessClient({ get: async () => assert.fail('must not read') });
  await assert.rejects(
    client.writeReply({ locationId: '116', reviewId: 'r-1', text: 'Thanks' }),
    (error) => error.category === 'PROVIDER_CONTRACT_CHANGED'
  );
});
