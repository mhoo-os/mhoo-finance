import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { applySyncPage, applySyncPages, handleFinanceRequest } from '../worker/index.js';
import { amountMinor } from '../worker/plaid.js';
import { openToken, sealToken } from '../worker/crypto.js';

const key = 'ab'.repeat(32);

test('Plaid outflow convention and token custody', async () => {
  assert.equal(amountMinor(12.34), '-1234');
  assert.equal(amountMinor(-12.34), '1234');
  assert.throws(() => amountMinor(1.234), /precision/);
  // Exact at magnitudes where amount * 100 is no longer exact in floating point.
  assert.equal(amountMinor(10000000000.29), '-1000000000029');
  assert.equal(amountMinor(319099585067.29), '-31909958506729');
  assert.equal(amountMinor(0.1), '-10');
  assert.equal(amountMinor(0), '0');
  assert.throws(() => amountMinor(90071992547409.92), /out of range/);
  assert.throws(() => amountMinor(1e21), /out of range/);
  // Past 15 significant digits JSON parsing may already have rounded the amount: refuse, don't guess.
  assert.throws(() => amountMinor(70368744177664.01), /out of range/);
  // These parse to a shorter string (…664.1, …409.9) that would otherwise pass as a different amount.
  assert.throws(() => amountMinor(70368744177664.09), /out of range/);
  assert.throws(() => amountMinor(-90071992547409.91), /out of range/);
  assert.equal(amountMinor(0.05), '-5');
  assert.equal(amountMinor(-0.05), '5');
  assert.equal(amountMinor(-0), '0');
  assert.equal(amountMinor(9999999999999.99), '-999999999999999');
  const encrypted = await sealToken('access-test', key);
  assert.doesNotMatch(encrypted, /access-test/);
  assert.equal(await openToken(encrypted, key), 'access-test');
  await assert.rejects(openToken(encrypted, 'cd'.repeat(32)));
});

test('paginated updates commit only after the final page', async () => {
  const { env, db } = bindings();
  const first = { added: [{ transaction_id: 'tx-page-1', account_id: 'account-1', date: '2026-09-21', name: 'First', amount: 1, iso_currency_code: 'USD' }], next_cursor: 'cursor-page-1', has_more: true };
  const second = { added: [{ transaction_id: 'tx-page-2', account_id: 'account-1', date: '2026-09-22', name: 'Second', amount: 2, iso_currency_code: 'USD' }], next_cursor: 'cursor-page-2', has_more: false };
  await assert.rejects(applySyncPages(env, 'item-test', [{ data: first, raw: JSON.stringify(first) }]), /incomplete/);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM finance_facts').get().count, 0);
  assert.equal(await applySyncPages(env, 'item-test', [{ data: first, raw: JSON.stringify(first) }, { data: second, raw: JSON.stringify(second) }]), 2);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM finance_facts').get().count, 2);
  assert.equal(db.prepare('SELECT cursor FROM plaid_items').get().cursor, 'cursor-page-2');
});

