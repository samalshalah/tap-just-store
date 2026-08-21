import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, Clause } from "@/components/legal/LegalLayout";
import { LEGAL } from "@/lib/legal";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = {
  title: "Shipping & Returns | Tap Rater",
  description:
    "How long a Tap Rater stand takes to arrive, what happens if it is faulty, and when a stand can be returned.",
  alternates: { canonical: "/shipping-returns" },
};

export default function ShippingReturnsPage() {
  return (
    <LegalLayout
      current="/shipping-returns"
      title="Shipping & Returns"
      summary="Stands are printed to order. Here is how long that takes, what it costs, and what happens when something is wrong."
    >
      <Clause heading="When your stand ships">
        <p>
          A Standard stand is dispatched within {LEGAL.dispatchDaysStandard} of your
          order. A Branded + QR stand carries your logo and business name, so it is
          printed individually and dispatched within {LEGAL.dispatchDaysBranded}.
        </p>
        <p>
          Delivery inside the United States usually takes {LEGAL.transitDays} after
          dispatch. You get a tracking number by email as soon as the parcel leaves
          us.
        </p>
        <p>
          Orders of 25 stands or more are quoted individually and we confirm the
          timeline in writing before you pay.
        </p>
      </Clause>

      <Clause heading="Shipping cost">
        <p>
          Shipping is calculated at checkout from your address and the size of the
          order. Orders over {formatMoney(4900)} ship free within the United States.
        </p>
        <p>
          We currently ship within the United States. If you are outside the US,{" "}
          <Link href="/support" className="font-semibold text-accent hover:underline">
            contact us
          </Link>{" "}
          before ordering and we will tell you whether we can reach you and what it
          costs.
        </p>
      </Clause>

      <Clause heading="Checking your stand when it arrives">
        <p>
          Tap it with your phone before you put it on the counter. The page it opens
          should be the exact link you gave us. If it is not, tell us within 14 days
          and we will fix it at our cost — including a replacement stand if the
          printed face is wrong.
        </p>
      </Clause>

      <Clause heading="Returns">
        <p>
          <strong className="text-foreground">Standard stands</strong> can be
          returned within {LEGAL.returnWindowDays} days of delivery for a refund,
          provided they are unused and in the condition you received them. Start a
          return from{" "}
          <Link href="/support" className="font-semibold text-accent hover:underline">
            the support page
          </Link>{" "}
          and we will send return instructions. Return postage is yours unless the
          stand was faulty or we made a mistake.
        </p>
        <p>
          <strong className="text-foreground">Branded + QR stands</strong> are
          personalised with your logo and business name, so they cannot be resold and
          are not returnable for a change of mind. They are still covered in full if
          they arrive faulty, damaged, or printed differently from the proof you
          approved.
        </p>
        <p>
          Refunds go back to the original payment method within 10 business days of
          us receiving the return.
        </p>
      </Clause>

      <Clause heading="If a stand stops working">
        <p>
          Every stand carries our {LEGAL.warrantyName} — we cover defects in
          materials and workmanship {LEGAL.warrantyTerm}. If the chip stops
          responding to a tap, or the stand cracks or the print fails in normal
          use, send us a photo and we replace it free. You do not need to send the
          old one back.
        </p>
        <p>
          Read the full terms and exclusions on our{" "}
          <Link
            href="/warranty"
            className="font-semibold text-accent hover:underline"
          >
            warranty page
          </Link>
          .
        </p>
      </Clause>

      <Clause heading="Changing where a stand points">
        <p>
          Re-pointing a stand to a new link is free for as long as you own it. Send
          us the order number and the new URL and we will confirm when it is live.
        </p>
      </Clause>

      <Clause heading="Cancelling an order">
        <p>
          You can cancel for a full refund any time before the stand is printed.
          Once a Branded + QR stand has gone to print we cannot cancel it, because
          the printed face is yours and no one else&apos;s.
        </p>
      </Clause>
    </LegalLayout>
  );
}
