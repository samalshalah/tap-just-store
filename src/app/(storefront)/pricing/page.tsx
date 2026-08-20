import type { Metadata } from "next";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { getVolumeTiers } from "@/lib/stands-data";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "NFC stands from $39. Standard Direct is NFC only. Branded + QR adds your logo, business name and a printed QR code. Volume discounts from 3 stands.",
};

const ROWS = [
  { size: "A5", dims: "148 × 210 mm", standard: 3900, branded: 4900 },
  { size: "A4", dims: "210 × 297 mm", standard: 4900, branded: 6500 },
];

export default async function PricingPage() {
  const tiers = await getVolumeTiers();

  return (
    <div className="container mx-auto px-4 py-14">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">Pricing</h1>
        <p className="mt-4 text-muted-foreground">
          One payment. No monthly fee on any direct stand — ever.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-left">
          <thead className="bg-card">
            <tr className="text-xs uppercase tracking-widest text-muted-foreground">
              <th className="p-4 font-bold">Size</th>
              <th className="p-4 font-bold">Standard Direct</th>
              <th className="p-4 font-bold">Branded + QR</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.size} className="border-t border-border">
                <td className="p-4">
                  <span className="font-bold text-foreground">{r.size}</span>
                  <span className="block text-xs text-muted-foreground">{r.dims}</span>
                </td>
                <td className="p-4 font-bold text-foreground">{formatMoney(r.standard)}</td>
                <td className="p-4 font-bold text-foreground">
                  {formatMoney(r.branded)}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    +{formatMoney(r.branded - r.standard)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mx-auto mt-8 grid max-w-3xl gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-bold text-foreground">Standard Direct</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            <li>· NFC only — no printed QR code</li>
            <li>· You provide one destination link</li>
            <li>· Our standard artwork for that stand</li>
            <li>· No account needed, no monthly fee</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-accent/40 bg-accent/5 p-6">
          <h2 className="font-display text-lg font-bold text-foreground">Branded + QR</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            <li>· NFC and a printed, scannable QR code</li>
            <li>· Your logo and business name printed on</li>
            <li>· You approve a proof before we print</li>
            <li>· Still no account, still no monthly fee</li>
          </ul>
        </div>
      </div>

      {tiers.length > 0 && (
        <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-border bg-card p-6 text-center">
          <h2 className="font-display text-lg font-bold text-foreground">Buying a few?</h2>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {tiers.map((t) => (
              <span
                key={t.minQuantity}
                className="rounded-full border border-border px-4 py-2 text-sm text-foreground/85"
              >
                {t.minQuantity}+ stands · <strong>{t.discountPercent}% off</strong>
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Mix sizes, faces and setups however you like — the discount applies to the whole order.
          </p>
        </div>
      )}

      <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-border p-6 text-center">
        <h2 className="font-display text-lg font-bold text-foreground">Larger deployments</h2>
        <p className="mt-2 text-muted-foreground">
          Placing stands across many locations and want to track which ones bring in customers?
          That is a custom build, priced per project.
        </p>
        <Link
          href="/custom-stands"
          className="mt-4 inline-block rounded-full border border-accent px-6 py-3 font-bold text-accent transition-colors hover:bg-accent/10"
        >
          Request a quote
        </Link>
      </div>
    </div>
  );
}
