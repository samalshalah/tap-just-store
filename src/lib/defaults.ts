/**
 * defaults.ts
 *
 * Every hardcoded user-facing string lives here. Admin-overridable settings
 * always take precedence — these are the fallbacks when settings are empty.
 *
 * This file is the neutral white-label fallback layer. Real storefronts should
 * override these values through admin settings, database seed data, or
 * deployment environment variables.
 */

export const DEFAULTS = {
  // --- Brand basics ---
  storeName: "White Label Store",
  tagline: "Premium products, curated locally.",

  // --- City / region context (drives local SEO copy) ---
  city: "Your City",
  state: "Your State",

  // --- Legal model ---
  // Configure this per market: adult-use, medical, delivery, pickup, etc.
  legalModelName: "applicable local regulations",
  ageGateMessage:
    "Please confirm you meet the requirements to view this site. {store} complies with all applicable local regulations.",
  termsText:
    "I agree to the terms of sale and the store's return policy.",
  checkoutFooter: "Secure checkout",
  cashOnlyNotice: "Payment collected on pickup.",

  // --- Homepage hero ---
  heroBadge: "New Arrivals",
  heroHeadline: "Premium products, curated locally.",
  heroSubheadline:
    "Explore a carefully selected menu with simple ordering, local pickup, and a polished customer experience.",
  heroCtaPrimary: "Shop Now",
  heroCtaSecondary: "Our Story",

  // --- Section labels ---
  categoriesLabel: "Browse The Store",
  categoriesTitle: "Shop By Category",
  whyUsLabel: "Why Shop With Us",
  whyUsTitle: "A better local retail experience.",
  whyUsSubtitle:
    "We combine curated products, thoughtful service, and reliable fulfillment so customers know exactly what to expect.",
  testimonialsLabel: "Testimonials",
  testimonialsTitle: "What Customers Say",
  newsletterLabel: "Stay In The Know",
  newsletterTitle: "Join The VIP List",
  newsletterSubtitle:
    "Subscribe for new product alerts, special offers, and local updates directly to your inbox.",

  // --- SEO ---
  seoTitleTemplate: "{page} | {store}",
  seoMetaDescription:
    "{store} — premium products with simple online ordering and fast fulfillment.",

  // --- Order confirmation prefix ---
  // Each storefront should change this. Format: e.g. "WL-AB12CD"
  confirmationCodePrefix: "TJ-",
} as const;

export type Defaults = typeof DEFAULTS;
