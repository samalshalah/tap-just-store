import { eq, and } from "drizzle-orm";
import { db, ordersTable, orderItemsTable } from "@/lib/db";
import { verifyWebhook } from "@/lib/stripe";
import { recordTaxTransaction } from "@/lib/tax";
import { getSiteSettings } from "@/lib/settings";
import {
  buildOrderEmailMessages,
  defaultOrderFromEmail,
  sendOrderEmailMessages,
} from "@/lib/order-email";

/**
 * Stripe webhook — the only thing that may mark an order paid.
 *
 * The browser is not allowed to report success. It can be told to say
 * anything, and "the customer's page said it worked" is not evidence that
 * money moved. Stripe signs this request with a shared secret, we verify that
 * signature, and only then does an order change state.
 *
 * Idempotency is structural rather than clever. Stripe retries a webhook until
 * it gets a 2xx, and it can deliver the same event more than once regardless.
 * Every write here is conditioned on the order still being unpaid, so a
 * repeated delivery updates zero rows and sends no second email.
 *
 * Note the runtime: the raw body text is required for signature verification,
 * so it must not be parsed as JSON first.
 */
export const runtime = "nodejs";

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event;
  try {
    event = await verifyWebhook(payload, signature);
  } catch (err) {
    // A bad signature is either a misconfiguration or someone trying to mark
    // their own order paid. Both are a flat 400 with nothing useful in it.
    console.error("[stripe] webhook signature rejected:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await markPaid(event.data.object.id, req);
        break;

      case "payment_intent.payment_failed":
        await markFailed(event.data.object.id);
        break;

      case "charge.refunded":
        await markRefunded(event.data.object.payment_intent);
        break;

      default:
        // Everything else is acknowledged so Stripe stops retrying it.
        break;
    }
  } catch (err) {
    // A 500 makes Stripe retry, which is what we want for a transient
    // database problem — the event is not lost.
    console.error(`[stripe] handling ${event.type} failed:`, err);
    return new Response("Handler failed", { status: 500 });
  }

  return Response.json({ received: true });
}

async function markPaid(paymentIntentId: string, req: Request) {
  // Conditioned on `unpaid`, so a redelivered event updates nothing and the
  // customer is not emailed a second receipt.
  const [order] = await db
    .update(ordersTable)
    .set({
      paymentStatus: "paid",
      paidAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(ordersTable.stripePaymentIntentId, paymentIntentId),
        eq(ordersTable.paymentStatus, "unpaid")
      )
    )
    .returning();

  if (!order) {
    console.log("[stripe] payment_intent.succeeded already handled:", paymentIntentId);
    return;
  }

  const items = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, order.id));

  // Only now does this sale become a tax record. A calculation made for a
  // customer who abandoned checkout must never reach a filing.
  if (order.stripeTaxCalculationId) {
    try {
      await recordTaxTransaction({
        calculationId: order.stripeTaxCalculationId,
        reference: order.confirmationCode,
      });
    } catch (err) {
      // Worth shouting about, but not worth failing the webhook and having
      // Stripe retry a payment that genuinely succeeded.
      console.error("[stripe] tax transaction failed for", order.confirmationCode, err);
    }
  }

  // The receipt goes out here rather than at checkout, so it can only ever
  // describe a card that was actually charged.
  try {
    const settings = await getSiteSettings();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
    const result = await sendOrderEmailMessages({
      apiKey: process.env.RESEND_API_KEY,
      messages: buildOrderEmailMessages({
        settings,
        order: { ...order, items },
        siteUrl,
        fromEmail:
          process.env.RESEND_FROM_EMAIL ?? defaultOrderFromEmail(settings, siteUrl),
      }),
    });
    if (result.failed > 0) {
      console.warn("[stripe] order email failed:", result.errors);
    }
  } catch (err) {
    console.error("[stripe] order email threw:", err);
  }

  console.log("[stripe] paid:", order.confirmationCode);
}

async function markFailed(paymentIntentId: string) {
  await db
    .update(ordersTable)
    .set({ paymentStatus: "failed", updatedAt: new Date() })
    .where(
      and(
        eq(ordersTable.stripePaymentIntentId, paymentIntentId),
        eq(ordersTable.paymentStatus, "unpaid")
      )
    );
}

async function markRefunded(paymentIntent: string | { id: string } | null) {
  const id = typeof paymentIntent === "string" ? paymentIntent : paymentIntent?.id;
  if (!id) return;
  // Deliberately does not touch `status`: a refunded order may still have
  // shipped, and the fulfilment state is a separate fact from the money.
  await db
    .update(ordersTable)
    .set({ paymentStatus: "refunded", updatedAt: new Date() })
    .where(eq(ordersTable.stripePaymentIntentId, id));
}
