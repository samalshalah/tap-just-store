import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Choose a stand, add your link, and it arrives ready to use. Tap or scan sends your customer straight where you want them — no app, no setup for them.",
};

const STEPS = [
  {
    n: "1",
    title: "Pick the stand",
    body: "Choose what you want people to do — leave a Google review, book an appointment, see your menu, follow you. Each stand is printed for that one job.",
  },
  {
    n: "2",
    title: "Add your link",
    body: "Paste the destination once. We program it into the NFC chip before the stand ships, so it works the moment it lands on your counter.",
  },
  {
    n: "3",
    title: "Add your branding (optional)",
    body: "Upload your logo and business name and we print them on the stand, along with a scannable QR code. You approve a proof before anything is printed.",
  },
  {
    n: "4",
    title: "Put it on the counter",
    body: "Your customer taps their phone or scans the code. No app to download, nothing to install. Works on iPhone and Android.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="container mx-auto px-4 py-14">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">
          How it works
        </h1>
        <p className="mt-4 text-muted-foreground">
          Four steps, and only two of them involve you.
        </p>
      </div>

      <ol className="mx-auto mt-12 max-w-3xl space-y-5">
        {STEPS.map((s) => (
          <li key={s.n} className="flex gap-5 rounded-2xl border border-border bg-card p-6">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 font-display text-lg font-bold text-accent">
              {s.n}
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">{s.title}</h2>
              <p className="mt-1.5 text-muted-foreground">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-bold text-foreground">
          Do my customers need an app?
        </h2>
        <p className="mt-1.5 text-muted-foreground">
          No. Tapping opens the link directly on any modern phone, and the printed QR code
          covers anyone whose phone has NFC switched off.
        </p>
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/shop"
          className="inline-block rounded-full bg-accent px-8 py-4 font-bold text-background transition-opacity hover:opacity-90"
        >
          Browse stands
        </Link>
      </div>
    </div>
  );
}
