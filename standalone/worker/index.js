import { verifyAccessAssertion, accessDenied, accessMisconfigured } from '../../src/access.js';
import { openToken, sealToken, sha256 } from './crypto.js';
import { amountMinor, plaidRequest } from './plaid.js';

const reply = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

async function bodyFrom(request) {
  if (Number(request.headers.get('content-length') ?? 0) > 4096) throw new Error('Request is too large');
  const raw = await request.text();
  if (raw.length > 4096) throw new Error('Request is too large');
  return JSON.parse(raw);
}

function configured(env) {
  return Boolean(env.DB && env.EVIDENCE && env.PLAID_CLIENT_ID && env.PLAID_SECRET && env.PLAID_TOKEN_KEY && env.PLAID_ENV);
}

async function itemForOwner(env, itemId, subject) {
  return env.DB.prepare('SELECT * FROM plaid_items WHERE item_id = ? AND owner_sub = ?').bind(itemId, subject).first();
}

async function accounts(env, itemId, token, plaid) {
  const { data } = await plaid(env, '/accounts/get', { access_token: token });
  const rows = data.accounts ?? [];
  if (!Array.isArray(rows) || rows.length > 500) throw new Error('Invalid Plaid account set');
  const statements = rows.map((account) => env.DB.prepare(`INSERT INTO financial_accounts
    (account_id, item_id, name, mask, type, subtype, currency) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(account_id) DO UPDATE SET name=excluded.name, mask=excluded.mask,
    type=excluded.type, subtype=excluded.subtype, currency=excluded.currency`)
    .bind(account.account_id, itemId, account.name, account.mask ?? null, account.type, account.subtype ?? null,
      account.balances?.iso_currency_code ?? account.balances?.unofficial_currency_code ?? null));
  if (statements.length) await env.DB.batch(statements);
}

async function linkToken(env, subject, plaid) {
  const { data } = await plaid(env, '/link/token/create', {
    user: { client_user_id: subject },
    client_name: 'Mhoo Finance',
    products: ['transactions'],
    transactions: { days_requested: 90 },
    country_codes: ['US'],
    language: 'en',
  });
  return reply({ link_token: data.link_token, expiration: data.expiration });
}

async function exchange(request, env, subject, plaid) {
  const input = await bodyFrom(request);
  if (typeof input.public_token !== 'string' || !input.public_token.startsWith('public-')) return reply({ error: 'Invalid public token' }, 400);
  const { data } = await plaid(env, '/item/public_token/exchange', { public_token: input.public_token });
  if (typeof data.item_id !== 'string' || typeof data.access_token !== 'string') throw new Error('Invalid Plaid exchange result');
  const itemDetails = (await plaid(env, '/item/get', { access_token: data.access_token })).data.item;
  if (itemDetails?.item_id !== data.item_id) throw new Error('Plaid Item identity mismatch');
  const encrypted = await sealToken(data.access_token, env.PLAID_TOKEN_KEY);
  const now = new Date().toISOString();
  // A different owner can never claim an already stored Item.
  await env.DB.prepare(`INSERT INTO plaid_items
    (item_id, owner_sub, encrypted_access_token, institution_id, institution_name, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'CONNECTED', ?)
    ON CONFLICT(item_id) DO NOTHING`)
    .bind(data.item_id, subject, encrypted, itemDetails.institution_id ?? null, itemDetails.institution_name ?? null, now).run();
  const item = await itemForOwner(env, data.item_id, subject);
  if (!item) return reply({ error: 'Item belongs to another user' }, 403);
  await accounts(env, data.item_id, data.access_token, plaid);
  return reply({ item_id: data.item_id, status: item.status });
}

async function listItems(env, subject) {
  const result = await env.DB.prepare(`SELECT item_id, institution_name, status, last_synced_at
    FROM plaid_items WHERE owner_sub = ? AND status != 'DISCONNECTED' ORDER BY created_at DESC`).bind(subject).all();
  const items = [];
  for (const item of result.results ?? []) {
    const rows = await env.DB.prepare(`SELECT account_id, name, mask, type, subtype, currency
      FROM financial_accounts WHERE item_id = ? ORDER BY name`).bind(item.item_id).all();
    items.push({ ...item, accounts: rows.results ?? [] });
  }
  return reply({ items });
}

