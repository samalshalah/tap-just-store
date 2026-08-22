import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { rateLimit, clientKey, tooManyRequests } from "@/lib/rate-limit";

/**
 * /api/newsletter — newsletter signup.
 *
 * Was a stub that logged and returned success, with a TODO about Mailchimp.
 * The address is now stored, so the list exists and is exportable whether or
 * not an email platform is ever connected. Connecting one later becomes a
 * one-off import rather than a list that was never collected.
 */

const Body = z.object({ email: z.string().trim().email().max(200) });

export async function POST(req: Request) {
  const ip = clientKey(req);
  const limit = rateLimit(`newsletter:${ip}`, 5, 10 * 60_000);
  if (!limit.ok) {
    return tooManyRequests(limit.retryAfter, "Too many signups. Try again shortly.");
  }

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  try {
    // Signing up twice is not an error to a person, so it is not one here.
    // The unique index is on lower(email), which Drizzle's typed
    // onConflictDoUpdate cannot target — it wants plain columns — so the
    // upsert is written out. Re-subscribing also clears a previous opt-out,
    // which is what a second signup means.
    await db.execute(sql`
      insert into newsletter_subscribers (email)
      values (${parsed.data.email})
      on conflict (lower(email))
      do update set unsubscribed_at = null
    `);
  } catch (err) {
    console.error("[newsletter] could not store signup:", err);
    return NextResponse.json(
      { error: "We could not sign you up just now. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
