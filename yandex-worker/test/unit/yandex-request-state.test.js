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
  capture.dispose();
});
