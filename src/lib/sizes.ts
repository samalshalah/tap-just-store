/**
 * The two stand sizes, in words a US buyer understands.
 *
 * The database keys stay "a5" and "a4" — they are stable, they match the print
 * templates, and renaming a key means a migration for no gain. What changed is
 * everything a customer sees. "A5" is a European paper standard; an American
 * small-business owner has no idea whether that fits on their counter, and a
 * size selector that has to be looked up is a size selector that loses sales.
 *
 * So each size carries three things: a plain name, the dimensions in inches
 * first and centimetres second, and a comparison to a sheet of paper. That last
 * one does the real work — US Letter is 8.5 x 11in and A4 is 8.3 x 11.7in, so
 * "a full sheet of paper" is accurate to within a quarter inch and needs no
 * thought at all. A5 is exactly half of A4, so "half a sheet" is exact.
 *
 * The paper name is kept as a quiet aside for the people who do know it, and
 * because it is what the artwork templates are named.
 */

export const SIZE_KEYS = ["a5", "a4"] as const;
export type SizeKey = (typeof SIZE_KEYS)[number];

export interface StandSize {
  key: SizeKey;
  /** What the buyer sees first. */
  label: string;
  /** Inches lead, because this store sells to the US. */
  inches: string;
  centimetres: string;
  /** Both units on one line, for tight spaces. */
  dims: string;
  /** The line that actually communicates the size. */
  compare: string;
  /** The paper standard, kept as a secondary note and for print templates. */
  paperName: string;
}

export const STAND_SIZES: Record<SizeKey, StandSize> = {
  a5: {
    key: "a5",
    label: "Small",
    inches: '5.8" × 8.3"',
    centimetres: "15 × 21 cm",
    dims: '5.8" × 8.3" · 15 × 21 cm',
    compare: "About half a sheet of paper",
    paperName: "A5",
  },
  a4: {
    key: "a4",
    label: "Large",
    inches: '8.3" × 11.7"',
    centimetres: "21 × 30 cm",
    dims: '8.3" × 11.7" · 21 × 30 cm',
    compare: "About a full sheet of paper",
    paperName: "A4",
  },
};

export function isSizeKey(value: string): value is SizeKey {
  return (SIZE_KEYS as readonly string[]).includes(value);
}

/** Safe lookup for a size that came out of the database. */
export function standSize(key: string): StandSize | null {
  return isSizeKey(key) ? STAND_SIZES[key] : null;
}

/** "Small" — for chips, filters and anywhere a single word is all that fits. */
export function sizeLabel(key: string): string {
  return standSize(key)?.label ?? key.toUpperCase();
}

/** `Small (5.8" × 8.3")` — for prose and order lines, where context is needed. */
export function sizeLabelWithDims(key: string): string {
  const size = standSize(key);
  return size ? `${size.label} (${size.inches})` : key.toUpperCase();
}
