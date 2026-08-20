import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getBusinessUseBySlug,
  getBusinessUses,
  getBusinessUseCounts,
  getStandTypes,
  getActiveStands,
  getStandsByBusinessUse,
  getUseNamesByStandId,
} from "@/lib/stands-data";
import { applyShopFilters, EMPTY_QUERY } from "@/lib/shop-filter";
import { useCopy } from "@/lib/landing-copy";
import { LandingPage } from "@/components/stands/LandingPage";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  const use = await getBusinessUseBySlug(slug);
  if (!use) return null;

  const [scoped, useNames] = await Promise.all([
    getStandsByBusinessUse(slug),
    getUseNamesByStandId(),
  ]);
  if (scoped.length === 0) return null;

  return { use, results: applyShopFilters(scoped, EMPTY_QUERY, useNames) };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) return {};

  const copy = useCopy(slug, data.use.name);
  const from = Math.min(...data.results.map((r) => r.fromCents));

  return {
    title: `${copy.heading} | Tap Rater`,
    description: `${copy.intro.slice(0, 150)}`.trim(),
    alternates: { canonical: `/for/${slug}` },
    openGraph: {
      title: copy.heading,
      description: `${data.results.length} stands from $${Math.round(from / 100)}.`,
      type: "website",
    },
  };
}

export default async function BusinessUsePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) notFound();

  const [uses, useCounts, types, all] = await Promise.all([
    getBusinessUses(),
    getBusinessUseCounts(),
    getStandTypes(),
    getActiveStands(),
  ]);

  const useLinks = uses
    .filter((u) => u.slug !== slug)
    .map((u) => ({
      name: u.name,
      href: `/for/${u.slug}`,
      count: useCounts[u.slug] ?? 0,
    }))
    .filter((u) => u.count > 0);

  const typeLinks = types
    .map((t) => ({
      name: t.name,
      href: `/stands/type/${t.slug}`,
      count: all.filter((s) => s.standType?.slug === t.slug).length,
    }))
    .filter((t) => t.count > 0);

  return (
    <LandingPage
      breadcrumb={[
        { name: "Home", href: "/" },
        { name: "Shop", href: "/shop" },
        { name: data.use.name, href: `/for/${slug}` },
      ]}
      copy={useCopy(slug, data.use.name)}
      results={data.results}
      crossLinksTitle="Other businesses like yours"
      crossLinks={[...useLinks, ...typeLinks]}
    />
  );
}
