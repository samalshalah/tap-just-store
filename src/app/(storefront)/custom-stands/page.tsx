import type { Metadata } from "next";
import { CustomStandsForm } from "@/components/stands/CustomStandsForm";

export const metadata: Metadata = {
  title: "Custom Stands",
  description:
    "Custom NFC stand deployments — your own artwork, many locations, and per-location tracking so you know which sites bring in customers.",
};

const POINTS = [
  {
    title: "Your artwork, not ours",
    body: "Any design, any destination. If it fits on the stand, we can print it.",
  },
  {
    title: "Built for many locations",
    body: "Place stands across partner sites, branches or events — each one can point somewhere different.",
  },
  {
    title: "Know what is working",
    body: "Give each stand its own page and see which locations actually produce customers, instead of guessing.",
  },
];

export default function CustomStandsPage() {
  return (
    <div className="container mx-auto px-4 py-14">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">
          Custom stands
        </h1>
        <p className="mt-4 text-muted-foreground">
          For businesses that need more than an off-the-shelf stand. Tell us what you are
          trying to achieve and we will come back with a plan and a price.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-3">
        {POINTS.map((p) => (
          <div key={p.title} className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-base font-bold text-foreground">{p.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-12 max-w-2xl">
        <CustomStandsForm />
      </div>
    </div>
  );
}
