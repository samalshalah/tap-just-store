import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getStandBySlug, getActiveStands, getVolumeTiers } from "@/lib/stands-data";
import { standCopy, standSeoTitle, standSeoDescription } from "@/lib/stand-copy";
import { formatMoney } from "@/lib/money";
import { StandDetail } from "@/components/stands/StandDetail";

export async function generateStaticParams() {
  const stands = await getActiveStands();
  return stands.map((s) => ({ slug: s.stand.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getStandBySlug(slug);
  if (!detail) return { title: "Stand not found" };
  return {
    title: standSeoTitle(detail.stand, detail.standType?.name ?? null, detail.fromCents),
    description: standSeoDescription(detail.stand, detail.fromCents),
  };
}

export default async function StandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [detail, tiers] = await Promise.all([getStandBySlug(slug), getVolumeTiers()]);
  if (!detail) notFound();

  const { stand, standType, variants, businessUses, fromCents } = detail;
  const copy = standCopy(stand);

  return (
    <div className="container mx-auto px-4 py-10">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/shop" className="hover:text-accent">
          Shop
        </Link>
        {standType && (
          <>
            <span className="mx-2">/</span>
            <Link href={`/stands/type/${standType.slug}`} className="hover:text-accent">
              {standType.name}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-foreground">{stand.name}</span>
      </nav>

      <StandDetail
        standName={stand.name}
        variants={variants.map((v) => ({
          size: v.size,
          optionCode: v.optionCode,
          priceCents: v.priceCents,
          monthlyCents: v.monthlyCents,
          active: v.active,
        }))}
        mainImageUrl={stand.mainImageUrl}
        brandedImageUrl={stand.brandedImageUrl}
        tiers={tiers}
      >
        <span className="inline-block rounded-full bg-foreground/85 px-3 py-1 text-[10px] font-bold tracking-wider text-background">
          {copy.badge}
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold text-foreground md:text-4xl">
          {stand.name}
        </h1>
        <p className="mt-3 text-muted-foreground">
          One tap opens {copy.destinationPhrase}. No app for your customer, nothing to
          install, and it works on iPhone and Android.
        </p>
        <p className="mt-4 text-2xl font-bold text-foreground">
          From {formatMoney(fromCents)}
        </p>
      </StandDetail>

      {businessUses.length > 0 && (
        <div className="mt-14 border-t border-border pt-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Popular with
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {businessUses.map((u) => (
              <Link
                key={u.id}
                href={`/for/${u.slug}`}
                className="rounded-full border border-border px-3 py-1 text-sm text-foreground/80 hover:border-accent/50 hover:text-accent"
              >
                {u.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
