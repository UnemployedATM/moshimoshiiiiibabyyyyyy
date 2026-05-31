/**
 * Stateless admin session tokens.
 *
 * Cookie value format:   <sessionId>.<expiresAtSeconds>.<hmacSig>
 *   - sessionId   : 16 random bytes, base64url
 *   - expiresAt   : unix seconds (UTC), as an integer
 *   - hmacSig     : base64url HMAC-SHA256(`${sessionId}.${expiresAt}`, secret)
 *
 * The HMAC key is ADMIN_PASSWORD. That keeps the cookie value totally
 * unrelated to (and not derivable into) the password itself, while still
 * needing zero schema: a forged cookie requires knowing the password, and a
 * leaked cookie can't be reversed back into the password.
 *
 * Revocation: change ADMIN_PASSWORD → every existing session signature
 * becomes invalid in one shot.
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const ENC: BufferEncoding = 'base64url';

function getSecret(): string | null {
  const v = process.env.ADMIN_PASSWORD ?? import.meta.env.ADMIN_PASSWORD;
  return typeof v === 'string' && v.length > 0 ? v : null;
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest(ENC);
}

/**
 * Mint a fresh session token. Returns null if ADMIN_PASSWORD isn't configured.
 * Caller should store this as the value of the `admin_auth` cookie.
 */
export function mintSession(): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const sessionId = randomBytes(16).toString(ENC);
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `${sessionId}.${expiresAt}`;
  const sig = sign(payload, secret);
  return `${payload}.${sig}`;
}

/**
 * Verify a cookie value. Returns true only if the signature is valid AND the
 * token has not expired AND ADMIN_PASSWORD is configured.
 */
export function verifySession(token: string | undefined | null): boolean {
  if (!token || typeof token !== 'string') return false;
  const secret = getSecret();
  if (!secret) return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [sessionId, expiresAtStr, sig] = parts;
  if (!sessionId || !expiresAtStr || !sig) return false;

  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt)) return false;
  if (expiresAt < Math.floor(Date.now() / 1000)) return false;

  const expectedSig = sign(`${sessionId}.${expiresAt}`, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const SESSION_TTL = SESSION_TTL_SECONDS;
