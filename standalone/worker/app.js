import { accessDenied, accessMisconfigured, verifyAccessAssertion } from '../../src/access.js';
import { handleFinanceRequest } from './index.js';

// Mhoo app contract (mhoo-shell/APP-CONTRACT.md): everything lives under BASE, sign-in is the
// shared mhoo.dev/00 Access app, and the Worker applies its own allow-list on top of it.
export const BASE = '/00/finance';

export const MANIFEST = Object.freeze({
  schemaVersion: 1,
  apps: [{ id: 'finance', label: 'Finance', route: BASE, icon: 'dashboard', capabilities: ['finance.read'], webmcp: false }],
});

const allowedEmails = (env) => (env.ALLOWED_EMAILS ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

/** Access verification plus the app's own allow-list. Service tokens are not accepted yet. */
async function verifyAllowed(request, env, verify) {
  const identity = await verify(request, env);
  if (!identity.email || !allowedEmails(env).includes(identity.email.toLowerCase())) throw new Error('Not on the Finance allow-list');
  return identity;
}

export async function handleAppRequest(request, env, { verify = verifyAccessAssertion, plaid } = {}) {
  const url = new URL(request.url);

  // Metadata only. Shell reads it over a service binding; it is not routed publicly.
  if (url.pathname === '/.well-known/mhoo-app.json' && request.method === 'GET') {
    return Response.json(MANIFEST, { headers: { 'cache-control': 'public, max-age=300' } });
  }
  if (url.pathname === BASE) return Response.redirect(`${url.origin}${BASE}/`, 302);
  if (!url.pathname.startsWith(`${BASE}/`)) return new Response('Not found', { status: 404 });
  if (allowedEmails(env).length === 0) return accessMisconfigured();

  const guarded = (req, e) => verifyAllowed(req, e, verify);

  // API: hand the existing handler the path it has always served (/api/...).
  if (url.pathname.startsWith(`${BASE}/api/`)) {
    const inner = new URL(url);
    inner.pathname = url.pathname.slice(BASE.length);
    return handleFinanceRequest(new Request(inner, request), env, { verify: guarded, ...(plaid ? { plaid } : {}) });
  }

  // Pages are protected in the Worker too: requests forwarded by Shell skip the edge.
  try {
    await guarded(request, env);
  } catch {
    return accessDenied();
  }
  return env.ASSETS.fetch(request);
}
