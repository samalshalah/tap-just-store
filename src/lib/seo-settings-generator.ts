import { DEFAULTS } from "./defaults";
import type { SeoConfig, SiteSettings } from "./types";

function valueOrFallback(value: string | undefined, fallback: string): string {
  const clean = value?.trim();
  return clean ? clean : fallback;
}

function cityState(city: string, state: string): string {
  if (!state || state === DEFAULTS.state) return city;
  return `${city}, ${state}`;
}

export function generateLocalSeoSettings(settings: SiteSettings): SeoConfig {
  const existing = settings.seo ?? {};
  const storeName = valueOrFallback(settings.store?.name, DEFAULTS.storeName);
  const city = valueOrFallback(
    settings.location?.city || existing.city,
    DEFAULTS.city
  );
  const state = valueOrFallback(settings.location?.state, DEFAULTS.state);
  const place = cityState(city, state);
  const storeLower =
    storeName === DEFAULTS.storeName ? "the store" : storeName;

  return {
    ...existing,
    title_template: "{page} | {store} | {city}",
    meta_description: `${storeName} is an online store in ${place} with a live product catalog, detailed specifications, curated brands, fast shipping, and local pickup for every order.`,
    city,
    auto_structured_data: true,
    page_home: {
      ...(existing.page_home ?? {}),
      title: `${storeName} | Online Store in ${place}`,
      description: `Browse the ${storeName} catalog in ${place}. Shop live inventory by category, brand, product type, and price, with shipping and local pickup options.`,
    },
    page_shop: {
      ...(existing.page_shop ?? {}),
      title: `Shop Products in ${place} | ${storeName}`,
      description: `Shop the ${storeName} catalog in ${place}. Filter products by category, brand, product type, price, and availability before you order.`,
    },
    page_product: {
      ...(existing.page_product ?? {}),
      title: `{product} | ${storeName} ${place}`,
      description: `Shop {product}, a {category} product, at ${storeLower} in ${place}. View specifications, brand details, availability, and shipping and pickup information.`,
    },
    page_category: {
      ...(existing.page_category ?? {}),
      title: `{page} Products | ${storeName} ${place}`,
      description: `Shop {page} products at ${storeName} in ${place}. Browse live availability, brands, specifications, prices, and delivery information.`,
    },
    page_brand: {
      ...(existing.page_brand ?? {}),
      title: `{page} Products | ${storeName} ${place}`,
      description: `Browse {page} products at ${storeName} in ${place}. Compare catalog items, categories, product details, and shipping availability.`,
    },
    page_blog: {
      ...(existing.page_blog ?? {}),
      title: `Guides and Resources | ${storeName} ${place}`,
      description: `Read ${storeName} resources for ${place} shoppers, including buying guides, product setup tips, shipping and pickup help, FAQs, and store updates.`,
    },
  };
}
