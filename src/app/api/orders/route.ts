/**
 * /api/orders — creating and reading an order.
 *
 * POST does not take money. It records an order in `unpaid` and hands back a
 * Stripe client secret; the payment is confirmed by the webhook, which is the
 * only thing allowed to mark an order paid. That ordering matters: if the
 * browser were trusted to report success, anyone could claim it.
 *
 * Nothing about money is taken from the request. The client sends variant ids,
 * quantities and setup text; every price is read from the database by
 * quoteCart() and the totals are recomputed here.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db, ordersTable, orderItemsTable } from "@/lib/db";
import { isAdminSession } from "@/lib/admin-auth";
import { clientKey, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { getSiteSettings, invalidateSettings } from "@/lib/settings";
import { DEFAULTS } from "@/lib/defaults";
import { getOrderById } from "@/lib/data";
import { quoteCart, QuoteError } from "@/lib/checkout-quote";
import { createPaymentIntent, isStripeConfigured } from "@/lib/stripe";
import { calculateTax } from "@/lib/tax";
import {
  buildOrderEmailMessages,
  defaultOrderFromEmail,
  sendOrderEmailMessages,
} from "@/lib/order-email";

/** US state codes, so a typo cannot reach the tax calculation. */
const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH",
  "NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT",
  "VT","VA","WA","WV","WI","WY","PR","VI","GU","AS","MP",
] as const;

