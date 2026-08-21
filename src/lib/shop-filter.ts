/**
 * shop-filter.ts — pure filtering and sorting for the shop grid.
 *
 * Kept free of React and of the database so it can be unit tested and so the
 * same rules apply on the catalog page and on every landing page.
 *
 * Rules that matter here:
 *  - the price shown always reflects the size and option the shopper picked,
 *    so the grid never advertises $39 on a card that costs $65 once opened
 *  - a stand with no active variant matching the filters drops out of the
 *    grid rather than showing $0.00
 *  - search matches the words a business owner would actually type
 *    ("google", "restaurant menu", "booking"), not just the product name
 */

import type { StandListItem } from "./stands-data";

export const SIZES = ["a5", "a4"] as const;
export type Size = (typeof SIZES)[number];

export const OPTIONS = [
  "standard_direct",
  "branded_qr_direct",
  "hosted_multilink",
] as const;
export type OptionCode = (typeof OPTIONS)[number];

export const SORTS = ["featured", "price-asc", "price-desc", "name"] as const;
export type SortKey = (typeof SORTS)[number];

// Size labels live in sizes.ts, not here. This module is deliberately free of
// every runtime import so it can be loaded straight into the test runner.

export const OPTION_LABELS: Record<OptionCode, string> = {
  standard_direct: "Standard",
  branded_qr_direct: "Branded + QR",
  hosted_multilink: "Multi-link",
};

export const SORT_LABELS: Record<SortKey, string> = {
  featured: "Featured",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  name: "Name: A to Z",
};

export interface ShopQuery {
  q: string;
  type: string | null;
  use: string | null;
  size: Size | null;
  option: OptionCode | null;
  sort: SortKey;
}

export const EMPTY_QUERY: ShopQuery = {
  q: "",
  type: null,
  use: null,
  size: null,
  option: null,
  sort: "featured",
};

function oneOf<T extends string>(
  value: string | string[] | undefined,
  allowed: readonly T[]
): T | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  return (allowed as readonly string[]).includes(raw) ? (raw as T) : null;
}

function single(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : null;
}

/** Anything unrecognised is dropped rather than 404ing or throwing. */
export function parseShopQuery(
  params: Record<string, string | string[] | undefined>
): ShopQuery {
  return {
    q: single(params.q)?.slice(0, 80) ?? "",
    type: single(params.type),
    use: single(params.use),
    size: oneOf(params.size, SIZES),
    option: oneOf(params.option, OPTIONS),
    sort: oneOf(params.sort, SORTS) ?? "featured",
  };
}

/** True when any filter is set — used to decide noindex and "clear all". */
export function isFiltered(query: ShopQuery): boolean {
  return Boolean(
    query.q || query.type || query.use || query.size || query.option
  );
}

/**
 * Lowest active price for the chosen size and option.
 * Returns null when the stand has nothing matching, which removes it
 * from the grid instead of showing a misleading price.
 */
export function priceFor(
  item: StandListItem,
  size: Size | null,
  option: OptionCode | null
): number | null {
  const matching = item.variants.filter(
    (v) =>
      v.active &&
      (size === null || v.size === size) &&
      (option === null || v.optionCode === option)
  );
  if (matching.length === 0) return null;
  return Math.min(...matching.map((v) => v.priceCents));
}

/** Recurring cost for the chosen filters, 0 for a one-off stand. */
export function monthlyFor(
  item: StandListItem,
  size: Size | null,
  option: OptionCode | null
): number {
  const matching = item.variants.filter(
    (v) =>
      v.active &&
      (size === null || v.size === size) &&
      (option === null || v.optionCode === option)
  );
  if (matching.length === 0) return 0;
  return Math.min(...matching.map((v) => v.monthlyCents ?? 0));
}

function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** The words a shopper might type to find this stand. */
export function searchHaystack(
  item: StandListItem,
  useNames: string[] = []
): string {
  return normalise(
    [
      item.stand.name,
      item.stand.slug.replace(/-/g, " "),
      item.stand.destinationLabel ?? "",
      item.stand.badge ?? "",
      item.stand.printedHeadline ?? "",
      item.standType?.name ?? "",
      ...useNames,
    ].join(" ")
  );
}

/** Every term must appear somewhere, so "google review" is narrower than "google". */
export function matchesSearch(haystack: string, q: string): boolean {
  const terms = normalise(q).split(" ").filter(Boolean);
  if (terms.length === 0) return true;
  return terms.every((term) => haystack.includes(term));
}

export interface ShopResult {
  item: StandListItem;
  /** Price to display, already reflecting the active size and option. */
  fromCents: number;
  monthlyCents: number;
}

/**
 * Apply search, size, option and sort.
 *
 * Type and use filtering happens before this, in the data layer, because
 * those two are tagged relationships that need the database.
 */
export function applyShopFilters(
  items: StandListItem[],
  query: ShopQuery,
  useNamesByStandId: Record<number, string[]> = {}
): ShopResult[] {
  const results: ShopResult[] = [];

  for (const item of items) {
    const fromCents = priceFor(item, query.size, query.option);
    if (fromCents === null) continue;

    if (query.q) {
      const haystack = searchHaystack(item, useNamesByStandId[item.stand.id] ?? []);
      if (!matchesSearch(haystack, query.q)) continue;
    }

    results.push({
      item,
      fromCents,
      monthlyCents: monthlyFor(item, query.size, query.option),
    });
  }

  switch (query.sort) {
    case "price-asc":
      results.sort(
        (a, b) =>
          a.fromCents - b.fromCents ||
          a.item.stand.sortOrder - b.item.stand.sortOrder
      );
      break;
    case "price-desc":
      results.sort(
        (a, b) =>
          b.fromCents - a.fromCents ||
          a.item.stand.sortOrder - b.item.stand.sortOrder
      );
      break;
    case "name":
      results.sort((a, b) => a.item.stand.name.localeCompare(b.item.stand.name));
      break;
    default:
      results.sort(
        (a, b) =>
          a.item.stand.sortOrder - b.item.stand.sortOrder ||
          a.item.stand.name.localeCompare(b.item.stand.name)
      );
  }

  return results;
}
