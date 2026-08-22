import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { contactMessagesTable } from "@/lib/schema/contactMessages";
import { rateLimit, clientKey, tooManyRequests } from "@/lib/rate-limit";
import { getSiteSettings } from "@/lib/settings";
import { defaultOrderFromEmail, sendOrderEmailMessages } from "@/lib/order-email";
import { DEFAULTS } from "@/lib/defaults";

/**
 * /api/contact — the contact form.
 *
 * This used to return success and do nothing but write a line to the platform
 * log. Someone typed a question, saw "thanks, we'll be in touch", and nobody
 * ever was. Enquiries were being lost silently, which is worse than a form
 * that visibly fails.
 *
 * The message is now **stored first** and emailed second. Email is a
 * notification, and notifications fail — a provider has a bad minute, a key is
 * not configured, a spam filter eats it. If the only copy of an enquiry is a
 * mail that failed to send, the enquiry is gone. The row is the record.
 *
 * That ordering also means the form works correctly today, before any email
 * provider is configured: the message lands in /admin/messages either way.
 */

const Body = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(5).max(5000),
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
  const data = parsed.data;

  let saved;
  try {
    [saved] = await db
      .insert(contactMessagesTable)
      .values({ name: data.name, email: data.email, message: data.message })
      .returning();
  } catch (err) {
    // If the message could not be stored we must not claim it was received.
    // Telling the truth here is the whole point of this route.
    console.error("[contact] could not store message:", err);
    return NextResponse.json(
      {
        error:
          "We could not save your message. Please email us directly and we will pick it up.",
      },
      { status: 500 }
    );
  }

  // Notification only. A failure here is logged and swallowed, because the
  // message is already safe in the database.
  try {
    const settings = await getSiteSettings();
    const to =
      settings.store?.order_confirmation_email?.trim() ||
      settings.contact?.email?.trim();

    if (to) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
      const storeName = settings.store?.name || DEFAULTS.storeName;
      const result = await sendOrderEmailMessages({
        apiKey: process.env.RESEND_API_KEY,
        messages: [
          {
            from:
              process.env.RESEND_FROM_EMAIL ??
              defaultOrderFromEmail(settings, siteUrl),
            to,
            // So a reply in the mail client goes straight to the customer.
            reply_to: data.email,
            subject: `New message from ${data.name} — ${storeName}`,
            text: [
              `From: ${data.name} <${data.email}>`,
              "",
              data.message,
              "",
              `Read it in the admin: ${siteUrl.replace(/\/+$/, "")}/admin/messages`,
            ].join("\n"),
            html: `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5;">
      <h1 style="font-size:20px;margin:0 0 12px;">New message from ${escapeHtml(data.name)}</h1>
      <p style="margin:0 0 6px;color:#6b7280;">${escapeHtml(data.email)}</p>
      <p style="white-space:pre-line;margin:16px 0;padding:14px;background:#f9fafb;border-radius:8px;">${escapeHtml(
        data.message
      )}</p>
      <p style="font-size:13px;color:#6b7280;">
        <a href="${escapeHtml(siteUrl.replace(/\/+$/, ""))}/admin/messages">Read it in the admin</a>
      </p>
    </div>`,
          },
        ],
      });
      if (result.failed > 0) {
        console.warn("[contact] notification email failed:", result.errors);
      }
    }
  } catch (err) {
    console.error("[contact] notification threw:", err);
  }

  console.log("[contact] stored message", saved.id);
  return NextResponse.json({ ok: true });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