const Body = z.object({
  customerName: z.string().trim().min(2).max(120),
  customerEmail: z.string().trim().email().max(200),
  customerPhone: z.string().trim().min(7).max(40),
  notes: z.string().trim().max(1000).optional(),

  shipLine1: z.string().trim().min(3).max(200),
  shipLine2: z.string().trim().max(200).optional(),
  shipCity: z.string().trim().min(2).max(100),
  shipState: z.enum(US_STATES),
  shipPostalCode: z
    .string()
    .trim()
    .regex(/^\d{5}(-\d{4})?$/, "Enter a 5-digit ZIP code"),

  items: z
    .array(
      z.object({
        standVariantId: z.number().int().positive(),
        quantity: z.number().int().positive().max(99),
        setup: z.object({
          destinationUrl: z.string().max(2000),
          businessName: z.string().max(80).optional(),
          logoPath: z.string().max(200).nullable().optional(),
        }),
      })
    )
    .min(1)
    .max(50),
});

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateConfirmationCode(): string {
  const bytes = randomBytes(6);
  let code = DEFAULTS.confirmationCodePrefix;
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

export async function POST(req: Request) {
  // An order costs a Stripe call and a database write, so it is worth a limit
  // even though nothing here is a credential.
  const key = clientKey(req);
  const limit = rateLimit(`orders:${key}`, 12, 60_000);
  if (!limit.ok) {
    return tooManyRequests(limit.retryAfter, "Too many attempts. Wait a moment.");
  }

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const settings = await getSiteSettings();
  if (settings.ordering?.pause_all_orders) {
    return NextResponse.json(
      { error: "Orders are temporarily paused. Please try again later." },
      { status: 503 }
    );
  }

  if (!isStripeConfigured()) {
    console.error("[orders] STRIPE_SECRET_KEY is not set — cannot take payment");
    return NextResponse.json(
      { error: "Card payments are not switched on yet. Please try again later." },
      { status: 503 }
    );
  }

  try {
    // Every price comes from the database. Nothing about money is read from
    // the request body.
    const quote = await quoteCart(
      data.items.map((i) => ({
        standVariantId: i.standVariantId,
        quantity: i.quantity,
        destinationUrl: i.setup.destinationUrl,
        businessName: i.setup.businessName,
        logoPath: i.setup.logoPath ?? null,
      }))
    );

    if (quote.needsQuote) {
      return NextResponse.json(
        {
          error:
            "That is a large order — get in touch and we will quote it properly.",
        },
        { status: 400 }
      );
    }

    const address = {
      line1: data.shipLine1,
      line2: data.shipLine2 ?? "",
      city: data.shipCity,
      state: data.shipState,
      postalCode: data.shipPostalCode,
      country: "US" as const,
    };

    // Tax is calculated against the destination, on the amount actually being
    // charged including postage.
    const tax = await calculateTax({ quote, address });
    const totalCents = quote.totalBeforeTaxCents + tax.taxCents;

    const intent = await createPaymentIntent({
      amountCents: totalCents,
      email: data.customerEmail,
      metadata: {
        stands: String(quote.quantity),
        subtotal: String(quote.subtotalCents),
        shipping: String(quote.shippingCents),
        tax: String(tax.taxCents),
      },
    });

    const result = await db.transaction(async (tx) => {
      let code: string | null = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = generateConfirmationCode();
        const existing = await tx
          .select({ id: ordersTable.id })
          .from(ordersTable)
          .where(eq(ordersTable.confirmationCode, candidate))
          .limit(1);
        if (existing.length === 0) {
          code = candidate;
          break;
        }
      }
      if (!code) throw new Error("Could not generate confirmation code");

      const [order] = await tx
        .insert(ordersTable)
        .values({
          confirmationCode: code,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          notes: data.notes ?? null,
          status: "new",
          subtotalCents: quote.subtotalCents,
          discountCents: quote.discountCents,
          discountLabel: quote.discountLabel,
          shippingCents: quote.shippingCents,
          taxCents: tax.taxCents,
          totalPrice: totalCents,
          shipName: data.customerName,
          shipLine1: address.line1,
          shipLine2: address.line2,
          shipCity: address.city,
          shipState: address.state,
          shipPostalCode: address.postalCode,
          shipCountry: address.country,
          paymentStatus: "unpaid",
          stripePaymentIntentId: intent.id,
          stripeTaxCalculationId: tax.calculationId,
        })
        .returning();

      const items = await tx
        .insert(orderItemsTable)
        .values(
          quote.lines.map((line) => ({
            orderId: order.id,
            standVariantId: line.standVariantId,
            standName: line.standName,
            size: line.size,
            optionCode: line.optionCode,
            quantity: line.quantity,
            priceCents: line.priceCents,
            destinationUrl: line.destinationUrl,
            businessName: line.businessName,
            logoPath: line.logoPath,
          }))
        )
        .returning();

      return { ...order, items };
    });

    invalidateSettings();

    console.log(
      "[orders] created",
      result.confirmationCode,
      `${quote.quantity} stands,`,
      `total ${(totalCents / 100).toFixed(2)} USD,`,
      "awaiting payment"
    );

    // The confirmation email is sent by the webhook once the money actually
    // arrives. Sending it here would email a receipt for a card that has not
    // been charged yet.
    return NextResponse.json(
      {
        id: result.id,
        confirmationCode: result.confirmationCode,
        clientSecret: intent.clientSecret,
        amountCents: totalCents,
        breakdown: {
          subtotalCents: quote.subtotalCents,
          discountCents: quote.discountCents,
          discountLabel: quote.discountLabel,
          shippingCents: quote.shippingCents,
          taxCents: tax.taxCents,
          totalCents,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof QuoteError) {
      // These messages are written for a customer and describe something they
      // can act on, so they are safe to return.
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[orders] create failed:", err);
    return NextResponse.json(
      { error: "We could not start your order. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * Read one order.
 *
 * The id is a sequential integer, so this used to be an open list of every
 * customer's name, email, phone and notes to anyone who counted from 1. A
 * caller now needs either an admin session or the order's confirmation code,
 * which is the random value we already generate and email to the customer.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const idStr = url.searchParams.get("id");
  if (!idStr) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const id = parseInt(idStr, 10);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const order = await getOrderById(id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const supplied = url.searchParams.get("code")?.trim() ?? "";
  const codeMatches =
    supplied.length > 0 &&
    supplied.toUpperCase() === (order.confirmationCode ?? "").toUpperCase();

  if (!codeMatches && !(await isAdminSession())) {
    // Deliberately 404, not 403: a 403 would confirm the order exists.
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}
