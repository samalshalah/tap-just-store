/**
 * money.ts — all monetary amounts in this app are integer CENTS.
 *
 * The database stores cents (products.price, products.sale_price,
 * orders.total_price, order_items.price_per_item). Never render a raw
 * amount — always go through formatMoney so the decimal point is right.
 *
 * Admin-entered settings that represent money (minimum order, delivery
 * fee, deal thresholds and flat discounts) are still captured in whole
 * dollars in the settings JSON, and are converted with dollarsToCents at
 * the point of use.
 */

/** 3999 -> "$39.99" */
export function formatMoney(cents: number | null | undefined): string {
  const value = typeof cents === "number" && Number.isFinite(cents) ? cents : 0;
  return `$${(value / 100).toFixed(2)}`;
}

/** 3999 -> "39.99" (for form inputs, no currency symbol) */
export function centsToInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined || !Number.isFinite(cents)) return "";
  return (cents / 100).toFixed(2);
}

/** "39.99" | 39.99 -> 3999. Returns 0 for unparseable input. */
export function dollarsToCents(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const raw = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.\-]/g, ""));
  if (!Number.isFinite(raw)) return 0;
  return Math.round(raw * 100);
}

/** 3999 -> 39.99 (number, for arithmetic against dollar-denominated settings) */
export function centsToDollars(cents: number): number {
  return cents / 100;
}
