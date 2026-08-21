/**
 * /api/newsletter — newsletter signup endpoint.
 *
 * Stub: logs the signup and returns success. To wire this to Mailchimp,
 * read settings.integrations.mailchimp_audience_id and post to the
 * Mailchimp API here. Env vars: MAILCHIMP_API_KEY, MAILCHIMP_DC.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, clientKey, tooManyRequests } from "@/lib/rate-limit";

const Body = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const ip = clientKey(req);
  const limit = rateLimit(`newsletter:${ip}`, 5, 10 * 60_000);
  if (!limit.ok) {
    return tooManyRequests(limit.retryAfter, "Too many signups. Try again shortly.");
  }

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid email" },
      { status: 400 }
    );
  }

  // TODO(mailchimp): once admin/store/integrations has mailchimp_api_key
  // configured, fetch it from settings and POST to:
  //   https://${dc}.api.mailchimp.com/3.0/lists/${audienceId}/members
  // with { email_address, status: "subscribed" }.
  // The address itself stays out of the logs.
  console.log("[newsletter] signup received");

  return NextResponse.json({ ok: true });
}