async function listTransactions(env, subject) {
  const rows = await env.DB.prepare(`SELECT f.transaction_id, f.account_id, f.date, f.description,
    f.amount_minor, f.currency, f.pending, f.removed, f.source_artifact_key, f.source_pointer
    FROM finance_facts f JOIN plaid_items i ON i.item_id = f.item_id
    WHERE i.owner_sub = ? AND i.status != 'DISCONNECTED' AND f.removed = 0
    ORDER BY f.date DESC, f.transaction_id DESC LIMIT 200`).bind(subject).all();
  return reply({ transactions: rows.results ?? [], classification: 'UNCLASSIFIED', included_in_totals: false });
}

async function financeData(env, subject) {
  const accountRows = await env.DB.prepare(`SELECT a.account_id, a.name, a.type, a.mask, i.institution_name
    FROM financial_accounts a JOIN plaid_items i ON i.item_id = a.item_id
    WHERE i.owner_sub = ? AND i.status != 'DISCONNECTED' ORDER BY a.name LIMIT 201`).bind(subject).all();
  const factRows = await env.DB.prepare(`SELECT f.transaction_id, f.account_id, f.date, f.description,
    f.amount_minor, f.currency, f.pending, f.source_artifact_key, f.source_pointer, a.name AS account_name
    FROM finance_facts f JOIN plaid_items i ON i.item_id = f.item_id
    LEFT JOIN financial_accounts a ON a.account_id = f.account_id
    WHERE i.owner_sub = ? AND i.status != 'DISCONNECTED' AND f.removed = 0
    ORDER BY f.date DESC, f.transaction_id DESC LIMIT 501`).bind(subject).all();
  const accounts = (accountRows.results ?? []).slice(0, 200).map((row) => ({
    id: row.account_id,
    label: `${row.institution_name ?? 'Bank'} · ${row.name}${row.mask ? ` ···· ${row.mask}` : ''}`,
    sourceKind: row.type,
  }));
  const facts = (factRows.results ?? []).slice(0, 500).map((row) => {
    const minor = BigInt(row.amount_minor);
    return {
      id: row.transaction_id,
      factKey: row.transaction_id,
      description: row.description,
      accountId: row.account_id,
      accountLabel: row.account_name ?? 'Unknown account',
      date: row.date,
      amountMinor: (minor < 0n ? -minor : minor).toString(),
      currency: row.currency,
      direction: minor < 0n ? 'out' : minor > 0n ? 'in' : 'unknown',
      status: row.pending ? 'PENDING' : 'POSTED',
      classification: 'UNCLASSIFIED',
      includedInTotals: false,
      sourceLocation: row.source_pointer,
      artifactId: null,
      artifactKey: row.source_artifact_key,
    };
  });
  return reply({ accounts, facts, statements: [], followUps: [], truncated: (accountRows.results ?? []).length > 200 || (factRows.results ?? []).length > 500 });
}

async function preservePage(env, itemId, raw) {
  const bytes = typeof raw === 'string' ? new TextEncoder().encode(raw) : raw;
  const hash = await sha256(bytes);
  const key = `plaid/${itemId}/sha256/${hash}.json`;
  const created = await env.EVIDENCE.put(key, bytes, { onlyIf: { etagDoesNotMatch: '*' }, sha256: hash });
  if (created === null) {
    const prior = await env.EVIDENCE.get(key);
    if (!prior || await sha256(await prior.arrayBuffer()) !== hash) throw new Error('Existing Plaid evidence differs');
  }
  return { key, hash };
}

