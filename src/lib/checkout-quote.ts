import "server-only";
import { inArray, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { standVariantsTable, standsTable } from "@/lib/schema";
import {
  computeCartTotals,
  shippingCentsFor,
  CUSTOM_QUOTE_QUANTITY,
  type VolumeTierRule,
} from "@/lib/pricing";
import { getVolumeTiers } from "@/lib/stands-data";
import { validateDestination, urlFitsOnChip } from "@/lib/destination";

/**
 * The authoritative price of a cart.
 *
 * Everything the browser sends about money is a suggestion. The cart lives in
 * localStorage, where a customer can edit it with the developer tools open, so
 * the only inputs trusted here are the variant id, the quantity and the setup
 * text. Prices come from the database, the discount is recomputed, and the
 * shipping is derived. If the client disagrees, the client is wrong.
 *
 * This runs twice per order: once to show the customer a total, and again when
 * the payment intent is created. Both go through this same function, so the
 * quoted price and the charged price cannot drift apart.
 */

/** What the client is allowed to tell us about a line. */
export interface QuoteLineInput {
  standVariantId: number;
  quantity: number;
  destinationUrl: string;
  businessName?: string;
  logoPath?: string | null;
}

/** A line after the server has priced and validated it. */
export interface QuotedLine {
  standVariantId: number;
  standId: number;
  standName: string;
  standSlug: string;
  size: string;
  optionCode: string;
  quantity: number;
  /** Unit price from the database, in cents. */
  priceCents: number;
  monthlyCents: number;
  destinationUrl: string;
  businessName: string;
  logoPath: string | null;
}

export interface CheckoutQuote {
  lines: QuotedLine[];
  quantity: number;
  subtotalCents: number;
  discountPercent: number;
  discountCents: number;
  discountLabel: string;
  shippingCents: number;
  /** Everything except tax. Tax is added by the payment step. */
  totalBeforeTaxCents: number;
  monthlyCents: number;
  freeShipping: boolean;
  /** True when the order is large enough that it should be quoted by hand. */
  needsQuote: boolean;
}

export class QuoteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuoteError";
  }
}

const MAX_LINES = 50;
const MAX_QTY_PER_LINE = 99;
const MAX_BUSINESS_NAME = 40;

/**
 * Price a cart from the database.
 *
 * Throws QuoteError with a message written for a customer whenever the cart
 * cannot be honoured — an unknown variant, a stand taken off sale, a link that
 * would not work. Those are all things that can legitimately happen between
 * adding to the cart and paying.
 */
export async function quoteCart(
  input: QuoteLineInput[],
  tiersOverride?: VolumeTierRule[]
): Promise<CheckoutQuote> {
  if (!Array.isArray(input) || input.length === 0) {
    throw new QuoteError("Your cart is empty.");
  }
  if (input.length > MAX_LINES) {
    throw new QuoteError(
      `That is more than ${MAX_LINES} separate stands. Get in touch and we will quote it.`
    );
  }

  for (const line of input) {
    if (
      !Number.isInteger(line.quantity) ||
      line.quantity < 1 ||
      line.quantity > MAX_QTY_PER_LINE
    ) {
      throw new QuoteError("One of the quantities in your cart is not valid.");
    }
  }

  const ids = [...new Set(input.map((l) => l.standVariantId))];
  if (ids.some((id) => !Number.isInteger(id) || id < 1)) {
    throw new QuoteError("Your cart contains an item we do not recognise.");
  }

  const rows = await db
    .select({ variant: standVariantsTable, stand: standsTable })
    .from(standVariantsTable)
    .innerJoin(standsTable, eq(standsTable.id, standVariantsTable.standId))
    .where(inArray(standVariantsTable.id, ids));

  const byId = new Map(rows.map((r) => [r.variant.id, r]));

  const lines: QuotedLine[] = input.map((line) => {
    const row = byId.get(line.standVariantId);
    if (!row) {
      throw new QuoteError(
        "One of the stands in your cart is no longer available. Remove it and try again."
      );
    }
    // A variant can be un-ticked, or a whole stand taken off sale, after
    // something is already sitting in someone's cart.
    if (!row.variant.active || row.stand.status !== "active") {
      throw new QuoteError(
        `${row.stand.name} is not available at the moment. Remove it from your cart to continue.`
      );
    }
    if (row.variant.priceCents <= 0) {
      throw new QuoteError(
        `${row.stand.name} is not priced for sale. Remove it from your cart to continue.`
      );
    }

    // Re-validated here, not merely in the browser. This is the string that
    // gets burned onto a chip and printed as a QR code.
    const checked = validateDestination(line.destinationUrl ?? "");
    if (!checked.ok || !checked.url) {
      throw new QuoteError(
        `The link on your ${row.stand.name} is not valid. Edit it and try again.`
      );
    }
    if (!urlFitsOnChip(checked.url)) {
      throw new QuoteError(
        `The link on your ${row.stand.name} is too long to fit on the chip.`
      );
    }

    const branded = row.variant.optionCode !== "standard_direct";
    const businessName = (line.businessName ?? "").trim().slice(0, MAX_BUSINESS_NAME);
    if (branded && businessName.length < 2) {
      throw new QuoteError(
        `Your ${row.stand.name} needs a business name to print. Edit it and try again.`
      );
    }

    return {
      standVariantId: row.variant.id,
      standId: row.stand.id,
      standName: row.stand.name,
      standSlug: row.stand.slug,
      size: row.variant.size,
      optionCode: row.variant.optionCode,
      quantity: line.quantity,
      priceCents: row.variant.priceCents,
      monthlyCents: row.variant.monthlyCents ?? 0,
      destinationUrl: checked.url,
      businessName: branded ? businessName : "",
      // A logo path is only meaningful on a branded stand, and it must look
      // like something this site issued rather than an arbitrary URL.
      logoPath:
        branded && typeof line.logoPath === "string" &&
        /^\/objects\/uploads\/setup-logos\/[0-9a-f-]{36}$/.test(line.logoPath)
          ? line.logoPath
          : null,
    };
  });

  const tiers = tiersOverride ?? (await getVolumeTiers());
  const totals = computeCartTotals(
    lines.map((l) => ({
      priceCents: l.priceCents,
      quantity: l.quantity,
      monthlyCents: l.monthlyCents,
    })),
    tiers
  );

  const shippingCents = shippingCentsFor(totals.totalCents);

  return {
    lines,
    quantity: totals.quantity,
    subtotalCents: totals.subtotalCents,
    discountPercent: totals.discountPercent,
    discountCents: totals.discountCents,
    discountLabel: totals.appliedTier?.label ?? "",
    shippingCents,
    totalBeforeTaxCents: totals.totalCents + shippingCents,
    monthlyCents: totals.monthlyCents,
    freeShipping: shippingCents === 0,
    needsQuote: totals.quantity >= CUSTOM_QUOTE_QUANTITY,
  };
}
