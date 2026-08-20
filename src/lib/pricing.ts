/**
 * pricing.ts — Tap Rater pricing rules.
 *
 * Every amount here is integer CENTS (see money.ts).
 *
 * Volume discounts are mix-and-match: they apply to the total number of
 * stands in the cart regardless of face, size or option. Print-on-demand
 * means a third design costs us nothing, so there is no reason to make a
 * customer buy three of the same thing to qualify.
 */

export interface VolumeTierRule {
  minQuantity: number;
  discountPercent: number;
  label: string;
}

/** Fallback used when the database is unreachable. Keep in sync with volume_tiers. */
export const DEFAULT_VOLUME_TIERS: VolumeTierRule[] = [
  { minQuantity: 3, discountPercent: 15, label: "Buy 3, save 15%" },
  { minQuantity: 5, discountPercent: 20, label: "Buy 5, save 20%" },
  { minQuantity: 10, discountPercent: 25, label: "Buy 10, save 25%" },
];

/** Orders at or above this quantity are quoted, not checked out. */
export const CUSTOM_QUOTE_QUANTITY = 25;

/** Free shipping threshold — set so that adding branding to one A5 reaches it. */
export const FREE_SHIPPING_CENTS = 4900;

/** The tier that applies at a given total quantity, or null below the first tier. */
export function tierForQuantity(
  quantity: number,
  tiers: VolumeTierRule[] = DEFAULT_VOLUME_TIERS
): VolumeTierRule | null {
  let best: VolumeTierRule | null = null;
  for (const tier of tiers) {
    if (quantity >= tier.minQuantity) {
      if (!best || tier.minQuantity > best.minQuantity) best = tier;
    }
  }
  return best;
}

/** The next tier up, for "add one more and save" prompts. */
export function nextTier(
  quantity: number,
  tiers: VolumeTierRule[] = DEFAULT_VOLUME_TIERS
): VolumeTierRule | null {
  const upcoming = tiers
    .filter((t) => t.minQuantity > quantity)
    .sort((a, b) => a.minQuantity - b.minQuantity);
  return upcoming[0] ?? null;
}

export interface CartTotals {
  quantity: number;
  subtotalCents: number;
  discountPercent: number;
  discountCents: number;
  totalCents: number;
  appliedTier: VolumeTierRule | null;
  nextTier: VolumeTierRule | null;
  freeShipping: boolean;
  needsQuote: boolean;
  monthlyCents: number;
}

export interface PricedLine {
  priceCents: number;
  quantity: number;
  /** Recurring charge per line, if any (hosted multi-link). */
  monthlyCents?: number;
}

/**
 * Recompute a cart from its lines. The server must call this rather than
 * trusting any total sent by the client.
 */
export function computeCartTotals(
  lines: PricedLine[],
  tiers: VolumeTierRule[] = DEFAULT_VOLUME_TIERS
): CartTotals {
  const quantity = lines.reduce((sum, l) => sum + l.quantity, 0);
  const subtotalCents = lines.reduce((sum, l) => sum + l.priceCents * l.quantity, 0);

  const applied = tierForQuantity(quantity, tiers);
  const discountPercent = applied?.discountPercent ?? 0;
  const discountCents = Math.round((subtotalCents * discountPercent) / 100);
  const totalCents = Math.max(0, subtotalCents - discountCents);

  // One hosted page per order, not per stand: several stands in one venue
  // point at the same page and pay one subscription.
  const monthlyCents = lines.reduce((max, l) => Math.max(max, l.monthlyCents ?? 0), 0);

  return {
    quantity,
    subtotalCents,
    discountPercent,
    discountCents,
    totalCents,
    appliedTier: applied,
    nextTier: nextTier(quantity, tiers),
    freeShipping: totalCents >= FREE_SHIPPING_CENTS,
    needsQuote: quantity >= CUSTOM_QUOTE_QUANTITY,
    monthlyCents,
  };
}
