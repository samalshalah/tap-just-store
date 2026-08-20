import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Help with your NFC stand — changing your link, tapping problems, proofs, orders and returns.",
};

const FAQS = [
  {
    q: "How do I change the link on my stand?",
    a: "Get in touch with your order number and the new destination. On direct stands the link is written to the chip, so we will send you instructions or a replacement depending on your setup.",
  },
  {
    q: "A phone will not tap. What now?",
    a: "Ask them to unlock the phone first — most phones ignore NFC while locked. On Android, check NFC is switched on in settings. Older phones may not have NFC at all, which is exactly what the printed QR on Branded + QR stands is for.",
  },
  {
    q: "Where does the tap actually go?",
    a: "Straight to the link you gave us. There is no app, no redirect page and nothing installed on your customer's phone.",
  },
  {
    q: "Can I see the design before it is printed?",
    a: "On Branded + QR, yes — you approve a proof showing your logo, business name and the generated QR in place. Nothing is printed until you confirm it.",
  },
  {
    q: "Is there a monthly fee?",
    a: "Not on direct stands. You pay once and the stand keeps working. Only hosted multi-link stands carry a monthly cost, and that is stated clearly before you buy.",
  },
  {
    q: "Something arrived damaged or wrong.",
    a: "Message us with your order number and a photo and we will put it right.",
  },
];

export default function SupportPage() {
  return (
    <div className="container mx-auto px-4 py-14">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">Support</h1>
        <p className="mt-4 text-muted-foreground">
          Most questions are answered below. If yours is not, get in touch — a person reads it.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-3xl space-y-3">
        {FAQS.map((f) => (
          <details
            key={f.q}
            className="group rounded-2xl border border-border bg-card p-5 [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-4 font-display font-bold text-foreground">
              {f.q}
              <span className="text-accent transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>

      <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-border p-6 text-center">
        <h2 className="font-display text-lg font-bold text-foreground">Still stuck?</h2>
        <p className="mt-2 text-muted-foreground">
          Send us the details and your order number if you have one.
        </p>
        <Link
          href="/contact"
          className="mt-4 inline-block rounded-full bg-accent px-6 py-3 font-bold text-background transition-opacity hover:opacity-90"
        >
          Contact us
        </Link>
      </div>
    </div>
  );
}
