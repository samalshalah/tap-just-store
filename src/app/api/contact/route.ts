/**
 * /api/contact — contact form submissions.
 *
 * Still a stub in the sense that nothing is delivered anywhere yet, but it no
 * longer writes the sender's name, email and message body into the platform
 * logs. Those logs are readable by anyone with dashboard access and are
 * retained well past any purpose this form has.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, clientKey, tooManyRequests } from "@/lib/rate-limit";

const Body = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  message: z.string().min(5).max(5000),
});

export async function POST(req: Request) {
  const ip = clientKey(req);
  const limit = rateLimit(`contact:${ip}`, 5, 10 * 60_000);
  if (!limit.ok) {
    return tooManyRequests(
      limit.retryAfter,
      "You have sent several messages already. Try again shortly."
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Enough to know the form is being used and to debug delivery; no PII.
  console.log("[contact] message received", {
    bytes: parsed.data.message.length,
  });

  // TODO(phase 4): deliver through the same Resend path as order email.
  return NextResponse.json({ ok: true });
}
