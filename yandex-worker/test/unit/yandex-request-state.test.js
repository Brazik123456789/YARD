import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { YandexRequestStateCapture } from '../../src/yandex-request-state.js';

test('captures current request headers only from an authenticated Yandex Business API request', () => {
  const context = new EventEmitter();
  const capture = new YandexRequestStateCapture(context);
  context.emit('request', {
    url: () => 'https://yandex.ru/sprav/api/116/reviews?page=1',
    headers: () => ({ 'x-csrf-token': 'request-token', 'x-yandex-icookie': 'icookie' })
  });
  assert.deepEqual(capture.getWriteHeaders(), { 'x-csrf-token': 'request-token', 'X-Yandex-ICookie': 'icookie' });
  capture.dispose();
});

test('does not capture headers from other origins or partial requests', () => {
  const context = new EventEmitter();
  const capture = new YandexRequestStateCapture(context);
  context.emit('request', { url: () => 'https://example.test/sprav/api/116/reviews', headers: () => ({ 'x-csrf-token': 'token', 'x-yandex-icookie': 'cookie' }) });
  context.emit('request', { url: () => 'https://yandex.ru/sprav/api/116/reviews', headers: () => ({ 'x-csrf-token': 'token' }) });
  assert.equal(capture.getWriteHeaders(), undefined);
  assert.deepEqual(capture.getDiagnostic(), {
    yandexBusinessApiRequestObserved: true,
    requestCsrfTokenObserved: true,
    yandexICookieObserved: false,
    bothRequiredHeadersObserved: false
  });
  capture.dispose();
});

test('redacted diagnostic never exposes captured request header values', () => {
  const context = new EventEmitter();
  const capture = new YandexRequestStateCapture(context);
  context.emit('request', {
    url: () => 'https://yandex.ru/sprav/api/116/reviews?page=1',
    headers: () => ({ 'x-csrf-token': 'must-not-appear', 'x-yandex-icookie': 'must-not-appear' })
  });
  assert.equal(JSON.stringify(capture.getDiagnostic()).includes('must-not-appear'), false);
  capture.dispose();
});

test('diagnostic records presence without retaining write headers', async () => {
  const context = new EventEmitter();
  context.pages = () => [];
  context.newPage = async () => ({
    goto: async () => context.emit('request', {
      url: () => 'https://yandex.ru/sprav/api/116/reviews?page=1',
      headers: () => ({ 'x-csrf-token': 'must-not-retain', 'x-yandex-icookie': 'must-not-retain' })
    })
  });
  const capture = new YandexRequestStateCapture(context);
  assert.deepEqual(await capture.diagnose({ timeoutMs: 10 }), {
    yandexBusinessApiRequestObserved: true,
    requestCsrfTokenObserved: true,
    yandexICookieObserved: true,
    bothRequiredHeadersObserved: true
  });
  assert.equal(capture.getWriteHeaders(), undefined);
  capture.dispose();
});
