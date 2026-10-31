import test from 'node:test';
import assert from 'node:assert/strict';
import { extractReplyTokens, normalizeCompany, normalizeLocation, normalizeReviewPage } from '../../src/yandex-mappers.js';

test('normalizes company and keeps internal, permanent, and chain IDs distinct', () => {
  assert.deepEqual(normalizeCompany({ type: 'chain', id: 297, permanent_id: 297, tycoon_id: 282, name: 'Yard', object_role: 'delegate', noAccess: false }), {
    objectType: 'chain', internalProviderId: '297', permanentId: '297', chainId: '282', name: 'Yard', role: 'delegate', access: true
  });
  assert.deepEqual(normalizeLocation({ id: 218, permanent_id: 116, name: 'Ufa', address: { formatted: 'Street 1' } }, '282'), {
    provider: 'YANDEX', externalLocationId: '116', internalProviderId: '218', name: 'Ufa', address: 'Street 1', networkChainId: '282', status: undefined
  });
});

test('maps pager, owner reply, unread state, and hides CSRF values', () => {
  const result = normalizeReviewPage({ list: { pager: { limit: 20, offset: 20, total: 41 }, csrf_token: 'secret', items: [{ id: 'r-1', object: { id: '/sprav/116' }, rating: 4, full_text: 'Text', time_created: 1, author: { user: 'Name', public_id: 'p' }, notify_status: 'unread', business_answer_csrf_token: 'secret', owner_comment: { text: 'Reply', moderation_status: 'in_progress', time_created: 2 } }] } });
  assert.equal(result.pager.total, 41);
  assert.equal(result.reviews[0].locationExternalId, '116');
  assert.equal(result.reviews[0].ownerReply.moderationStatus, 'in_progress');
  assert.equal(result.reviews[0].unread, true);
  assert.equal(JSON.stringify(result).includes('secret'), false);
});

test('extracts fresh write tokens only from a matching review', () => {
  assert.deepEqual(extractReplyTokens({ list: { csrf_token: 'reviews', items: [{ id: 'r-1', business_answer_csrf_token: 'answer' }] } }, 'r-1'), { reviewsCsrfToken: 'reviews', answerCsrfToken: 'answer' });
  assert.throws(() => extractReplyTokens({ list: { csrf_token: 'reviews', items: [] } }, 'missing'));
});
