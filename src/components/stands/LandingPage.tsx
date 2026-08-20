import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StandGrid } from "./StandGrid";
import type { ShopResult } from "@/lib/shop-filter";
import type { LandingCopy } from "@/lib/landing-copy";
import { formatMoney } from "@/lib/money";

export interface CrossLink {
  name: string;
  href: string;
  count: number;
}

/**
 * The shared shape of every indexable landing page.
 *
 * Copy first, grid second, cross-links last — so the page has something to
 * rank for beyond a list of product tiles, and so a visitor who landed on the
 * wrong one has an obvious way to the right one.
 */
export function LandingPage({
  breadcrumb,
  copy,
  results,
  crossLinksTitle,
  crossLinks,
}: {
  breadcrumb: { name: string; href: string }[];
  copy: LandingCopy;
  results: ShopResult[];
  crossLinksTitle: string;
  crossLinks: CrossLink[];
}) {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: copy.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <section className="border-b border-border/50 bg-card py-12">
        <div className="container mx-auto px-4">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
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

          <h1 className="mt-4 max-w-3xl font-display text-3xl font-bold text-foreground md:text-4xl">
            {copy.heading}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">{copy.intro}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            From {formatMoney(3900)} · No monthly fee on a direct stand · Buy 3 and
            save 15%
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="grid gap-6 md:grid-cols-3">
          {copy.points.map((point) => (
            <div
              key={point.title}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <h2 className="font-display text-lg font-bold text-foreground">
                {point.title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{point.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-12">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-bold text-foreground">
            {results.length} {results.length === 1 ? "stand" : "stands"} to choose from
          </h2>
          <Link
            href="/shop"
            className="text-sm font-semibold text-accent hover:underline"
          >
            See all stands
          </Link>
        </div>
        <StandGrid results={results} />
      </section>

      {crossLinks.length > 0 && (
        <section className="border-t border-border/50 bg-card py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {crossLinksTitle}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {crossLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-border bg-background px-3.5 py-1.5 text-sm text-foreground/80 transition-colors hover:border-accent/50 hover:text-accent"
                >
                  {link.name}
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {link.count}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="container mx-auto px-4 py-14">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Common questions
        </h2>
        <dl className="mt-6 max-w-3xl divide-y divide-border border-t border-border">
          {copy.faqs.map((faq) => (
            <div key={faq.q} className="py-5">
              <dt className="font-semibold text-foreground">{faq.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {faq.a}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-10 rounded-2xl border border-border bg-card p-6 text-center">
          <p className="font-display text-xl font-bold text-foreground">
            Need something we do not list?
          </p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Sets of stands with their own landing pages, per-location tracking, or a
            design we have not built yet — tell us what you need.
          </p>
          <Link
            href="/custom-stands"
            className="mt-5 inline-block rounded-full bg-accent px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Ask for a custom set
          </Link>
        </div>
      </section>
    </>
  );
}