async function prepareSyncPage(env, itemId, page, raw, observedAt) {
  const changes = [
    ...((page.added ?? []).map((transaction, index) => ({ kind: 'ADDED', transaction, pointer: `/added/${index}` }))),
    ...((page.modified ?? []).map((transaction, index) => ({ kind: 'MODIFIED', transaction, pointer: `/modified/${index}` }))),
    ...((page.removed ?? []).map((transaction, index) => ({ kind: 'REMOVED', transaction, pointer: `/removed/${index}` }))),
  ];
  if (changes.length > 500 || typeof page.next_cursor !== 'string') throw new Error('Invalid Plaid sync page');
  for (const { kind, transaction } of changes) {
    if (typeof transaction.transaction_id !== 'string') throw new Error('Invalid Plaid transaction ID');
    if (kind !== 'REMOVED') {
      const currency = transaction.iso_currency_code ?? transaction.unofficial_currency_code;
      if (currency !== 'USD') throw new Error('Unsupported Plaid currency');
      if (typeof transaction.account_id !== 'string' || typeof transaction.date !== 'string' || typeof transaction.name !== 'string') throw new Error('Invalid Plaid transaction');
      amountMinor(transaction.amount);
    }
  }
  const { key, hash } = await preservePage(env, itemId, raw);
  const statements = [env.DB.prepare(`INSERT OR IGNORE INTO source_artifacts
    (object_key, sha256, item_id, acquired_at) VALUES (?, ?, ?, ?)`).bind(key, hash, itemId, observedAt)];
  for (const { kind, transaction, pointer } of changes) {
    statements.push(env.DB.prepare(`INSERT OR IGNORE INTO fact_revisions
      (transaction_id, item_id, event_kind, source_artifact_key, source_pointer, observed_at)
      VALUES (?, ?, ?, ?, ?, ?)`).bind(transaction.transaction_id, itemId, kind, key, pointer, observedAt));
    if (kind === 'REMOVED') {
      statements.push(env.DB.prepare(`UPDATE finance_facts SET removed = 1,
        source_artifact_key = ?, source_pointer = ? WHERE transaction_id = ? AND item_id = ?`)
        .bind(key, pointer, transaction.transaction_id, itemId));
      continue;
    }
    const currency = transaction.iso_currency_code ?? transaction.unofficial_currency_code;
    statements.push(env.DB.prepare(`INSERT INTO finance_facts
      (transaction_id, item_id, account_id, date, description, amount_minor, currency, pending,
      pending_transaction_id, source_artifact_key, source_pointer)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(transaction_id) DO UPDATE SET account_id=excluded.account_id, date=excluded.date,
      description=excluded.description, amount_minor=excluded.amount_minor, currency=excluded.currency,
      pending=excluded.pending, removed=0, pending_transaction_id=excluded.pending_transaction_id,
      source_artifact_key=excluded.source_artifact_key, source_pointer=excluded.source_pointer,
      included_in_totals=0, classification='UNCLASSIFIED'`)
      .bind(transaction.transaction_id, itemId, transaction.account_id, transaction.date, transaction.name,
        amountMinor(transaction.amount), currency, transaction.pending ? 1 : 0,
        transaction.pending_transaction_id ?? null, key, pointer));
  }
  return { statements, changeCount: changes.length };
}

export async function applySyncPages(env, itemId, pages, observedAt = new Date().toISOString()) {
  if (!pages.length || pages.at(-1).data.has_more) throw new Error('Plaid update is incomplete');
  const statements = [];
  let changes = 0;
  for (const { data, raw } of pages) {
    const prepared = await prepareSyncPage(env, itemId, data, raw, observedAt);
    statements.push(...prepared.statements);
    changes += prepared.changeCount;
  }
  statements.push(env.DB.prepare('UPDATE plaid_items SET cursor = ?, last_synced_at = ? WHERE item_id = ?')
    .bind(pages.at(-1).data.next_cursor, observedAt, itemId));
  // D1.batch is atomic. The cursor and all transaction changes commit together.
  await env.DB.batch(statements);
  return changes;
}

export async function applySyncPage(env, itemId, page, raw, observedAt) {
  return applySyncPages(env, itemId, [{ data: page, raw }], observedAt);
}

async function disconnect(env, item, plaid) {
  if (item.status === 'DISCONNECTED') return reply({ status: 'DISCONNECTED' });
  const token = await openToken(item.encrypted_access_token, env.PLAID_TOKEN_KEY);
  await plaid(env, '/item/remove', { access_token: token });
  await env.DB.prepare(`UPDATE plaid_items SET status = 'DISCONNECTED', encrypted_access_token = '' WHERE item_id = ?`)
    .bind(item.item_id).run();
  return reply({ status: 'DISCONNECTED' });
}

