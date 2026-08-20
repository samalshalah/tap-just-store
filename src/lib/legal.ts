/**
 * legal.ts — the handful of facts every legal page depends on.
 *
 * Everything the policies assert about the business lives here so there is
 * exactly one place to correct it. Values fall back to site settings where
 * the admin already maintains them.
 *
 * CONFIRM BEFORE LAUNCH: LEGAL_ENTITY, GOVERNING_LAW and the fulfilment
 * windows below are commercial decisions, not code. Change them here.
 */

export const LEGAL = {
  /** Registered trading name used in the policies. */
  entity: "Tap Rater",
  /** Where disputes are governed. Confirm this matches where the business is registered. */
  governingLaw: "the District of Columbia, United States",
  /** Business days between order and dispatch for a standard stand. */
  dispatchDaysStandard: "1–2 business days",
  /** Branded stands are printed to order, so they take longer. */
  dispatchDaysBranded: "2–4 business days",
  /** Typical transit once dispatched. */
  transitDays: "3–7 business days",
  /** Return window for unused, non-personalised stands. */
  returnWindowDays: 30,
  /** Warranty on the stand and the NFC chip inside it. */
  warrantyMonths: 12,
  /** Monthly price of the hosted multi-link landing page, in cents. */
  hostedMonthlyCents: 999,
  /** Grace period after a failed payment before the landing page stops resolving. */
  hostedGraceDays: 7,
  /** Shown as the effective date on every policy. Bump when you change one. */
  lastUpdated: "August 20, 2026",
} as const;

export const LEGAL_PAGES = [
  { href: "/shipping-returns", label: "Shipping & Returns" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
] as const;
