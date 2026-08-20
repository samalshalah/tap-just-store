import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Truck, Wifi, QrCode } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";
import { DEFAULTS } from "@/lib/defaults";
import {
  getActiveStands,
  getStandTypes,
  getBusinessUses,
  getBusinessUseCounts,
  getVolumeTiers,
} from "@/lib/stands-data";
import { StandCard } from "@/components/stands/StandCard";
import { UseCard } from "@/components/stands/UseCard";
import { useCopy } from "@/lib/landing-copy";
import { formatMoney } from "@/lib/money";

export default async function HomePage() {
  const [settings, stands, standTypes, businessUses, useCounts, tiers] =
    await Promise.all([
      getSiteSettings(),
      getActiveStands(),
      getStandTypes(),
      getBusinessUses(),
      getBusinessUseCounts(),
      getVolumeTiers(),
    ]);

  const storeName = settings.store?.name || DEFAULTS.storeName;
  const hero = settings.homepage_sections?.hero ?? {};
  const featured = stands.slice(0, 4);

  const typesWithCounts = standTypes
    .map((t) => ({ ...t, count: stands.filter((s) => s.standType?.slug === t.slug).length }))
    .filter((t) => t.count > 0);

  // Photographed uses lead the grid, so the row never opens with an empty card.
  const useCards = businessUses
    .map((u) => ({
      slug: u.slug,
      copy: useCopy(u.slug, u.name),
      imageUrl: u.heroImageUrl || null,
      count: useCounts[u.slug] ?? 0,
    }))
    .filter((u) => u.count > 0)
    .sort((a, b) => Number(Boolean(b.imageUrl)) - Number(Boolean(a.imageUrl)));

  return (
    <>
      {/* Hero */}
      <section className="border-b border-border/50 bg-card">
        <div className="container mx-auto px-4 py-20 text-center">
          <span className="inline-block rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-bold tracking-widest text-accent">
            {hero.badge || "NFC STANDS"}
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl font-display text-4xl font-bold leading-tight text-foreground md:text-6xl">
            {hero.headline || "One tap. That is the whole thing."}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            {hero.subheadline ||
              "Put a stand on your counter and your customers go straight where you need them."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href={hero.cta_primary_link || "/shop"}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 font-bold text-background transition-opacity hover:opacity-90"
            >
              {hero.cta_primary || "Shop stands"} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={hero.cta_secondary_link || "/how-it-works"}
              className="rounded-full border border-border px-8 py-4 font-bold text-foreground transition-colors hover:border-accent/60"
            >
              {hero.cta_secondary || "How it works"}
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            From {formatMoney(3900)} · No monthly fee · Works on iPhone and Android
          </p>
        </div>
      </section>

      {/* Shop by business — the cards */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-[-0.02em] text-foreground">
              Shop by business
            </h2>
            <p className="mt-1 text-muted-foreground">
              Start with what you do. Every card opens the stands that suit it.
            </p>
          </div>
          <Link
            href="/shop"
            className="text-sm font-bold text-accent hover:underline"
          >
            See all stands
          </Link>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {useCards.map((u) => (
            <UseCard
              key={u.slug}
              href={`/for/${u.slug}`}
              copy={u.copy}
              imageUrl={u.imageUrl}
              count={u.count}
            />
          ))}
        </div>
      </section>

      {/* Shop by stand type */}
      <section className="border-t border-border/50 bg-card py-14">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-2xl font-bold text-foreground">
            Or shop by stand type
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Start with what you want people to do.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {typesWithCounts.map((t) => (
              <Link
                key={t.slug}
                href={`/stands/type/${t.slug}`}
                className="rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground/85 transition-colors hover:border-accent/60 hover:text-accent"
              >
                {t.name}
                <span className="ml-1.5 text-xs text-muted-foreground">{t.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured stands */}
      {featured.length > 0 && (
        <section className="border-y border-border/50 bg-card py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-2xl font-bold text-foreground">
                Most popular
              </h2>
              <Link href="/shop" className="text-sm font-bold text-accent hover:underline">
                See all stands →
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-5 lg:grid-cols-4">
              {featured.map((item) => (
                <StandCard key={item.stand.id} item={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it works, short */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-center font-display text-2xl font-bold text-foreground">
          How it works
        </h2>
        <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-3">
          {[
            { icon: QrCode, title: "Pick your stand", body: "Choose the action you want — a review, a booking, your menu." },
            { icon: Wifi, title: "Add your link", body: "We program it into the chip before it ships. It works out of the box." },
            { icon: ShieldCheck, title: "Put it on the counter", body: "Your customer taps. No app, nothing to install, iPhone and Android." },
          ].map((s) => (
            <div key={s.title} className="rounded-2xl border border-border p-6 text-center">
              <s.icon className="mx-auto h-7 w-7 text-accent" aria-hidden="true" />
              <h3 className="mt-4 font-display font-bold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Branded upsell */}
      <section className="border-t border-border/50 bg-card py-16">
        <div className="container mx-auto grid items-center gap-10 px-4 md:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-border bg-white">
            <Image
              src="/images/stands/google-review-stand-branded.webp"
              alt="A stand printed with your logo, business name and QR code"
              width={900}
              height={900}
              className="h-auto w-full"
            />
          </div>
          <div>
            <span className="text-xs font-bold tracking-widest text-accent">
              MAKE IT YOURS
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold text-foreground">
              Add your logo and a printed QR
            </h2>
            <p className="mt-4 text-muted-foreground">
              Every stand comes in two setups. Standard Direct is NFC only, printed with our
              artwork. Branded + QR adds your logo, your business name and a scannable QR
              code — so people can use it whether or not their phone taps.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
              <li>· You approve a proof before anything is printed</li>
              <li>· Only {formatMoney(1000)} more on A5</li>
              <li>· Still one payment, still no monthly fee</li>
            </ul>
            <Link
              href="/pricing"
              className="mt-7 inline-block rounded-full border border-accent px-6 py-3 font-bold text-accent transition-colors hover:bg-accent/10"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Volume + custom */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-border p-8">
            <Truck className="h-7 w-7 text-accent" aria-hidden="true" />
            <h2 className="mt-4 font-display text-xl font-bold text-foreground">
              Buying a few?
            </h2>
            <p className="mt-2 text-muted-foreground">
              {tiers.map((t) => `${t.minQuantity}+ save ${t.discountPercent}%`).join(" · ")}
              . Mix sizes, faces and setups however you like.
            </p>
            <Link href="/shop" className="mt-5 inline-block font-bold text-accent hover:underline">
              Browse stands →
            </Link>
          </div>
          <div className="rounded-2xl border border-border p-8">
            <ShieldCheck className="h-7 w-7 text-accent" aria-hidden="true" />
            <h2 className="mt-4 font-display text-xl font-bold text-foreground">
              Need something custom?
            </h2>
            <p className="mt-2 text-muted-foreground">
              Your own artwork across many locations, with a page per stand so you can see
              which sites actually bring in customers.
            </p>
            <Link
              href="/custom-stands"
              className="mt-5 inline-block font-bold text-accent hover:underline"
            >
              Request a quote →
            </Link>
          </div>
        </div>
      </section>

      <section className="sr-only">
        <h2>{storeName}</h2>
      </section>
    </>
  );
}
