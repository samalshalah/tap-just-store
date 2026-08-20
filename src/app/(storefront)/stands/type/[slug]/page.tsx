import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getStandTypeBySlug,
  getStandTypes,
  getBusinessUses,
  getBusinessUseCounts,
  getActiveStands,
  getUseNamesByStandId,
} from "@/lib/stands-data";
import { applyShopFilters, EMPTY_QUERY } from "@/lib/shop-filter";
import { typeCopy } from "@/lib/landing-copy";
import { LandingPage } from "@/components/stands/LandingPage";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  const type = await getStandTypeBySlug(slug);
  if (!type) return null;

  const [all, useNames] = await Promise.all([
    getActiveStands(),
    getUseNamesByStandId(),
  ]);
  const scoped = all.filter((s) => s.standType?.slug === slug);
  // An empty category is a thin page. Better a 404 than something that ranks
  // for a term and then shows nothing to buy.
  if (scoped.length === 0) return null;

  return {
    type,
    results: applyShopFilters(scoped, EMPTY_QUERY, useNames),
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) return {};

  const copy = typeCopy(slug, data.type.name);
  const from = Math.min(...data.results.map((r) => r.fromCents));

  return {
    title: `${copy.heading} | Tap Rater`,
    description: `${copy.intro.slice(0, 150)}`.trim(),
    alternates: { canonical: `/stands/type/${slug}` },
    openGraph: {
      title: copy.heading,
      description: `${data.results.length} stands from $${Math.round(from / 100)}.`,
      type: "website",
    },
  };
}

export default async function StandTypePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) notFound();

  const [types, uses, useCounts, all] = await Promise.all([
    getStandTypes(),
    getBusinessUses(),
    getBusinessUseCounts(),
    getActiveStands(),
  ]);

  const crossLinks = types
    .filter((t) => t.slug !== slug)
    .map((t) => ({
      name: t.name,
      href: `/stands/type/${t.slug}`,
      count: all.filter((s) => s.standType?.slug === t.slug).length,
    }))
    .filter((t) => t.count > 0);

  const useLinks = uses
    .map((u) => ({
      name: u.name,
      href: `/for/${u.slug}`,
      count: useCounts[u.slug] ?? 0,
    }))
    .filter((u) => u.count > 0);

  return (
    <LandingPage
      breadcrumb={[
        { name: "Home", href: "/" },
        { name: "Shop", href: "/shop" },
        { name: data.type.name, href: `/stands/type/${slug}` },
      ]}
      copy={typeCopy(slug, data.type.name)}
      results={data.results}
      crossLinksTitle="Other stand types"
      crossLinks={[...crossLinks, ...useLinks]}
    />
  );
}
