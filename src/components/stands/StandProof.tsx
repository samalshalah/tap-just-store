"use client";

import Image from "next/image";
import { StandQr } from "./StandQr";

/**
 * The proof: the stand face, drawn for real.
 *
 * The first version of this composited the customer's details over the
 * stand's `front_template_url`. That turned out to be wrong, because those
 * files are marketing renders rather than blank templates — they already have
 * "YOUR LOGO", "YOUR BUSINESS" and a decorative QR baked into the pixels.
 * Overlaying real details on top would have shown the customer their name
 * sitting on top of a placeholder, and their real QR next to a fake one.
 *
 * So the face is drawn here instead: same layout, same order, every element
 * real. The QR is generated from the customer's actual link, so they can point
 * a phone at the screen and land on their own page before they pay. That check
 * is the entire point of a proof — after this it is printed acrylic and a
 * branded stand cannot be returned.
 *
 * Sized in `cqw` against a container query, so one set of proportions holds
 * from a phone-width preview up to a full-width one.
 */
export function StandProof({
  badge,
  headline,
  businessName,
  logoUrl,
  destinationUrl,
  showQr,
}: {
  /** The platform word across the middle, e.g. "GOOGLE REVIEW". */
  badge: string;
  /** The instruction under it, e.g. "Review us on Google". */
  headline: string;
  businessName: string;
  logoUrl: string | null;
  destinationUrl: string;
  /** Standard stands are NFC-only and carry no printed QR. */
  showQr: boolean;
}) {
  return (
    <div
      className="mx-auto w-full max-w-sm rounded-xl border border-border bg-[#f4f5f7] p-[6%]"
      style={{ containerType: "inline-size" }}
    >
      <div className="flex aspect-[5/7] w-full flex-col items-center rounded-lg bg-white px-[8%] py-[7%] shadow-sm">
        {/* Branding block */}
        <div className="flex w-full flex-col items-center gap-[2.5cqw]">
          {logoUrl ? (
            <div className="relative h-[16cqw] w-[52%]">
              <Image
                src={logoUrl}
                alt={businessName ? `${businessName} logo` : "Your logo"}
                fill
                className="object-contain"
                sizes="240px"
                unoptimized
              />
            </div>
          ) : null}
          {businessName ? (
            <p
              className="w-full break-words text-center font-bold uppercase leading-tight tracking-wide text-[#1a1a1a]"
              style={{ fontSize: "4.2cqw" }}
            >
              {businessName}
            </p>
          ) : null}
        </div>

        {/* The platform, which is what someone reads from across a counter */}
        <p
          className="mt-[7cqw] text-center font-display font-bold leading-none text-[#111]"
          style={{ fontSize: "11cqw" }}
        >
          {badge}
        </p>
        <p
          className="mt-[3cqw] text-center leading-snug text-[#3a3a3a]"
          style={{ fontSize: "4.4cqw" }}
        >
          {headline}
        </p>

        {/* Tap and scan */}
        <div className="mt-auto flex w-full items-end justify-center gap-[9cqw] pb-[2cqw]">
          <div className="flex flex-col items-center gap-[2cqw]">
            <NfcWaves />
            <span
              className="text-center font-semibold uppercase tracking-wider text-[#7a7a7a]"
              style={{ fontSize: "2.5cqw" }}
            >
              Contactless tapping
            </span>
          </div>

          {showQr && destinationUrl ? (
            <div className="flex flex-col items-center gap-[2cqw]">
              <StandQr
                url={destinationUrl}
                className="h-[18cqw] w-[18cqw]"
                title="Your QR code — point a phone at it to test your link"
              />
              <span
                className="font-semibold uppercase tracking-wider text-[#7a7a7a]"
                style={{ fontSize: "2.5cqw" }}
              >
                Scan
              </span>
            </div>
          ) : null}
        </div>

        {/* Footer rule */}
        <div className="w-full border-t-2 border-[#111] pt-[2cqw]">
          <p
            className="text-center font-bold uppercase tracking-wider text-[#111]"
            style={{ fontSize: "3cqw" }}
          >
            Tap Rater
          </p>
          <p
            className="text-center uppercase tracking-wider text-[#9a9a9a]"
            style={{ fontSize: "2cqw" }}
          >
            www.taprater.com
          </p>
        </div>
      </div>
    </div>
  );
}

/** The contactless mark. Drawn rather than imported so it scales with the face. */
function NfcWaves() {
  return (
    <svg
      viewBox="0 0 32 22"
      className="h-[9cqw] w-[13cqw]"
      aria-hidden="true"
      fill="none"
      stroke="#111"
      strokeWidth={3}
      strokeLinecap="round"
    >
      <path d="M3 13a18 18 0 0 1 26 0" />
      <path d="M9 18a11 11 0 0 1 14 0" />
      <path d="M14.5 22a4 4 0 0 1 3 0" strokeWidth={4} />
    </svg>
  );
}
