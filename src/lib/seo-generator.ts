/**
 * SEO helpers for owner-proof product and catalog content.
 *
 * Store owners should not need to understand meta tags or write product copy.
 * These helpers turn normal business data into clean product names, product
 * descriptions, page titles, and category/brand fallback descriptions.
 */

import { DEFAULTS } from "./defaults";
import type { StrainType } from "./strain-database";

export interface ProductForSeo {
  name: string;
  category: string;
  strainType: StrainType;
  strainName?: string;
  thc?: string;
  cbd?: string;
  brand?: string;
  description?: string;
  effects?: string[];
  terpenes?: string[];
  flavors?: string[];
  weight?: string;
  inStock?: boolean;
}

export interface SeoContext {
  storeName?: string;
  city?: string;
  state?: string;
  legalModelName?: string;
}

function resolveLegalModelName(ctx: SeoContext): string {
  const explicit = ctx.legalModelName?.trim();
  const generic = [
    DEFAULTS.legalModelName,
    "local compliance model",
    "applicable local regulations",
  ].map((value) => value.toLowerCase());

  if (explicit && !generic.includes(explicit.toLowerCase())) {
    return explicit;
  }

  const city = ctx.city || DEFAULTS.city;
  const state = ctx.state || DEFAULTS.state;
  const place =
    city === DEFAULTS.city && state === DEFAULTS.state
      ? "local"
      : state
      ? `${city}, ${state}`
      : city;

  return `${place} store policies`;
}

