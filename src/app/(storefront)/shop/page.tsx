import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getSiteSettings } from "@/lib/settings";
import { DEFAULTS } from "@/lib/defaults";
import { getVolumeTiers } from "@/lib/stands-data";
import { getCatalogView } from "@/lib/shop-catalog";
import { parseShopQuery, isFiltered } from "@/lib/shop-filter";
import { ShopFilters } from "@/components/stands/ShopFilters";
import { StandGrid } from "@/components/stands/StandGrid";
import { formatMoney } from "@/lib/money";

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const [settings, params] = await Promise.all([getSiteSettings(), searchParams]);
  const storeName = settings.store?.name || DEFAULTS.storeName;
  const query = parseShopQuery(params);

  return {
    title: `Shop NFC Stands | ${storeName}`,
    description:
      "NFC stands for reviews, bookings, menus, social profiles and more. One tap sends your customers exactly where you want them. From $39.",
    alternates: { canonical: "/shop" },
    // Filtered states are the same products in a different order — the
    // landing pages are what should rank, not a thousand query strings.
    robots: isFiltered(query) ? { index: false, follow: true } : undefined,
  };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = parseShopQuery(params);

  const [view, tiers] = await Promise.all([getCatalogView(query), getVolumeTiers()]);
  const { results, typeOptions, useOptions, typeName, useName } = view;

  const heading = typeName ?? useName ?? "All stands";
  const firstTier = tiers[0];

  return (
    <>
      <section className="border-b border-border/50 bg-card py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">
            NFC Stands
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            One tap sends your customer exactly where you want them. Choose the stand,
            add your link, and it arrives ready to use.
          </p>
          {firstTier && (
            <p className="mt-4 inline-block rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-sm font-semibold text-accent">
              Mix and match — {firstTier.label.toLowerCase()}
            </p>
          )}
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <Suspense fallback={null}>
          <ShopFilters
            standTypes={typeOptions}
            businessUses={useOptions}
            query={query}
            resultCount={results.length}
          />
        </Suspense>

        <div className="mt-10 flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-bold text-foreground">{heading}</h2>
          <p className="text-sm text-muted-foreground">
            {results.length} {results.length === 1 ? "stand" : "stands"}
          </p>
        </div>

        <div className="mt-6">
          <StandGrid results={results} />
        </div>

        <p className="mt-12 text-center text-sm text-muted-foreground">
          Every stand starts at {formatMoney(3900)}. Need 25 or more?{" "}
          <Link
            href="/custom-stands"
            className="font-semibold text-accent hover:underline"
          >
            Ask for a quote
          </Link>
          .
        </p>
      </section>
    </>
  );
}
