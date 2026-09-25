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

test('routes the API under the base path through the same allow-list', async () => {
  const plaid = async () => { throw new Error('no provider calls in this test'); };
  // The allow-list runs before the handler's own configuration check (no Plaid secrets here → 503).
  assert.equal((await get(`${BASE}/api/plaid/items`, { ...as('stranger@example.com'), plaid })).status, 401);
  assert.equal((await get(`${BASE}/api/plaid/items`, { ...as('owner@example.com'), plaid })).status, 503);
});

test('fails closed without an allow-list', async () => {
  assert.equal((await get(`${BASE}/`, as('owner@example.com'), { ...env, ALLOWED_EMAILS: '' })).status, 503);
});
