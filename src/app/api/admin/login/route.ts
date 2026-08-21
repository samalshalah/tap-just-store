/**
 * /api/admin/login — issue a signed session cookie if the password matches.
 *
 * Three gates before a password is even checked:
 *   1. an in-memory limiter, which is free and stops a fast flood per isolate
 *   2. a database counter, which is the one that works when Cloudflare spreads
 *      an attacker across many isolates
 *   3. a constant-time comparison, so failures leak nothing about the password
 *
 * Every attempt is recorded. That table is the lockout counter and the only
 * audit trail the admin has.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminLoginAttemptsTable } from "@/lib/schema/adminLoginAttempts";
import {
  ADMIN_COOKIE_NAME,
  SESSION_MAX_AGE_SEC,
  issueSessionCookie,
  passwordMatches,
} from "@/lib/admin-auth";
import { rateLimit, clientKey, tooManyRequests } from "@/lib/rate-limit";

const Body = z.object({ password: z.string().min(1).max(200) });

/** Failed attempts from one address before it is locked out. */
const MAX_FAILURES = 8;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;
/** Attempts are kept for a fortnight, then pruned on the way past. */
const RETENTION_MS = 14 * 24 * 60 * 60 * 1000;

async function recentFailures(ip: string): Promise<number> {
  try {
    const since = new Date(Date.now() - FAILURE_WINDOW_MS);
    const [row] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(adminLoginAttemptsTable)
      .where(
        and(
          eq(adminLoginAttemptsTable.ip, ip),
          eq(adminLoginAttemptsTable.succeeded, false),
          gt(adminLoginAttemptsTable.attemptedAt, since)
        )
      );
    return row?.n ?? 0;
  } catch (err) {
    // A database that is down must not become a way past the lockout, but it
    // must not lock the owner out of their own site either. The in-memory
    // limiter above is still holding the line here.
    console.error("[login] failure count unavailable:", err);
    return 0;
  }
}

async function record(ip: string, succeeded: boolean): Promise<void> {
  try {
    await db.insert(adminLoginAttemptsTable).values({ ip, succeeded });
    if (Math.random() < 0.05) {
      await db
        .delete(adminLoginAttemptsTable)
        .where(
          lt(adminLoginAttemptsTable.attemptedAt, new Date(Date.now() - RETENTION_MS))
        );
    }
  } catch (err) {
    console.error("[login] could not record attempt:", err);
  }
}

export async function POST(req: Request) {
  const ip = clientKey(req);

  const burst = rateLimit(`login:${ip}`, 10, 60_000);
  if (!burst.ok) {
    return tooManyRequests(burst.retryAfter, "Too many attempts. Wait a moment.");
  }

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing password" }, { status: 400 });
  }

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD is not configured." },
      { status: 500 }
    );
  }

  const failures = await recentFailures(ip);
  if (failures >= MAX_FAILURES) {
    return tooManyRequests(
      900,
      "Too many failed attempts. Try again in 15 minutes."
    );
  }

  if (!passwordMatches(parsed.data.password)) {
    await record(ip, false);
    const left = MAX_FAILURES - failures - 1;
    return NextResponse.json(
      {
        error:
          left > 0 && left <= 3
            ? `Wrong password. ${left} ${left === 1 ? "attempt" : "attempts"} left before a 15-minute lockout.`
            : "Wrong password",
      },
      { status: 401 }
    );
  }

  const value = issueSessionCookie();
  if (!value) {
    return NextResponse.json({ error: "Could not start a session." }, { status: 500 });
  }

  await record(ip, true);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SEC,
    path: "/",
  });
  return res;
}
