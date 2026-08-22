import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { z } from "zod";

/**
 * An order.
 *
 * Two things about the shape are deliberate.
 *
 * **Every amount is stored, not just the total.** A single `total_price`
 * cannot answer "what did I pay for shipping?" when a customer disputes a
 * charge, or "how much tax did I collect in Virginia last quarter?" when it
 * is time to file. Subtotal, discount, shipping and tax are each recorded as
 * charged, and the total is stored alongside them rather than recomputed —
 * so what we can prove we charged never drifts from what Stripe captured.
 *
 * **Fulfilment and payment are separate columns.** `status` is where the
 * order is (pending, printing, shipped); `paymentStatus` is whether the money
 * arrived. They genuinely come apart: an order can be paid and unprinted, or
 * shipped and later refunded. Collapsing them into one column is how a
 * refunded order quietly stays "complete".
 */
export const ordersTable = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    /**
     * Unique because the code is an authorisation token for the confirmation
     * page, and because the collision-retry loop in /api/orders was checking
     * for a duplicate with nothing stopping two concurrent transactions
     * choosing the same one.
     */
    confirmationCode: text("confirmation_code").notNull().unique(),

    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email").notNull(),
    customerPhone: text("customer_phone").notNull(),
    notes: text("notes"),

    /**
     * Fulfilment state — see order-status.ts for the machine. Not payment.
     *
     * new | in_production | shipped | delivered | cancelled
     */
    status: text("status").notNull().default("new"),

    // Amounts, all integer cents.
    subtotalCents: integer("subtotal_cents").notNull().default(0),
    discountCents: integer("discount_cents").notNull().default(0),
    /** e.g. "Buy 3, save 15%" — what the customer was told they saved. */
    discountLabel: text("discount_label").notNull().default(""),
    shippingCents: integer("shipping_cents").notNull().default(0),
    taxCents: integer("tax_cents").notNull().default(0),
    /** The amount actually charged. Named for the legacy column it replaces. */
    totalPrice: integer("total_price").notNull(),

    // Shipping address. US-only today, but the country is stored rather than
    // assumed, so opening another market is data rather than a migration.
    shipName: text("ship_name").notNull().default(""),
    shipLine1: text("ship_line1").notNull().default(""),
    shipLine2: text("ship_line2").notNull().default(""),
    shipCity: text("ship_city").notNull().default(""),
    shipState: text("ship_state").notNull().default(""),
    shipPostalCode: text("ship_postal_code").notNull().default(""),
    shipCountry: text("ship_country").notNull().default("US"),

    // Payment.
    paymentStatus: text("payment_status").notNull().default("unpaid"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    stripeTaxCalculationId: text("stripe_tax_calculation_id"),
    paidAt: timestamp("paid_at", { withTimezone: true }),

    // Shipping. The database enforces that a shipped or delivered order has
    // both a carrier and a number, because the shipped email depends on it.
    carrier: text("carrier"),
    trackingNumber: text("tracking_number"),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    /**
     * Set when the shipped email actually goes out.
     *
     * A status walked back to production and forward again must not email the
     * customer a second tracking link — this is what stops that.
     */
    shippedEmailSentAt: timestamp("shipped_email_sent_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("orders_created_at_idx").on(t.createdAt),
    index("orders_status_idx").on(t.status),
    index("orders_payment_status_idx").on(t.paymentStatus),
    /**
     * One order per payment intent — this is the idempotency guarantee.
     * Stripe retries webhooks and customers double-click Pay; without this,
     * a retried webhook is a second order for the same money.
     */
    uniqueIndex("orders_payment_intent_key").on(t.stripePaymentIntentId),
  ]
);

export const PAYMENT_STATUSES = [
  "unpaid",
  "processing",
  "paid",
  "failed",
  "refunded",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const insertOrderSchema = z.object({
  confirmationCode: z.string(),
  customerName: z.string(),
  customerEmail: z.string(),
  customerPhone: z.string(),
  notes: z.string().optional(),
  status: z.string().optional(),
  subtotalCents: z.number().int(),
  discountCents: z.number().int(),
  discountLabel: z.string(),
  shippingCents: z.number().int(),
  taxCents: z.number().int(),
  totalPrice: z.number().int(),
});
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
