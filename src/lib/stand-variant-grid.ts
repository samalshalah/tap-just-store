/**
 * The size x option rows a stand is sold in.
 *
 * Lives outside stands-admin.ts because that file is "use server" and may only
 * export async functions — a plain constant there turns every admin page into
 * a 500.
 */

export const DEFAULT_VARIANT_GRID = [
  { size: "a5", optionCode: "standard_direct", priceCents: 3900, monthlyCents: 0 },
  { size: "a5", optionCode: "branded_qr_direct", priceCents: 4900, monthlyCents: 0 },
  { size: "a4", optionCode: "standard_direct", priceCents: 4900, monthlyCents: 0 },
  { size: "a4", optionCode: "branded_qr_direct", priceCents: 6500, monthlyCents: 0 },
] as const;

/** Added only when a stand is hosted multi-link. */
export const MULTILINK_VARIANT_GRID = [
  { size: "a5", optionCode: "hosted_multilink", priceCents: 4900, monthlyCents: 999 },
  { size: "a4", optionCode: "hosted_multilink", priceCents: 6500, monthlyCents: 999 },
] as const;

export function slugifyStand(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
