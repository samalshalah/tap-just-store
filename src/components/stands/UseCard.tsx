import Link from "next/link";
import Image from "next/image";
import type { LandingCopy } from "@/lib/landing-copy";

/**
 * A shop-by-use card: eyebrow, short action headline, one line, then the
 * photograph bleeding to the card's left, right and bottom edges with a soft
 * fade into the white above it.
 *
 * A use with no photo yet keeps the same card and shows the stand count in
 * place of the image, so a half-photographed grid still lines up instead of
 * showing holes.
 */
export function UseCard({
  href,
  copy,
  imageUrl,
  count,
}: {
  href: string;
  copy: LandingCopy;
  imageUrl: string | null;
  count: number;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-3xl bg-background shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_28px_-14px_rgba(16,24,40,0.16)] transition-shadow hover:shadow-[0_1px_2px_rgba(16,24,40,0.05),0_18px_40px_-16px_rgba(16,24,40,0.25)]"
    >
      <div className="min-h-[9.5rem] px-6 pt-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground">
          {copy.eyebrow}
        </p>
        <h3 className="mt-2 font-display text-[1.6rem] font-bold leading-[1.1] tracking-[-0.02em] text-foreground">
          {copy.cardHeading}
        </h3>
        <p className="mt-2 max-w-[30ch] text-sm leading-snug text-muted-foreground">
          {copy.tagline}
        </p>
      </div>

      {imageUrl ? (
        <div className="relative mt-4 aspect-[1300/651] w-full">
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover object-bottom transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-background to-transparent"
          />
        </div>
      ) : (
        // Same shape as a photographed card so the grid stays even while the
        // photography is still being shot.
        <div className="relative mt-4 flex aspect-[1300/651] w-full items-end bg-gradient-to-br from-card to-card/40 p-6">
          <div className="flex w-full items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {count} {count === 1 ? "stand" : "stands"}
            </span>
            <span className="font-bold text-accent">
              Browse{" "}
              <span
                aria-hidden="true"
                className="inline-block transition-transform group-hover:translate-x-0.5"
              >
                &rarr;
              </span>
            </span>
          </div>
        </div>
      )}
    </Link>
  );
}
