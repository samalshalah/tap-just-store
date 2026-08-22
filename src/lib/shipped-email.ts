import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { ordersTable } from "@/lib/schema/orders";
import { getSiteSettings } from "@/lib/settings";
import { DEFAULTS } from "@/lib/defaults";
import { CARRIERS, isCarrierCode, trackingUrl } from "@/lib/order-status";
import {
  defaultOrderFromEmail,
  sendOrderEmailMessages,
  type OrderEmailMessage,
} from "@/lib/order-email";

/**
 * "Your stand is on its way."
 *
 * Sent once, when an order first moves to shipped. The guard against sending
 * twice is a conditional UPDATE rather than a check-then-write: two clicks in
 * quick succession, or a status walked back to production and forward again,
 * would otherwise each send a tracking email. The update claims the right to
 * send by stamping `shipped_email_sent_at` only while it is still null — so
 * exactly one caller ever gets a row back.
 *
 * Failing to send is logged and swallowed. The parcel really has shipped; the
 * status must not be rolled back because an email provider had a bad minute.
 */
export async function sendShippedEmail(orderId: number): Promise<void> {
  const now = new Date();

  // Whoever this returns a row to is the one that sends. Everyone else gets
  // nothing back and does nothing.
  const [order] = await db
    .update(ordersTable)
    .set({ shippedEmailSentAt: now })
    .where(
      and(eq(ordersTable.id, orderId), isNull(ordersTable.shippedEmailSentAt))
    )
    .returning();

  if (!order) return;

  try {
    const settings = await getSiteSettings();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    const storeName = settings.store?.name || DEFAULTS.storeName;
    const from =
      process.env.RESEND_FROM_EMAIL ?? defaultOrderFromEmail(settings, siteUrl);

    const url = trackingUrl(order.carrier, order.trackingNumber);
    const carrierLabel =
      order.carrier && isCarrierCode(order.carrier)
        ? CARRIERS[order.carrier].label
        : "the carrier";

    const orderUrl = siteUrl
      ? `${siteUrl.replace(/\/+$/, "")}/order/${order.id}?code=${encodeURIComponent(order.confirmationCode)}`
      : "";

    const message: OrderEmailMessage = {
      from,
      to: order.customerEmail,
      subject: `Your ${storeName} order ${order.confirmationCode} has shipped`,
      text: [
        `Good news — order ${order.confirmationCode} is on its way.`,
        "",
        `Carrier: ${carrierLabel}`,
        `Tracking number: ${order.trackingNumber ?? ""}`,
        url ? `Track it: ${url}` : "",
        "",
        "Shipping to:",
        order.shipName,
        order.shipLine1,
        order.shipLine2,
        `${order.shipCity}, ${order.shipState} ${order.shipPostalCode}`,
        "",
        // Repeated here on purpose: this email is the one a customer keeps,
        // and tapping the stand is the moment they might think it is broken.
        "When it arrives, tap your phone against the stand — hold it right on",
        "the surface, not near it. Older phones can use the printed QR code.",
        orderUrl ? `` : "",
        orderUrl ? `Your order: ${orderUrl}` : "",
      ]
        .filter((line) => line !== undefined && line !== "")
        .join("\n"),
      html: `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5;">
      <h1 style="font-size:22px;margin:0 0 12px;">Your order is on its way</h1>
      <p style="margin:0 0 16px;">
        Order <strong>${escapeHtml(order.confirmationCode)}</strong> shipped today.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tbody>
          <tr><td style="padding:4px 0;color:#6b7280;">Carrier</td><td style="padding:4px 0;text-align:right;">${escapeHtml(carrierLabel)}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">Tracking</td><td style="padding:4px 0;text-align:right;">${escapeHtml(order.trackingNumber ?? "")}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">Shipping to</td><td style="padding:4px 0;text-align:right;white-space:pre-line;">${escapeHtml(
            [
              order.shipName,
              order.shipLine1,
              order.shipLine2,
              `${order.shipCity}, ${order.shipState} ${order.shipPostalCode}`,
            ]
              .filter(Boolean)
              .join("\n")
          )}</td></tr>
        </tbody>
      </table>
      ${
        url
          ? `<p style="margin:20px 0;"><a href="${escapeHtml(url)}" style="display:inline-block;background:#E08700;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:bold;">Track your parcel</a></p>`
          : ""
      }
      <p style="margin:18px 0 0;color:#374151;">
        When it arrives, <strong>tap your phone against the stand</strong> —
        hold it right on the surface rather than near it. Older phones can use
        the printed QR code instead.
      </p>
      ${
        orderUrl
          ? `<p style="margin-top:18px;color:#6b7280;font-size:13px;"><a href="${escapeHtml(orderUrl)}" style="color:#6b7280;">View your order</a></p>`
          : ""
      }
    </div>`,
    };

    const result = await sendOrderEmailMessages({
      apiKey: process.env.RESEND_API_KEY,
      messages: [message],
    });
    if (result.failed > 0) {
      console.warn("[shipped-email] send failed:", result.errors);
    }
  } catch (err) {
    // The parcel has shipped either way. Rolling the status back because an
    // email failed would be the wrong trade.
    console.error("[shipped-email] threw for order", orderId, err);
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
