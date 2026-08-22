import "server-only";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import type { CheckoutQuote } from "@/lib/checkout-quote";

/**
 * Sales tax, via Stripe Tax.
 *
 * US sales tax is not one rate. It is a per-state, often per-jurisdiction
 * question, and the obligation to collect in a state begins once you cross
 * that state's economic-nexus threshold — which happens without warning as a
 * business grows. Hard-coding a rate is how a small seller quietly builds a
 * liability they have to pay out of their own pocket later.
 *
 * So the rate comes from Stripe Tax, calculated against the shipping address.
 * Two things follow from that:
 *
 *  - Stripe Tax must be enabled and an origin address set in the Stripe
 *    dashboard, or every calculation fails. That is configuration, not code.
 *  - A calculation is not a filing record. After the payment succeeds the
 *    webhook records a *transaction* against the calculation id, which is what
 *    Stripe's reporting and any filing integration actually reads.
 *
 * If the calculation fails, this throws rather than falling back to zero.
 * Charging no tax because an API call failed is a silent liability, and the
 * customer seeing "we could not complete checkout" is the better outcome.
 */

export interface TaxAddress {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: "US";
}

export interface TaxResult {
  taxCents: number;
  /** Recorded on the order so the webhook can create the tax transaction. */
  calculationId: string | null;
}

export async function calculateTax({
  quote,
  address,
}: {
  quote: CheckoutQuote;
  address: TaxAddress;
}): Promise<TaxResult> {
  if (!isStripeConfigured()) {
    throw new Error("Cannot calculate tax: Stripe is not configured");
  }

  // The discount is spread across the lines rather than sent as a negative
  // line, because Stripe Tax has no concept of a discount line — the taxable
  // amount has to be the amount actually being charged.
  const discountRatio =
    quote.subtotalCents > 0
      ? (quote.subtotalCents - quote.discountCents) / quote.subtotalCents
      : 1;

  const lineItems = quote.lines.map((line) => ({
    amount: Math.round(line.priceCents * line.quantity * discountRatio),
    reference: `variant-${line.standVariantId}`,
    quantity: line.quantity,
    // A physical good. Getting this wrong is how a state's clothing or
    // digital-goods exemption gets applied to an acrylic stand.
    tax_code: "txcd_99999999",
  }));

  const calculation = await stripe().tax.calculations.create({
    currency: "usd",
    customer_details: {
      address: {
        line1: address.line1,
        line2: address.line2 || undefined,
        city: address.city,
        state: address.state,
        postal_code: address.postalCode,
        country: address.country,
      },
      address_source: "shipping",
    },
    line_items: lineItems,
    shipping_cost: { amount: quote.shippingCents },
    expand: ["line_items"],
  });

  return {
    taxCents: calculation.tax_amount_exclusive,
    calculationId: calculation.id ?? null,
  };
}

/**
 * Turn a calculation into a filing record, once the money has actually moved.
 *
 * Called from the webhook, never from the checkout request: a calculation the
 * customer abandoned must not appear in a tax filing.
 */
export async function recordTaxTransaction({
  calculationId,
  reference,
}: {
  calculationId: string;
  reference: string;
}): Promise<void> {
  await stripe().tax.transactions.createFromCalculation({
    calculation: calculationId,
    reference,
  });
}
