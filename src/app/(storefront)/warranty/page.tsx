import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, Clause } from "@/components/legal/LegalLayout";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Warranty | Tap Rater",
  description:
    "Tap Rater stands carry a Limited Lifetime Warranty against defects in materials and workmanship for as long as you own the stand. Here is exactly what that covers.",
  alternates: { canonical: "/warranty" },
};

/**
 * The warranty, in full.
 *
 * A page of its own rather than a clause inside Terms, because the FTC's
 * pre-sale availability rule requires the terms of a written warranty on a
 * product over $15 to be readable *before* the customer buys. That is why the
 * product page and the cart both link straight here.
 */
export default function WarrantyPage() {
  return (
    <LegalLayout
      current="/warranty"
      title={LEGAL.warrantyName}
      summary={`We cover defects in materials and workmanship ${LEGAL.warrantyTerm}. No registration, no receipt hunting — a photo is enough.`}
    >
      <Clause heading="What is covered">
        <p>
          We warrant every Tap Rater stand against defects in materials and
          workmanship <strong>{LEGAL.warrantyTerm}</strong>. If any of the
          following happens in normal use, send us a photo and we will replace
          the stand free, including shipping:
        </p>
        <ul>
          <li>The NFC chip stops responding to a tap.</li>
          <li>The stand cracks, warps or delaminates on its own.</li>
          <li>The printed face lifts, flakes or fails.</li>
        </ul>
        <p>
          You do not need to send the old stand back, and there is nothing to
          register. Email us from the address you ordered with and we will find
          the order.
        </p>
      </Clause>

      <Clause heading="Who is covered">
        <p>
          This warranty covers the original purchaser and is not transferable.
          &ldquo;{LEGAL.warrantyTerm}&rdquo; means for as long as you personally
          own the stand — that is the life the warranty is measured by. Because
          coverage is limited to the original purchaser, this is a{" "}
          <strong>limited</strong> warranty rather than a full one.
        </p>
      </Clause>

      <Clause heading="What is not covered">
        <ul>
          <li>Drops, crushing, snapping or any other physical damage.</li>
          <li>Tampering with the chip, or prising it out.</li>
          <li>
            Scratching, fading or wear caused by abrasive cleaners, bleach,
            solvents or prolonged direct sunlight.
          </li>
          <li>
            Soaking or immersion. The stand is {LEGAL.waterClaim.toLowerCase()},
            not waterproof.
          </li>
          <li>Loss or theft.</li>
          <li>Any stand modified after purchase.</li>
        </ul>
      </Clause>

      <Clause heading="What a warranty cannot cover">
        <p>
          Where your stand sends people is not a defect. If you change your
          Google listing, move your website, or switch a social handle, the
          destination on the stand is out of date — the stand is working
          exactly as built.
        </p>
        <p>
          Tell us and we will help you re-point it. A hosted multi-link stand
          can be changed from your dashboard at any time, which is the reason
          that option exists.
        </p>
      </Clause>

      <Clause heading="This is on top of your legal rights">
        <p>
          Nothing here reduces any right you have under state or federal law.
          Where a right cannot be limited or excluded, it is not limited or
          excluded — this warranty is in addition to it, not instead of it.
        </p>
        <p>
          For returns of an unused stand within {LEGAL.returnWindowDays} days,
          which is a separate thing from this warranty, see{" "}
          <Link
            href="/shipping-returns"
            className="font-semibold text-accent hover:underline"
          >
            Shipping &amp; Returns
          </Link>
          .
        </p>
      </Clause>

      <Clause heading="How to claim">
        <p>
          Email us with a photo of the stand and the order number or the email
          address you ordered with. We do not need a receipt. A replacement goes
          out on the same schedule as a new order —{" "}
          {LEGAL.dispatchDaysStandard} for a standard stand,{" "}
          {LEGAL.dispatchDaysBranded} for a branded one, since it has to be
          printed again.
        </p>
      </Clause>
    </LegalLayout>
  );
}
