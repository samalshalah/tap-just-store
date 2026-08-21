import type { SiteSettings } from "./types";
import type { StandListItem } from "./stands-data";
import type { StandType, BusinessUse } from "./schema";
import { DEFAULTS } from "./defaults";

export type SeoHealthStatus = "good" | "warning" | "missing";

export interface SeoHealthItem {
  label: string;
  detail: string;
  status: SeoHealthStatus;
  href?: string;
}

export interface SeoHealthReport {
  score: number;
  items: SeoHealthItem[];
}

function hasValue(value: unknown): boolean {
  return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
}


/**
 * Grade what the site actually sells.
 *
 * This used to grade the white-label catalogue — products, categories, brands,
 * and a set of generated service-area pages, none of which exist any more. The
 * crawlable surface now is: the stands themselves, the /stands/type/<slug>
 * pages, and the /for/<slug> business-use pages. Each item below maps to one of
 * those, so a warning here is something a person can actually go and fix.
 */
export function buildSeoHealthReport(input: {
  settings: SiteSettings;
  stands: StandListItem[];
  types: StandType[];
  uses: BusinessUse[];
  /** Active stands per business-use slug, from getBusinessUseCounts(). */
  useCounts: Record<string, number>;
}): SeoHealthReport {
  const { settings, stands, types, uses, useCounts } = input;
  const store = settings.store ?? {};
  const seo = settings.seo ?? {};
  const location = settings.location ?? {};

  const missingSeoTitle = stands.filter((s) => !hasValue(s.stand.seoTitle)).length;
  const missingSeoDescription = stands.filter(
    (s) => !hasValue(s.stand.seoDescription)
  ).length;
  const missingImage = stands.filter((s) => !hasValue(s.stand.mainImageUrl)).length;

  // A landing page with nothing under it 404s, so an empty taxonomy row is a real fault.
  const emptyTypes = types
    .filter((t) => stands.every((s) => s.stand.standTypeId !== t.id))
    .map((t) => t.name);
  const emptyUses = uses.filter((u) => (useCounts[u.slug] ?? 0) === 0).map((u) => u.name);
  const typesMissingHero = types.filter((t) => !hasValue(t.heroImageUrl)).length;
  const usesMissingHero = uses.filter((u) => !hasValue(u.heroImageUrl)).length;

  const items: SeoHealthItem[] = [
    {
      label: "Store name",
      detail: hasValue(store.name)
        ? `Using "${store.name}"`
        : "Set the public store name so every title and schema tag has the right brand.",
      status: hasValue(store.name) && store.name !== DEFAULTS.storeName ? "good" : "missing",
      href: "/admin/store/info",
    },
    {
      label: "City and state",
      detail:
        hasValue(location.city) || hasValue(seo.city)
          ? `Local SEO city: ${location.city || seo.city}`
          : "Add the primary city so landing copy and schema can target local searches.",
      status: hasValue(location.city) || hasValue(seo.city) ? "good" : "warning",
      href: "/admin/store/info",
    },
    {
      label: "Canonical domain",
      detail: hasValue(seo.canonical_domain)
        ? `Canonical domain: ${seo.canonical_domain}`
        : "Add the final domain without https:// after DNS is ready.",
      status: hasValue(seo.canonical_domain) ? "good" : "warning",
      href: "/admin/store/seo",
    },
    {
      label: "Indexing",
      detail: seo.robots_noindex
        ? "Search engines are currently blocked from indexing the site."
        : "Search engines are allowed to index public pages.",
      status: seo.robots_noindex ? "missing" : "good",
      href: "/admin/store/seo",
    },
    {
      label: "Structured data",
      detail:
        seo.auto_structured_data === false
          ? "JSON-LD structured data is disabled, so stands cannot show rich results."
          : "Store and product structured data is enabled.",
      status: seo.auto_structured_data === false ? "warning" : "good",
      href: "/admin/store/seo",
    },
    {
      label: "Stands live",
      detail:
        stands.length > 0
          ? `${stands.length} active stands are crawlable and in the sitemap.`
          : "No active stands. The shop, the sitemap, and every landing page are empty.",
      status: stands.length > 0 ? "good" : "missing",
      href: "/admin/stands",
    },
    {
      label: "Stand SEO titles",
      detail:
        stands.length === 0
          ? "No stands to check yet."
          : missingSeoTitle === 0
          ? `All ${stands.length} stands have a custom SEO title.`
          : `${missingSeoTitle}/${stands.length} stands fall back to the stand name in search results.`,
      status: stands.length === 0 ? "warning" : missingSeoTitle === 0 ? "good" : "warning",
      href: "/admin/stands",
    },
    {
      label: "Stand meta descriptions",
      detail:
        stands.length === 0
          ? "No stands to check yet."
          : missingSeoDescription === 0
          ? `All ${stands.length} stands have a meta description.`
          : `${missingSeoDescription}/${stands.length} stands have no meta description, so Google writes its own.`,
      status:
        stands.length === 0 ? "warning" : missingSeoDescription === 0 ? "good" : "warning",
      href: "/admin/stands",
    },
    {
      label: "Stand images",
      detail:
        stands.length === 0
          ? "No stands to check yet."
          : missingImage === 0
          ? "Every stand has a main image for cards, Open Graph, and product schema."
          : `${missingImage}/${stands.length} stands have no main image.`,
      status: stands.length === 0 ? "warning" : missingImage === 0 ? "good" : "missing",
      href: "/admin/stands",
    },
    {
      label: "Stand type pages",
      detail:
        types.length === 0
          ? "No stand types, so /stands/type/... has nothing to index."
          : emptyTypes.length === 0
          ? `${types.length} type landing pages, all with stands behind them.`
          : `Empty and returning 404: ${emptyTypes.join(", ")}.`,
      status: types.length === 0 ? "missing" : emptyTypes.length === 0 ? "good" : "warning",
      href: "/admin/shop-categories",
    },
    {
      label: "Business use pages",
      detail:
        uses.length === 0
          ? "No business uses, so /for/... has nothing to index."
          : emptyUses.length === 0
          ? `${uses.length} use landing pages, all with stands behind them.`
          : `Empty and returning 404: ${emptyUses.join(", ")}.`,
      status: uses.length === 0 ? "missing" : emptyUses.length === 0 ? "good" : "warning",
      href: "/admin/shop-categories",
    },
    {
      label: "Landing hero images",
      detail:
        typesMissingHero + usesMissingHero === 0
          ? "Every landing page has a hero image for the page and its Open Graph card."
          : `${typesMissingHero + usesMissingHero} landing pages have no hero image.`,
      status: typesMissingHero + usesMissingHero === 0 ? "good" : "warning",
      href: "/admin/shop-categories",
    },
    {
      label: "Google verification",
      detail: hasValue(seo.google_site_verification)
        ? "Search Console verification token is saved."
        : "Add the Google Search Console verification token before launch.",
      status: hasValue(seo.google_site_verification) ? "good" : "warning",
      href: "/admin/store/seo",
    },
  ];

  const good = items.filter((item) => item.status === "good").length;
  const score = Math.round((good / items.length) * 100);
  return { score, items };
}
