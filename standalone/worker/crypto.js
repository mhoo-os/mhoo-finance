const encoder = new TextEncoder();

export async function sha256(bytes) {
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return Array.from(hash, (part) => part.toString(16).padStart(2, '0')).join('');
}

function base64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

function unbase64(value) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function keyFrom(secret) {
  if (!/^[0-9a-f]{64}$/i.test(secret ?? '')) throw new Error('Token encryption key is not configured');
  return crypto.subtle.importKey('raw', Uint8Array.from(secret.match(/../g), (pair) => parseInt(pair, 16)), 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function sealToken(token, secret) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await keyFrom(secret), encoder.encode(token)));
  return `${base64(iv)}.${base64(ciphertext)}`;
}

export async function openToken(value, secret) {
  const [iv, ciphertext, extra] = value.split('.');
  if (!iv || !ciphertext || extra) throw new Error('Encrypted token is malformed');
  const bytes = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unbase64(iv) }, await keyFrom(secret), unbase64(ciphertext));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}
