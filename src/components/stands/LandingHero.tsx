import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ArrowRight } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { wideVariant } from "@/lib/landing-images";
import type { LandingCopy } from "@/lib/landing-copy";

/**
 * The landing-page hero: one template, two columns.
 *
 * Left is the words — eyebrow, headline, one line of copy, the price line and
 * the call to action. Right is the photograph, filling its column edge to edge
 * and cropping to whatever height the words need. The row is `items-stretch`,
 * so the two columns are always the same height without anyone hard-coding one.
 *
 * Below the large breakpoint it stacks: words first, then the photo in a 3:2
 * frame. A page with no photo yet renders the words alone across the full
 * width rather than leaving a hole.
 */
export function LandingHero({
  breadcrumb,
  copy,
  imageUrl,
  imageAlt,
  ctaHref = "#stands",
  ctaLabel = "See the stands",
}: {
  breadcrumb: { name: string; href: string }[];
  copy: LandingCopy;
  imageUrl: string | null;
  imageAlt: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  const photo = wideVariant(imageUrl);

  return (
    <section className="bg-card py-6 md:py-10">
      <div className="container mx-auto px-4">
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
        >
          {breadcrumb.map((crumb, i) => (
            <span key={crumb.href} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
              {i === breadcrumb.length - 1 ? (
                <span className="text-foreground">{crumb.name}</span>
              ) : (
                <Link href={crumb.href} className="hover:text-accent">
                  {crumb.name}
                </Link>
              )}
            </span>
          ))}
        </nav>

        <div className="overflow-hidden rounded-[28px] bg-background shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_32px_-12px_rgba(16,24,40,0.12)]">
          <div
            className={
              photo
                ? "grid items-stretch lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]"
                : "grid"
            }
          >
            <div className="flex flex-col justify-center px-6 py-10 md:px-10 lg:px-12 lg:py-14">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-foreground">
                {copy.eyebrow}
              </p>
              <h1 className="mt-3 max-w-[20ch] font-display text-[clamp(1.9rem,3.2vw,3rem)] font-bold leading-[1.05] tracking-[-0.02em] text-foreground">
                {copy.heading}
              </h1>
              <p className="mt-4 max-w-[34ch] text-lg leading-snug text-muted-foreground">
                {copy.tagline}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href={ctaHref}
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  {ctaLabel}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center rounded-full border border-border px-6 py-3 text-sm font-bold text-foreground transition-colors hover:border-accent/60 hover:text-accent"
                >
                  How it works
                </Link>
              </div>

              <p className="mt-6 text-sm text-muted-foreground">
                From {formatMoney(3900)} · No monthly fee on a direct stand · Buy 3
                and save 15%
              </p>
            </div>

            {photo && (
              <div className="relative aspect-[3/2] w-full lg:aspect-auto lg:h-full lg:min-h-[26rem]">
                <Image
                  src={photo}
                  alt={imageAlt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 640px"
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
