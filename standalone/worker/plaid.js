const hosts = {
  sandbox: 'https://sandbox.plaid.com',
  development: 'https://development.plaid.com',
  production: 'https://production.plaid.com',
};

async function boundedBody(response, maximum = 2_000_000) {
  if (!response.body) throw new Error('Plaid response body is missing');
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximum) {
        await reader.cancel();
        throw new Error('Plaid response is too large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  return body;
}

export async function plaidRequest(env, path, body, fetcher = fetch) {
  const host = hosts[env.PLAID_ENV];
  if (!host || !env.PLAID_CLIENT_ID || !env.PLAID_SECRET) throw new Error('Plaid is not configured');
  const response = await fetcher(`${host}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'plaid-version': '2020-09-14' },
    body: JSON.stringify({ client_id: env.PLAID_CLIENT_ID, secret: env.PLAID_SECRET, ...body }),
    signal: AbortSignal.timeout(15_000),
  });
  const length = Number(response.headers.get('content-length') ?? 0);
  if (length > 2_000_000) throw new Error('Plaid response is too large');
  const raw = await boundedBody(response);
  const data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(raw));
  if (!response.ok) {
    const error = new Error('Plaid request failed');
    error.code = data.error_code;
    throw error;
  }
  return { data, raw };
}

// Plaid sends amounts as JSON numbers. Up to 15 significant digits, String(amount) is exactly the
// decimal Plaid wrote, so parse that text instead of multiplying a float by 100.
const MAX_MINOR = BigInt(Number.MAX_SAFE_INTEGER);
export function amountMinor(amount) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) throw new Error('Invalid Plaid amount');
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(String(amount));
  if (!match) throw new Error('Plaid amount is out of range');
  const [, sign, whole, fraction = ''] = match;
  if (fraction.length > 2) throw new Error('Plaid amount has unsupported precision');
  // A double keeps any decimal of up to 15 significant digits exactly; past that, JSON parsing may
  // already have rounded the value Plaid sent, so refuse it instead of storing a different amount.
  if ((whole.replace(/^0+/, '') + fraction).length > 15) throw new Error('Plaid amount is out of range');
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  if (cents > MAX_MINOR) throw new Error('Plaid amount is out of range');
  // Plaid transactions use positive outflow; Finance uses positive inflow.
  return cents === 0n ? '0' : `${sign ? '' : '-'}${cents}`;
}