async function sync(env, item, plaid) {
  if (item.status === 'DISCONNECTED' || item.status === 'REAUTH_REQUIRED') return reply({ error: 'Item needs reconnection' }, 409);
  const token = await openToken(item.encrypted_access_token, env.PLAID_TOKEN_KEY);
  let cursor = item.cursor;
  const pages = [];
  let hasMore = false;
  try {
    for (let pageNumber = 0; pageNumber < 5; pageNumber += 1) {
      const { data, raw } = await plaid(env, '/transactions/sync', { access_token: token, cursor: cursor ?? undefined, count: 100 });
      pages.push({ data, raw });
      cursor = data.next_cursor;
      hasMore = data.has_more === true;
      if (!hasMore) break;
    }
    if (hasMore) {
      const error = new Error('Plaid update exceeds the bounded sync window');
      error.code = 'SYNC_BOUND_EXCEEDED';
      throw error;
    }
    const count = await applySyncPages(env, item.item_id, pages);
    await env.DB.prepare('UPDATE plaid_items SET status = ? WHERE item_id = ?').bind('CONNECTED', item.item_id).run();
    return reply({ changes: count, has_more: false });
  } catch (error) {
    const status = error.code === 'ITEM_LOGIN_REQUIRED' ? 'REAUTH_REQUIRED' : 'ERROR';
    await env.DB.prepare('UPDATE plaid_items SET status = ? WHERE item_id = ?').bind(status, item.item_id).run();
    throw error;
  }
}

export async function handleFinanceRequest(request, env, { plaid = plaidRequest, verify = verifyAccessAssertion } = {}) {
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD || env.DEPLOYMENT_ENV !== 'staging') return accessMisconfigured();
  let identity;
  try { identity = await verify(request, env); } catch { return accessDenied(); }
  if (!configured(env)) return reply({ error: 'Finance integration is not configured' }, 503);
  const url = new URL(request.url);
  if (request.method === 'POST' && request.headers.get('origin') !== url.origin) {
    return reply({ error: 'Request origin is not allowed' }, 403);
  }
  try {
    if (request.method === 'POST' && url.pathname === '/api/plaid/link-token') return await linkToken(env, identity.subject, plaid);
    if (request.method === 'POST' && url.pathname === '/api/plaid/exchange') return await exchange(request, env, identity.subject, plaid);
    if (request.method === 'GET' && url.pathname === '/api/plaid/items') return await listItems(env, identity.subject);
    if (request.method === 'GET' && url.pathname === '/api/plaid/transactions') return await listTransactions(env, identity.subject);
    if (request.method === 'GET' && url.pathname === '/api/finance/data') return await financeData(env, identity.subject);
    const match = /^\/api\/plaid\/items\/([^/]+)\/sync$/.exec(url.pathname);
    if (request.method === 'POST' && match) {
      const item = await itemForOwner(env, decodeURIComponent(match[1]), identity.subject);
      if (!item) return reply({ error: 'Item not found' }, 404);
      return await sync(env, item, plaid);
    }
    const disconnectMatch = /^\/api\/plaid\/items\/([^/]+)\/disconnect$/.exec(url.pathname);
    if (request.method === 'POST' && disconnectMatch) {
      const item = await itemForOwner(env, decodeURIComponent(disconnectMatch[1]), identity.subject);
      if (!item) return reply({ error: 'Item not found' }, 404);
      return await disconnect(env, item, plaid);
    }
    return reply({ error: 'Not found' }, 404);
  } catch (error) {
    // Never log Plaid payloads, tokens, account IDs, or user identity.
    if (error.code === 'ITEM_LOGIN_REQUIRED') return reply({ error: 'Bank connection needs repair' }, 409);
    if (error.code === 'SYNC_BOUND_EXCEEDED') return reply({ error: 'This update exceeds the first connector batch. An operator must extend the sync path before retrying.' }, 409);
    return reply({ error: 'Finance request failed' }, 502);
  }
}
