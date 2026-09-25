import assert from 'node:assert/strict';
import test from 'node:test';
import { parseAppManifest } from '@mhoo/shell';
import { BASE, MANIFEST, handleAppRequest } from '../worker/app.js';

const env = {
  DEPLOYMENT_ENV: 'staging', ACCESS_TEAM_DOMAIN: 'example.cloudflareaccess.com', ACCESS_AUD: 'shared-aud',
  ALLOWED_EMAILS: 'Owner@Example.com',
  ASSETS: { fetch: async () => new Response('<html>finance</html>', { headers: { 'content-type': 'text/html' } }) },
};
const as = (email) => ({ verify: async () => ({ subject: 'u1', email }) });
const get = (path, deps = {}, e = env) => handleAppRequest(new Request(`https://mhoo.dev${path}`), e, deps);

test('publishes a manifest Shell accepts', async () => {
  const response = await get('/.well-known/mhoo-app.json', { verify: async () => { throw new Error('must not verify'); } });
  assert.equal(response.status, 200);
  assert.equal(parseAppManifest(await response.text()).apps[0].route, MANIFEST.apps[0].route);
});

test('serves pages only under the base path and only to allowed people', async () => {
  assert.equal((await get(BASE)).status, 302);
  assert.equal((await get('/somewhere-else', as('owner@example.com'))).status, 404);
  assert.equal((await get(`${BASE}/`, as('owner@example.com'))).status, 200);
  assert.equal((await get(`${BASE}/`, as('stranger@example.com'))).status, 401);
  assert.equal((await get(`${BASE}/`, { verify: async () => { throw new Error('no token'); } })).status, 401);
});

// A fully configured env so requests reach route dispatch; records every DB and provider call.
function configured() {
  const calls = { db: [], plaid: [], assets: 0 };
  const DB = {
    prepare: (sql) => ({ bind: (...values) => {
      calls.db.push({ sql, values });
      const rows = /FROM plaid_items/.test(sql)
        ? [{ item_id: 'item-1', institution_name: 'Test Bank', status: 'CONNECTED', last_synced_at: null }]
        : [{ account_id: 'acct-1', name: 'Card', mask: '1234', type: 'credit', subtype: null, currency: 'USD' }];
      return { all: async () => ({ results: rows }), first: async () => rows[0], run: async () => ({}) };
    } }),
  };
  const e = {
    ...env, DB, EVIDENCE: {}, PLAID_ENV: 'sandbox', PLAID_CLIENT_ID: 'c', PLAID_SECRET: 's', PLAID_TOKEN_KEY: 'ab'.repeat(32),
    ASSETS: { fetch: async () => { calls.assets += 1; return new Response('page'); } },
  };
  const plaid = async (_env, path) => {
    calls.plaid.push(path);
    return { data: { link_token: 'link-sandbox-test', expiration: '2026-09-26T00:00:00Z' }, raw: '{}' };
  };
  return { e, calls, plaid };
}

test('API requests under the base path reach the Finance routes, filtered to the signed-in owner', async () => {
  const { e, calls, plaid } = configured();
  const response = await get(`${BASE}/api/plaid/items`, { ...as('owner@example.com'), plaid }, e);
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).items.map((i) => [i.item_id, i.accounts.length]), [['item-1', 1]]);
  assert.deepEqual(calls.db[0].values, ['u1'], 'items are queried for the verified subject only');

  // The unprefixed path is not an API route of this app.
  assert.equal((await get('/api/plaid/items', { ...as('owner@example.com'), plaid }, e)).status, 404);
});

test('POSTs keep their method and origin check through the rewrite', async () => {
  const { e, calls, plaid } = configured();
  const post = (origin) => handleAppRequest(new Request(`https://mhoo.dev${BASE}/api/plaid/link-token`, { method: 'POST', headers: origin ? { origin } : {} }), e, { ...as('owner@example.com'), plaid });
  assert.equal((await post('https://evil.test')).status, 403);
  assert.equal((await post(null)).status, 403);
  assert.equal(calls.plaid.length, 0, 'no provider call for a foreign or missing origin');
  const ok = await post('https://mhoo.dev');
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).link_token, 'link-sandbox-test');
  assert.deepEqual(calls.plaid, ['/link/token/create']);
});

test('rejected people never touch pages, data or the provider', async () => {
  const { e, calls, plaid } = configured();
  for (const path of [`${BASE}/`, `${BASE}/assets/app.js`, `${BASE}/api/plaid/items`, `${BASE}/api/finance/data`]) {
    assert.equal((await get(path, { ...as('stranger@example.com'), plaid }, e)).status, 401, path);
  }
  assert.deepEqual(calls, { db: [], plaid: [], assets: 0 });
});

test('fails closed without an allow-list', async () => {
  assert.equal((await get(`${BASE}/`, as('owner@example.com'), { ...env, ALLOWED_EMAILS: '' })).status, 503);
});
