import type { Metadata } from "next";
import { Suspense } from "react";
import { getSiteSettings } from "@/lib/settings";
import { DEFAULTS } from "@/lib/defaults";
import {
  getActiveStands,
  getStandTypes,
  getBusinessUses,
  getStandsByBusinessUse,
} from "@/lib/stands-data";
import { StandCard } from "@/components/stands/StandCard";
import { ShopFilters } from "@/components/stands/ShopFilters";
import { formatMoney } from "@/lib/money";
import { getVolumeTiers } from "@/lib/stands-data";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const storeName = settings.store?.name || DEFAULTS.storeName;
  return {
    title: `Shop NFC Stands | ${storeName}`,
    description:
      "NFC stands for reviews, bookings, menus, social profiles and more. One tap sends your customers exactly where you want them. From $39.",
  };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; use?: string }>;
}) {
  const params = await searchParams;
  const activeType = params.type ?? null;
  const activeUse = params.use ?? null;

  const [allStands, standTypes, businessUses, tiers] = await Promise.all([
    getActiveStands(),
    getStandTypes(),
    getBusinessUses(),
    getVolumeTiers(),
  ]);

  // Counts come from the tagged relationships — a stand is never duplicated.
  const typeOptions = standTypes
    .map((t) => ({
      slug: t.slug,
      name: t.name,
      count: allStands.filter((s) => s.standType?.slug === t.slug).length,
    }))
    .filter((t) => t.count > 0);

  const usesWithStands = await Promise.all(
    businessUses.map(async (u) => ({
      slug: u.slug,
      name: u.name,
      count: (await getStandsByBusinessUse(u.slug)).length,
    }))
  );
  const useOptions = usesWithStands.filter((u) => u.count > 0);

  let visible = allStands;
  if (activeType) visible = visible.filter((s) => s.standType?.slug === activeType);
  if (activeUse) visible = await getStandsByBusinessUse(activeUse);

  const heading =
    standTypes.find((t) => t.slug === activeType)?.name ??
    businessUses.find((u) => u.slug === activeUse)?.name ??
    "All stands";

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
            activeType={activeType}
            activeUse={activeUse}
          />
        </Suspense>

        <div className="mt-10 flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-bold text-foreground">{heading}</h2>
          <p className="text-sm text-muted-foreground">
            {visible.length} {visible.length === 1 ? "stand" : "stands"}
          </p>
        </div>

        {visible.length === 0 ? (
          <p className="py-20 text-center text-muted-foreground">
            Nothing here yet. Try another category.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
            {visible.map((item) => (
              <StandCard key={item.stand.id} item={item} />
            ))}
          </div>
        )}

        <p className="mt-12 text-center text-sm text-muted-foreground">
          Every stand starts at {formatMoney(3900)}. Need 25 or more?{" "}
          <a href="/custom-stands" className="font-semibold text-accent hover:underline">
            Ask for a quote
          </a>
          .
        </p>
      </section>
    </>
  );
}
