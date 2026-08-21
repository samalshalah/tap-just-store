import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, Clause } from "@/components/legal/LegalLayout";
import { LEGAL } from "@/lib/legal";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = {
  title: "Terms of Service | Tap Rater",
  description:
    "The terms you agree to when you buy a Tap Rater stand or subscribe to a hosted multi-link landing page.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalLayout
      current="/terms"
      title="Terms of Service"
      summary={`The agreement between you and ${LEGAL.entity} when you buy a stand or subscribe to a hosted page.`}
    >
      <Clause heading="1. Who these terms are between">
        <p>
          These terms are between you — the business placing the order — and{" "}
          {LEGAL.entity}. Placing an order means you accept them. If you are ordering
          for a company, you confirm you are allowed to bind it.
        </p>
      </Clause>

      <Clause heading="2. Orders and acceptance">
        <p>
          An order is an offer to buy. It becomes a contract when we send you an
          order confirmation, not when you click pay. If we cannot fulfil an order —
          a pricing error, an out-of-stock size, a link we are not willing to print —
          we will tell you and refund you in full.
        </p>
      </Clause>

      <Clause heading="3. Prices and tax">
        <p>
          Prices are in US dollars and exclude sales tax and shipping, both of which
          are shown at checkout before you pay. A Standard Small stand (5.8&Prime; ×
          8.3&Prime;, A5) is {formatMoney(3900)} and a Standard Large stand (8.3&Prime;
          × 11.7&Prime;, A4) is {formatMoney(4900)}; adding your logo, business name
          and printed QR is {formatMoney(1000)} more on the Small and{" "}
          {formatMoney(1500)} more on the Large.
        </p>
        <p>
          Volume discounts apply to the total number of stands in an order — 15% at
          three, 20% at five, 25% at ten — and they mix and match across faces and
          sizes. Orders of 25 or more are quoted individually.
        </p>
        <p>
          We can change prices at any time, but never for an order we have already
          confirmed.
        </p>
      </Clause>

      <Clause heading="4. What you are responsible for">
        <p>
          <strong className="text-foreground">The link.</strong> You give us the
          destination URL and you are responsible for it being correct and for
          keeping it working. We print what you send us.
        </p>
        <p>
          <strong className="text-foreground">The logo.</strong> By uploading a logo
          you confirm you own it or are licensed to use it, and you allow us to
          reproduce it on your stand and on your proof. We do not use it for anything
          else.
        </p>
        <p>
          <strong className="text-foreground">The proof.</strong> For a Branded + QR
          stand we show you exactly what will be printed. Approving the proof is what
          sends it to print, and a stand printed correctly from an approved proof is
          not returnable for a change of mind.
        </p>
      </Clause>

      <Clause heading="5. Honest reviews only">
        <p>
          Our review stands exist to make it easy to ask every customer for an honest
          review. They are not for filtering, and we will not build anything that
          routes unhappy customers away from a review platform.
        </p>
        <p>
          Google, Yelp, Facebook and TripAdvisor all prohibit offering rewards in
          exchange for positive reviews. Using a stand that way breaks their rules,
          not ours — but we may refuse an order or stop supporting a stand if we
          learn it is being used for that.
        </p>
      </Clause>

      <Clause heading="6. Acceptable destinations">
        <p>
          We will not print a stand pointing at anything illegal, at sexual content,
          at a site designed to deceive the person tapping it, or at a page
          impersonating another business. We may refuse or cancel such an order and
          refund you.
        </p>
      </Clause>

      <Clause heading="7. Hosted multi-link subscriptions">
        <p>
          A hosted multi-link stand is {formatMoney(4900)} for the stand plus{" "}
          {formatMoney(LEGAL.hostedMonthlyCents)} per month for the landing page we
          host for you. The monthly fee is what keeps that page online.
        </p>
        <p>
          <strong className="text-foreground">
            If the subscription lapses, the stand stops working.
          </strong>{" "}
          After a failed payment we email you and keep the page live for a further{" "}
          {LEGAL.hostedGraceDays} days. If it is still unpaid after that, the page
          stops resolving and a tap will not open anything until you resubscribe. The
          physical stand is still yours, and your content is kept for 90 days so you
          can pick up where you left off.
        </p>
        <p>
          You can cancel at any time from your account or by asking us. Cancelling
          stops the next charge; we do not refund part of a month already paid.
        </p>
      </Clause>

      <Clause heading="8. Our intellectual property">
        <p>
          The stand designs, the site, and everything on it other than your own logo
          and content belong to {LEGAL.entity}. Buying a stand does not license you to
          reproduce the design.
        </p>
      </Clause>

      <Clause heading="9. Warranty and limits">
        <p>
          We warrant each stand for {LEGAL.warrantyMonths} months under normal
          counter use, as set out in{" "}
          <Link
            href="/shipping-returns"
            className="font-semibold text-accent hover:underline"
          >
            Shipping &amp; Returns
          </Link>
          . Beyond that warranty, and to the extent the law allows, the products and
          the hosted page are provided as they are.
        </p>
        <p>
          We do not promise that a stand will produce reviews, followers, bookings or
          revenue. Those depend on your business, not on us.
        </p>
        <p>
          Our total liability for any claim is limited to what you paid us for the
          order the claim relates to. We are not liable for indirect or consequential
          loss, including lost profits. Nothing here limits liability that cannot
          lawfully be limited.
        </p>
      </Clause>

      <Clause heading="10. Changes to these terms">
        <p>
          We may update these terms. The version that applies to your order is the
          one published when we confirmed it. Material changes affecting an active
          subscription are emailed to you at least 30 days before they take effect.
        </p>
      </Clause>

      <Clause heading="11. Governing law">
        <p>
          These terms are governed by the laws of {LEGAL.governingLaw}, and the
          courts there have jurisdiction over any dispute.
        </p>
      </Clause>

      <Clause heading="12. Contact">
        <p>
          Reach us through{" "}
          <Link href="/support" className="font-semibold text-accent hover:underline">
            the support page
          </Link>
          . We answer every message from a real person.
        </p>
      </Clause>
    </LegalLayout>
  );
}
