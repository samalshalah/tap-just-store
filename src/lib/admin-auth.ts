import "server-only";
import { cookies } from "next/headers";
import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE_NAME = "jc_admin_session";
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

/**
 * Session signing key.
 *
 * The old scheme signed the cookie with ADMIN_PASSWORD directly, over a
 * timestamp the attacker already knows. One captured cookie was therefore a
 * free offline oracle: guess a password, HMAC the timestamp, compare. Millions
 * of guesses a second, and the prize is the admin password itself.
 *
 * Two changes. SESSION_SECRET, when set, is an independent key — cracking a
 * cookie then tells you nothing about the password. When it is not set (so the
 * site keeps working with no new configuration) the key is derived from the
 * password through 150k rounds of PBKDF2, which turns each guess from one hash
 * into 150k and makes the same attack about five orders of magnitude slower.
 */
const KDF_ROUNDS = 150_000;
const KDF_SALT = "tap-rater/admin-session/v2";

let cachedKey: Buffer | null = null;

function sessionKey(): Buffer | null {
  if (cachedKey) return cachedKey;

  const explicit = process.env.SESSION_SECRET;
  if (explicit && explicit.length >= 16) {
    cachedKey = Buffer.from(explicit, "utf8");
    return cachedKey;
  }

  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;

  cachedKey = pbkdf2Sync(password, KDF_SALT, KDF_ROUNDS, 32, "sha256");
  return cachedKey;
}

function sign(message: string): string | null {
  const key = sessionKey();
  if (!key) return null;
  return createHmac("sha256", key).update(message).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Build a cookie value: `issuedAt.nonce.signature`.
 *
 * The nonce is random per sign-in, so two sessions never share a cookie value
 * and the signature is never over a fully predictable message.
 */
export function issueSessionCookie(): string | null {
  const issuedAt = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(12).toString("hex");
  const signature = sign(`${issuedAt}.${nonce}`);
  if (!signature) return null;
  return `${issuedAt}.${nonce}.${signature}`;
}

/** Verify a cookie value. Accepts only the current format. */
export function verifySessionCookie(value: string | undefined): boolean {
  if (!value) return false;

  const parts = value.split(".");
  if (parts.length !== 3) return false;

  const [issuedAtStr, nonce, signature] = parts;
  if (!/^\d+$/.test(issuedAtStr) || !/^[a-f0-9]{24}$/.test(nonce)) return false;

  const issuedAt = parseInt(issuedAtStr, 10);
  const ageSec = Math.floor(Date.now() / 1000) - issuedAt;
  if (ageSec < 0 || ageSec > SESSION_MAX_AGE_SEC) return false;

  const expected = sign(`${issuedAtStr}.${nonce}`);
  return expected !== null && safeEqual(expected, signature);
}

/**
 * Constant-time password check.
 *
 * Both sides are hashed first, so timingSafeEqual always compares two 32-byte
 * buffers and the comparison cannot leak the real password's length.
 */
export function passwordMatches(supplied: string): boolean {
  const actual = process.env.ADMIN_PASSWORD;
  if (!actual) return false;

  const a = createHmac("sha256", KDF_SALT).update(supplied).digest();
  const b = createHmac("sha256", KDF_SALT).update(actual).digest();
  return timingSafeEqual(a, b);
}

export async function isAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifySessionCookie(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

/**
 * Guard for anything that writes.
 *
 * Server Actions are the reason this exists. Every exported async function in
 * a "use server" module is registered in the action manifest and can be POSTed
 * to directly by anyone who knows its id — the page that imported it is not a
 * gate, and neither is the admin layout. Each action has to check for itself.
 */
export async function assertAdmin(): Promise<void> {
  if (!(await isAdminSession())) {
    throw new Error("Not authorized");
  }
}
