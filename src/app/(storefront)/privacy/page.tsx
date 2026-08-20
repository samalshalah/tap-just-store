import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, Clause } from "@/components/legal/LegalLayout";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy | Tap Rater",
  description:
    "What Tap Rater collects when you buy a stand, what we do with it, and how to get it deleted.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      current="/privacy"
      title="Privacy Policy"
      summary="We sell printed stands. That needs your name, your address and your link — and not much else."
    >
      <Clause heading="What we collect">
        <p>
          <strong className="text-foreground">To fulfil an order:</strong> your name,
          email address, shipping address, phone number if you give one, and the
          contents of your order.
        </p>
        <p>
          <strong className="text-foreground">To print your stand:</strong> the
          destination link you want it to open, and — for a Branded + QR stand — your
          business name and the logo file you upload.
        </p>
        <p>
          <strong className="text-foreground">To take payment:</strong> nothing. Card
          details go directly to our payment processor and never reach our servers.
          We see the last four digits and whether the payment succeeded.
        </p>
        <p>
          <strong className="text-foreground">To run the site:</strong> standard
          server logs, including IP address and browser type, kept for security and
          troubleshooting.
        </p>
      </Clause>

      <Clause heading="What we do not do">
        <p>
          We do not sell your data, we do not rent it, and we do not hand it to
          advertisers. We do not build a profile of you across other websites.
        </p>
        <p>
          A Tap Rater stand does not identify the person who taps it. It opens a link
          on their phone — the same as any printed URL would. We receive nothing
          about them.
        </p>
      </Clause>

      <Clause heading="Hosted multi-link pages">
        <p>
          If you subscribe to a hosted multi-link landing page, we host that page and
          count how many times each link on it is opened. Those counts are aggregate
          — a number per link per day. We do not record who tapped, and we do not
          store visitor identifiers for them.
        </p>
        <p>
          Whatever you choose to put on that page is yours and is public by
          definition. Do not put anything on it you would not print on a poster.
        </p>
      </Clause>

      <Clause heading="Who we share it with">
        <p>
          Only the companies that make the order happen: our payment processor, our
          print and fulfilment partner, our shipping carrier, our email provider and
          our hosting provider. Each gets the minimum it needs and none of them may
          use it for their own purposes.
        </p>
        <p>
          We will disclose information if the law genuinely requires it, and we will
          tell you when we are allowed to.
        </p>
      </Clause>

      <Clause heading="How long we keep it">
        <p>
          Order records are kept for as long as tax and accounting rules require.
          Logo files are kept while you own the stand, so we can reprint or re-point
          it without asking you to send the file again. Ask us and we will delete
          them sooner.
        </p>
      </Clause>

      <Clause heading="Your choices">
        <p>
          You can ask us for a copy of what we hold about you, ask us to correct it,
          or ask us to delete it. Write to us from{" "}
          <Link href="/support" className="font-semibold text-accent hover:underline">
            the support page
          </Link>{" "}
          and we will respond within 30 days. Deleting an order record may make it
          impossible for us to honour a warranty claim on that stand.
        </p>
        <p>
          Marketing email is opt-in and every message carries an unsubscribe link
          that works immediately.
        </p>
      </Clause>

      <Clause heading="Cookies">
        <p>
          We use cookies to keep your cart intact between pages and to keep you
          signed in if you have an account. We do not use advertising cookies. If we
          ever add analytics that set cookies, this page will say so before they run.
        </p>
      </Clause>

      <Clause heading="Children">
        <p>
          This is a business-to-business product and is not directed at anyone under
          16. We do not knowingly collect information from children.
        </p>
      </Clause>

      <Clause heading="Changes and contact">
        <p>
          If we change this policy we update the effective date at the top and, for
          anything material, email customers with an active order or subscription.
        </p>
        <p>
          Questions about privacy go to {LEGAL.entity} via{" "}
          <Link href="/support" className="font-semibold text-accent hover:underline">
            the support page
          </Link>
          .
        </p>
      </Clause>
    </LegalLayout>
  );
}
