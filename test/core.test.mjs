import test from 'node:test';
import assert from 'node:assert/strict';
import { browserFetch } from '../browser/app.js';

test('pypistats is skipped instantly with a non-retryable status (no CORS support)', async () => {
    await assert.rejects(() => browserFetch('https://pypistats.org/api/packages/requests/recent'), (e) => e.status === 451 && /CORS/.test(e.message));
});

test('user-agent header is dropped before fetch (forbidden in browsers)', async () => {
    let seen;
    globalThis.fetch = async (_u, init) => { seen = init; return new Response('{}'); };
    await browserFetch('https://registry.npmjs.org/x', { headers: { 'user-agent': 'x', accept: 'application/json' } });
    assert.deepEqual(seen.headers, { accept: 'application/json' });
});