function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function titleCase(s: string): string {
  if (!s) return s;
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

const ACRONYMS: Record<string, string> = {
  nfc: "NFC",
  qr: "QR",
  usb: "USB",
  led: "LED",
  pos: "POS",
  dc: "DC",
};

function normalizeAcronyms(s: string): string {
  return s.replace(/\b(nfc|qr|usb|led|pos|dc)\b/gi, (match) => {
    return ACRONYMS[match.toLowerCase()] ?? match;
  });
}

function hasSeoValue(value: string | undefined): value is string {
  if (!value) return false;
  const v = value.trim();
  return v !== "" && v !== "-" && v !== "—" && v !== "â€”";
}

export function isStaleGeneratedSeoCopy(value: string | undefined | null): boolean {
  if (!value?.trim()) return true;
  const v = value.toLowerCase();
  return [
    DEFAULTS.storeName,
    DEFAULTS.city,
    DEFAULTS.state,
    DEFAULTS.legalModelName,
    "white label store",
    "your city",
    "your state",
    "local compliance model",
  ].some((token) => v.includes(token.toLowerCase()));
}

function sentenceList(items: string[]): string {
  const clean = items.map((item) => item.trim()).filter(Boolean);
  if (clean.length <= 1) return clean[0] ?? "";
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;
  return `${clean.slice(0, -1).join(", ")}, and ${clean[clean.length - 1]}`;
}

function shortSentence(value: string | undefined, fallback: string): string {
  const clean = value?.replace(/\s+/g, " ").trim();
  if (!clean) return fallback;
  const first = clean.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
  const out = first || clean;
  return out.length > 220 ? `${out.slice(0, 217).trim()}...` : out;
}

function strainProfile(type: string | undefined): string {
  const fallback = "featured";
  return STRAIN_TYPE_PROFILE[type as StrainType] ?? fallback;
}

export function cleanProductName(raw: string): string {
  if (!raw) return raw;
  let s = raw.trim().replace(/\s+/g, " ");

  const parts = s
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length > 1) {
    const cleanedParts = parts.filter((part, idx) => {
      const lower = part.toLowerCase();
      const isSize =
        /^\d+(?:\.\d+)?\s*(?:g|gram|grams|mg|oz|ounce|ounces|ml)\b/.test(lower) ||
        /^\d+\s*(?:pk|pack|ct|count)\b/.test(lower);
      const isContainer =
        /^(?:jar|bag|tin|box|case|pack|kit|sleeve|carton)$/i.test(part);
      const isLikelyPrefix = idx === 0 && /^[A-Z0-9]{2,5}$/i.test(part);
      return !isSize && !isContainer && !isLikelyPrefix;
    });
    if (cleanedParts.length > 0) s = cleanedParts.join(" ");
  }

  return s
    .replace(/\s*-\s*\d+(?:\.\d+)?\s*(?:g|mg|oz|ml)\b.*$/i, "")
    .replace(/\s+\d+(?:\.\d+)?\s*(?:g|mg|oz|ml)\b.*$/i, "")
    .replace(/\s*\((?:new|sale|clearance)\)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeImportedProductName(raw: string): string {
  return raw ? raw.trim().replace(/\s+/g, " ") : "";
}

export function seoTitleCase(s: string): string {
  return normalizeAcronyms(titleCase(cleanProductName(s)));
}

export function buildProductSearchPhrase(product: ProductForSeo): string {
  const display = seoTitleCase(product.name);
  const category = product.category || "product";
  const brand = product.brand ? ` by ${normalizeAcronyms(titleCase(product.brand))}` : "";
  return `${display}${brand} ${category}`
    .replace(/\s+/g, " ")
    .trim();
}

const CATEGORY_PITCH: Record<string, string[]> = {
  Default: [
    "Built for everyday use",
    "Quality checked before it ships",
    "A customer favorite",
    "Simple, reliable, ready to use",
  ],
  Accessories: [
    "Practical add-ons for daily use",
    "Small upgrades that make a difference",
    "Durable, well-finished accessories",
    "Handy accessories worth keeping",
  ],
  Hardware: [
    "Solid, well-built hardware",
    "Designed to hold up to daily handling",
    "Tested for reliable performance",
    "Sturdy hardware with a clean finish",
  ],
  Kits: [
    "Everything you need in one box",
    "A complete starter kit",
    "Bundled to save you a step",
    "Ready to set up out of the box",
  ],
  Signage: [
    "Clear, professional signage",
    "Designed to be noticed",
    "Clean signage for any counter",
    "Simple signage that stays readable",
  ],
};

const STRAIN_TYPE_PROFILE: Record<StrainType, string> = {
  Sativa: "featured",
  Indica: "popular",
  Hybrid: "versatile",
  CBD: "essential",
};

type DescTemplate = (p: {
  display: string;
  category: string;
  type: StrainType;
  strainNote: string;
  thcNote: string;
  cbdNote: string;
  brandNote: string;
  storeName: string;
  city: string;
  state: string;
  legalModelName: string;
}) => string;

const DESC_TEMPLATES: DescTemplate[] = [
  ({ display, category, type, brandNote, storeName, city, state, legalModelName }) =>
    `${display} is a ${STRAIN_TYPE_PROFILE[type]} ${category.toLowerCase()}${brandNote}. Shop ${display} at ${storeName} in ${city}${state ? `, ${state}` : ""}, with pickup and shipping handled under the ${legalModelName}.`,

  ({ display, category, type, brandNote, storeName, city }) => {
    const pitchOptions = CATEGORY_PITCH[category] ?? CATEGORY_PITCH.Default;
    const pitch = pitchOptions[hashString(display) % pitchOptions.length];
    return `${pitch}. ${display}${brandNote} is a ${STRAIN_TYPE_PROFILE[type]} choice for everyday use. Browse ${category.toLowerCase()} at ${storeName} in ${city} and order straight from the live catalog.`;
  },

  ({ display, category, type, brandNote, storeName, city, legalModelName }) =>
    `Looking for a dependable ${category.toLowerCase().replace(/s$/, "")} in ${city}? ${display}${brandNote} is a ${STRAIN_TYPE_PROFILE[type]} option with clear specifications and pricing. Add it to your ${storeName} order under the ${legalModelName}.`,

  ({ display, category, type, brandNote, storeName, city, legalModelName }) =>
    `Discover ${display}${brandNote} at ${storeName} in ${city}. This ${STRAIN_TYPE_PROFILE[type]} ${category.toLowerCase()} is listed in the live catalog under the ${legalModelName}. Check the catalog for current price and availability.`,
];

export function generateSeoDescription(
  product: ProductForSeo,
  ctx: SeoContext = {}
): string {
  const storeName = ctx.storeName || DEFAULTS.storeName;
  const city = ctx.city || DEFAULTS.city;
  const state = ctx.state || DEFAULTS.state;
  const legalModelName = resolveLegalModelName(ctx);
  const display = seoTitleCase(product.name);
  const category = product.category || "Product";
  const type = product.strainType;

  // Legacy spec fields are not surfaced in neutral storefront copy.
  const strainNote = "";
  const thcNote = "";
  const cbdNote = "";
  const brandNote = product.brand
    ? ` by ${normalizeAcronyms(titleCase(product.brand))}`
    : "";

  const tplIdx = hashString(display) % DESC_TEMPLATES.length;
  const out = DESC_TEMPLATES[tplIdx]({
    display,
    category,
    type,
    strainNote,
    thcNote,
    cbdNote,
    brandNote,
    storeName,
    city,
    state,
    legalModelName,
  });

  return out.replace(/\s+/g, " ").replace(/\s+([.,])/g, "$1").trim();
}

export function generateSeoTitle(
  product: ProductForSeo,
  ctx: SeoContext = {}
): string {
  const storeName = ctx.storeName || DEFAULTS.storeName;
  const city = ctx.city || DEFAULTS.city;
  const display = seoTitleCase(product.name);
  const category = product.category || "";

  const parts: string[] = [];
  parts.push(category ? `${display} ${category}` : display);
  if (hasSeoValue(product.weight)) parts[parts.length - 1] += ` - ${product.weight}`;
  if (product.brand) parts.push(normalizeAcronyms(titleCase(product.brand)));
  parts.push(`${storeName} ${city}`);

  let title = parts.join(" | ");
  if (title.length > 70) title = parts.slice(0, -1).join(" | ") + ` | ${storeName}`;
  if (title.length > 70) title = `${display} ${category} | ${storeName}`.trim();
  return title;
}

export interface ProductPageSeoCopy {
  displayName: string;
  shortDescription: string;
  aboutHeading: string;
  aboutBody: string;
  profileHeading: string;
  profileBody: string;
  localHeading: string;
  localBody: string;
  detailFacts: { label: string; value: string }[];
  faqs: { question: string; answer: string }[];
}

export function generateProductPageSeoCopy(
  product: ProductForSeo,
  ctx: SeoContext = {}
): ProductPageSeoCopy {
  const storeName = ctx.storeName || DEFAULTS.storeName;
  const city = ctx.city || DEFAULTS.city;
  const state = ctx.state || DEFAULTS.state;
  const legalModelName = resolveLegalModelName(ctx);
  const display = seoTitleCase(product.name);
  const category = product.category || "product";
  const categoryLower = category.toLowerCase();
  const brand = product.brand ? normalizeAcronyms(titleCase(product.brand)) : "";
  const type = product.strainType;
  const profile = strainProfile(type);
  const cityState = state ? `${city}, ${state}` : city;
  const sourceDescription = isStaleGeneratedSeoCopy(product.description)
    ? undefined
    : product.description;
  const shortDescription = shortSentence(
    sourceDescription,
    `${display} is a ${profile} ${categoryLower} listed in the ${storeName} catalog in ${cityState}.`
  );

  const featureText = sentenceList(product.effects ?? []);
  const highlightText = sentenceList(product.flavors ?? []);
  const specParts: string[] = [];
  if (hasSeoValue(product.weight)) specParts.push(product.weight);

  const brandPhrase = brand ? ` from ${brand}` : "";
  const specPhrase = specParts.length
    ? ` Current product details list ${sentenceList(specParts)}.`
    : "";
  const stockPhrase =
    product.inStock === false
      ? " This item is currently marked out of stock in the live catalog."
      : " Check the live catalog for current availability before checkout.";

  const profileBits = [
    `${display} is listed as a ${profile} ${categoryLower}${brandPhrase}.`,
    featureText ? `Key features listed for this product include ${featureText}.` : "",
    highlightText ? `Highlights include ${highlightText}.` : "",
    specPhrase.trim(),
  ].filter(Boolean);

  const detailFacts = [
    { label: "Product", value: display },
    brand ? { label: "Brand", value: brand } : null,
    { label: "Category", value: category },
    hasSeoValue(product.weight) ? { label: "Size", value: product.weight } : null,
    {
      label: "Availability",
      value: product.inStock === false ? "Out of stock" : "In stock",
    },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact));

  return {
    displayName: display,
    shortDescription,
    aboutHeading: `About ${display} in ${city}`,
    aboutBody: `${shortDescription} Shop ${display} at ${storeName} in ${cityState} and compare specifications, price, and availability before placing an order under the ${legalModelName}.`,
    profileHeading: `${display} product profile`,
    profileBody: `${profileBits.join(" ")}${stockPhrase}`.replace(/\s+/g, " ").trim(),
    localHeading: `Shop ${category} at ${storeName}`,
    localBody: `${storeName} keeps this ${categoryLower} page updated with product information for customers in ${city}. Browse related ${categoryLower}, compare specifications, price, and availability, then continue through the secure checkout with pickup or shipping.`,
    detailFacts,
    faqs: [
      {
        question: `Where can I find ${display} in ${city}?`,
        answer: `${display} is listed in the ${storeName} online catalog for customers in ${cityState}. Availability can change, so check the live catalog before ordering.`,
      },
      {
        question: `What kind of product is ${display}?`,
        answer: `${display} is a ${profile} ${categoryLower}${brand ? ` from ${brand}` : ""}. The product page includes current details such as category, specifications, and availability when provided by the store.`,
      },
      {
        question: `What specifications are listed for ${display}?`,
        answer: specParts.length
          ? `The current listing shows ${sentenceList(specParts)} for ${display}. Product details can vary by production run, so review the packaging at pickup or delivery.`
          : `No size or specification detail is listed for ${display} yet. Contact ${storeName} or review the packaging for full details.`,
      },
    ],
  };
}

export function generateCategorySeoDescription(input: {
  category: string;
  storeName?: string;
  city?: string;
  legalModelName?: string;
}): string {
  const category = input.category || "Products";
  const storeName = input.storeName || DEFAULTS.storeName;
  const city = input.city || DEFAULTS.city;
  const legalModelName = resolveLegalModelName({
    city,
    legalModelName: input.legalModelName,
  });
  return `Shop ${category.toLowerCase()} at ${storeName} in ${city}. Browse live inventory, compare product details, and place a local order under the ${legalModelName}.`;
}

export function generateBrandSeoDescription(input: {
  brand: string;
  storeName?: string;
  city?: string;
}): string {
  const brand = input.brand || "This brand";
  const storeName = input.storeName || DEFAULTS.storeName;
  const city = input.city || DEFAULTS.city;
  return `Browse ${brand} products available at ${storeName} in ${city}. Explore current catalog items, prices, specifications, and availability.`;
}