test('Link exchange stores a protected Item and serves the existing Finance read model', async () => {
  const { env, db } = bindings();
  Object.assign(env, {
    DEPLOYMENT_ENV: 'staging', ACCESS_TEAM_DOMAIN: 'test.cloudflareaccess.com', ACCESS_AUD: 'test-audience',
    PLAID_ENV: 'sandbox', PLAID_CLIENT_ID: 'test-client', PLAID_SECRET: 'test-secret', PLAID_TOKEN_KEY: key,
  });
  const calls = [];
  const plaid = async (_env, path) => {
    calls.push(path);
    const responses = {
      '/link/token/create': { link_token: 'link-sandbox-test', expiration: '2026-09-24T00:00:00Z' },
      '/item/public_token/exchange': { item_id: 'item-new', access_token: 'access-sandbox-test' },
      '/item/get': { item: { item_id: 'item-new', institution_id: 'ins-test', institution_name: 'Test Bank' } },
      '/accounts/get': { accounts: [{ account_id: 'acct-card', name: 'Everyday Card', mask: '1234', type: 'credit', subtype: 'credit card', balances: { iso_currency_code: 'USD' } }] },
    };
    return { data: responses[path], raw: new TextEncoder().encode(JSON.stringify(responses[path])) };
  };
  const options = { plaid, verify: async () => ({ subject: 'owner-new' }) };
  const request = (path, method = 'GET', body) => new Request(`https://finance.example.test${path}`, {
    method,
    headers: method === 'POST' ? { origin: 'https://finance.example.test', 'content-type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  assert.equal((await handleFinanceRequest(request('/api/plaid/link-token', 'POST'), env, options)).status, 200);
  const exchange = await handleFinanceRequest(request('/api/plaid/exchange', 'POST', { public_token: 'public-sandbox-test' }), env, options);
  assert.equal(exchange.status, 200);
  assert.deepEqual(calls, ['/link/token/create', '/item/public_token/exchange', '/item/get', '/accounts/get']);
  assert.doesNotMatch(db.prepare("SELECT encrypted_access_token FROM plaid_items WHERE item_id='item-new'").get().encrypted_access_token, /access-sandbox-test/);
  const data = await (await handleFinanceRequest(request('/api/finance/data'), env, options)).json();
  assert.equal(data.accounts[0].label, 'Test Bank · Everyday Card ···· 1234');
  assert.deepEqual(data.facts, []);
  assert.equal((await handleFinanceRequest(request('/api/plaid/items'), env, { ...options, verify: async () => ({ subject: 'other-owner' }) })).status, 200);
  const other = await (await handleFinanceRequest(request('/api/plaid/items'), env, { ...options, verify: async () => ({ subject: 'other-owner' }) })).json();
  assert.deepEqual(other.items, []);
  assert.equal((await handleFinanceRequest(new Request('https://finance.example.test/api/plaid/link-token', { method: 'POST', headers: { origin: 'https://evil.test' } }), env, options)).status, 403);
});

function bindings() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../migrations/0001_init.sql', import.meta.url), 'utf8'));
  db.prepare(`INSERT INTO plaid_items (item_id, owner_sub, encrypted_access_token, status, created_at)
    VALUES ('item-test', 'owner-test', 'encrypted', 'CONNECTED', '2026-09-23T00:00:00Z')`).run();
  const DB = {
    prepare(sql) {
      return { bind(...values) {
        return { run: async () => db.prepare(sql).run(...values), first: async () => db.prepare(sql).get(...values), all: async () => ({ results: db.prepare(sql).all(...values) }), sql, values };
      } };
    },
    async batch(statements) {
      db.exec('BEGIN');
      try {
        for (const statement of statements) db.prepare(statement.sql).run(...statement.values);
        db.exec('COMMIT');
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    },
  };
  const objects = new Map();
  const EVIDENCE = {
    async put(objectKey, bytes) {
      if (objects.has(objectKey)) return null;
      objects.set(objectKey, bytes);
      return { etag: 'new' };
    },
    async get(objectKey) {
      const bytes = objects.get(objectKey);
      return bytes ? { arrayBuffer: async () => bytes } : null;
    },
  };
  return { env: { DB, EVIDENCE }, db, objects };
}

test('sync page retains source bytes, exclusion, revision and cursor together', async () => {
  const { env, db, objects } = bindings();
  const transaction = { transaction_id: 'tx-1', account_id: 'account-1', date: '2026-09-22', name: 'Card purchase', amount: 12.34, iso_currency_code: 'USD', pending: true };
  const page = { added: [transaction], modified: [], removed: [], next_cursor: 'cursor-1', has_more: false };
  const raw = JSON.stringify(page);
  assert.equal(await applySyncPage(env, 'item-test', page, raw), 1);
  assert.equal(db.prepare('SELECT amount_minor FROM finance_facts').get().amount_minor, '-1234');
  assert.equal(db.prepare('SELECT included_in_totals FROM finance_facts').get().included_in_totals, 0);
  assert.equal(db.prepare('SELECT cursor FROM plaid_items').get().cursor, 'cursor-1');
  assert.equal(db.prepare('SELECT source_pointer FROM fact_revisions').get().source_pointer, '/added/0');
  assert.equal(objects.size, 1);
  await applySyncPage(env, 'item-test', page, raw);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM fact_revisions').get().count, 1);
  assert.equal(objects.size, 1);

  const bad = { added: [{ ...transaction, iso_currency_code: 'EUR' }], next_cursor: 'cursor-2' };
  await assert.rejects(applySyncPage(env, 'item-test', bad, JSON.stringify(bad)), /currency/);
  assert.equal(db.prepare('SELECT cursor FROM plaid_items').get().cursor, 'cursor-1');
});
