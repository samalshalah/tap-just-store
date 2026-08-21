import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatMoney } from "@/lib/money";
import type { LandingCopy } from "@/lib/landing-copy";

/**
 * The hero card on a landing page.
 *
 * With a photo it is the card layout: eyebrow, headline and one short line of
 * copy on white, then the photograph bleeding to the card's left, right and
 * bottom edges with a soft fade into the white above it.
 *
 * Without a photo it degrades to the same card without the image — never to a
 * broken image or a grey box — so a page can go live before its photography
 * exists.
 */
export function LandingHero({
  breadcrumb,
  copy,
  imageUrl,
  imageAlt,
}: {
  breadcrumb: { name: string; href: string }[];
  copy: LandingCopy;
  imageUrl: string | null;
  imageAlt: string;
}) {
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
          <div className="px-6 pt-8 md:px-12 md:pt-12">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-foreground">
              {copy.eyebrow}
            </p>
            <h1 className="mt-3 max-w-[24ch] font-display text-[clamp(2rem,4.4vw,3.4rem)] font-bold leading-[1.05] tracking-[-0.02em] text-foreground">
              {copy.heading}
            </h1>
            <p className="mt-4 max-w-[34ch] text-lg leading-snug text-muted-foreground">
              {copy.tagline}
            </p>
            <p className="mt-5 text-sm text-muted-foreground">
              From {formatMoney(3900)} · No monthly fee on a direct stand · Buy 3 and
              save 15%
            </p>
          </div>

          {imageUrl ? (
            <div className="relative mt-6 aspect-[1300/651] w-full overflow-hidden">
              <Image
                src={imageUrl}
                alt={imageAlt}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 1200px"
                className="object-cover object-bottom"
              />
              {/* Fades the top of the photograph into the white card above it. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background via-background/70 to-background/0"
              />
            </div>
          ) : (
            <div className="h-8 md:h-12" />
          )}
        </div>
      </div>
    </section>
  );
}
