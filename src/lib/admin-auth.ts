import "server-only";
import { cookies } from "next/headers";
import { createHmac } from "crypto";

const COOKIE_NAME = "jc_admin_session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

function hmacHex(secret: string, message: string): string {
  return createHmac("sha256", secret).update(message).digest("hex");
}

export async function isAdminSession(): Promise<boolean> {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return false;

  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie?.value) return false;

  const [issuedAtStr, sig] = cookie.value.split(".");
  if (!issuedAtStr || !sig) return false;

  const issuedAt = parseInt(issuedAtStr, 10);
  if (isNaN(issuedAt)) return false;

  const ageSec = Math.floor(Date.now() / 1000) - issuedAt;
  if (ageSec < 0 || ageSec > SESSION_MAX_AGE_SEC) return false;

  return hmacHex(secret, issuedAtStr) === sig;
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
