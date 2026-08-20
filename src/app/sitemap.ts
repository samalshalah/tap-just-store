import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/settings";
import {
  getActiveStands,
  getStandTypes,
  getBusinessUses,
  getBusinessUseCounts,
} from "@/lib/stands-data";
import { DEFAULTS } from "@/lib/defaults";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSiteSettings();
  const baseUrl = (
    settings.seo?.canonical_domain ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://taprater.com"
  ).replace(/\/$/, "");
  void DEFAULTS;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/shop`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/how-it-works`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/custom-stands`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/support`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/faqs`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/shipping-returns`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
  ];

  let standRoutes: MetadataRoute.Sitemap = [];
  let facetRoutes: MetadataRoute.Sitemap = [];
  try {
    const [stands, types, uses, useCounts] = await Promise.all([
      getActiveStands(),
      getStandTypes(),
      getBusinessUses(),
      getBusinessUseCounts(),
    ]);
    standRoutes = stands.map((s) => ({
      url: `${baseUrl}/stands/${s.stand.slug}`,
      lastModified: s.stand.updatedAt ?? new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));
    // Only categories that actually have a stand: an empty landing page 404s,
    // and a sitemap full of 404s is worse than a short sitemap.
    facetRoutes = [
      ...types
        .filter((t) => stands.some((s) => s.standType?.slug === t.slug))
        .map((t) => ({
          url: `${baseUrl}/stands/type/${t.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        })),
      ...uses
        .filter((u) => (useCounts[u.slug] ?? 0) > 0)
        .map((u) => ({
          url: `${baseUrl}/for/${u.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        })),
    ];
  } catch (err) {
    console.error("[sitemap] stand routes failed:", err);
  }

  return [...staticRoutes, ...standRoutes, ...facetRoutes];
}
