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
  /**
   * Warranty on the stand and the NFC chip inside it.
   *
   * This is a lifetime warranty, and two things about how it is worded are
   * legal requirements rather than style. The FTC requires that a "lifetime"
   * claim say *whose* life measures it, hence warrantyTerm — the original
   * purchaser's period of ownership. And any written warranty over $10 must be
   * designated Full or Limited; this one covers the original purchaser only,
   * so it is Limited. Both appear in warrantyName.
   *
   * It is cheap to honour: the chip is passive, so there is no battery and no
   * read-cycle limit, and the acrylic does not degrade on an indoor counter.
   * The realistic claims are dead-on-arrival chips and cracked stands, both of
   * which would be replaced anyway.
   */
  warrantyName: "Limited Lifetime Warranty",
  warrantyTerm: "for as long as you own it",
  /** Monthly price of the hosted multi-link landing page, in cents. */
  hostedMonthlyCents: 999,
  /** Grace period after a failed payment before the landing page stops resolving. */
  hostedGraceDays: 7,
  /**
   * What the stand is, in the words used on every page that describes it.
   *
   * "Waterproof" is deliberately absent. The supplier lists it as a feature
   * with no IP rating, no test standard and no report, and the FTC requires a
   * reasonable basis before an objective claim is made. Water-resistant is
   * both true and sufficient — the worry a buyer actually has is a spilled
   * drink, not immersion.
   */
  material: "solid 3mm acrylic",
  waterClaim: "Water-resistant and wipe-clean",
  printClaim: "Printed into the acrylic, not a sticker",
  chip: "NTAG213",
  chipFrequency: "13.56 MHz",
  /** Why the copy says "tap it against the stand" and never "hold it near". */
  readDistance: "2–5 cm",
  /** Background NFC tag reading landed with this generation of iPhone. */
  minIphone: "iPhone XR / XS (2018)",

  /** Shown as the effective date on every policy. Bump when you change one. */
  lastUpdated: "August 21, 2026",
} as const;

export const LEGAL_PAGES = [
  { href: "/warranty", label: "Warranty" },
  { href: "/shipping-returns", label: "Shipping & Returns" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
] as const;
