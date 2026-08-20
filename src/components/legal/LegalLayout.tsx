import type { ReactNode } from "react";
import Link from "next/link";
import { LEGAL, LEGAL_PAGES } from "@/lib/legal";

/**
 * Shared frame for the policy pages: title, effective date, readable measure,
 * and links across to the other two so a reader never has to go hunting.
 */
export function LegalLayout({
  title,
  summary,
  children,
  current,
}: {
  title: string;
  summary: string;
  children: ReactNode;
  current: string;
}) {
  return (
    <>
      <section className="border-b border-border/50 bg-card py-12">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">{summary}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            Effective {LEGAL.lastUpdated}
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="legal-prose max-w-3xl space-y-8 text-[15px] leading-relaxed text-muted-foreground">
          {children}
        </div>

        <div className="mt-14 flex flex-wrap gap-2 border-t border-border pt-8">
          {LEGAL_PAGES.filter((p) => p.href !== current).map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="rounded-full border border-border px-3.5 py-1.5 text-sm text-foreground/80 transition-colors hover:border-accent/50 hover:text-accent"
            >
              {p.label}
            </Link>
          ))}
          <Link
            href="/support"
            className="rounded-full border border-border px-3.5 py-1.5 text-sm text-foreground/80 transition-colors hover:border-accent/50 hover:text-accent"
          >
            Support
          </Link>
        </div>
      </section>
    </>
  );
}

/** A titled block. Kept here so the three policies stay visually identical. */
export function Clause({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold text-foreground">{heading}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}
