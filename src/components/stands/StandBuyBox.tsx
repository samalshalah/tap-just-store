"use client";

import { formatMoney } from "@/lib/money";
import type { VolumeTierRule } from "@/lib/pricing";
import { nextTier } from "@/lib/pricing";
import { standSize } from "@/lib/sizes";
import type { StandOptionCode } from "./StandDetail";

export interface VariantLite {
  size: string;
  optionCode: string;
  priceCents: number;
  monthlyCents: number;
  active: boolean;
}

/**
 * Size and finish for a stand.
 *
 * Fully controlled: the selection lives in StandDetail so the gallery shows
 * the finish being priced here. This component decides nothing on its own.
 */
export function StandBuyBox({
  variants,
  sizes,
  size,
  onSize,
  option,
  onOption,
  tiers,
}: {
  variants: VariantLite[];
  sizes: string[];
  size: string;
  onSize: (size: string) => void;
  option: StandOptionCode;
  onOption: (option: StandOptionCode) => void;
  tiers: VolumeTierRule[];
}) {
  const chosen = variants.find(
    (v) => v.size === size && v.optionCode === option && v.active
  );
  const standard = variants.find(
    (v) => v.size === size && v.optionCode === "standard_direct"
  );
  const branded = variants.find(
    (v) => v.size === size && v.optionCode === "branded_qr_direct"
  );
  const upgradeDelta =
    standard && branded ? branded.priceCents - standard.priceCents : 0;

  const upcoming = nextTier(1, tiers);

  return (
    <div className="mt-8 space-y-6">
      <div>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Size
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {sizes.map((s) => {
            const info = standSize(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => onSize(s)}
                aria-pressed={size === s}
                className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                  size === s
                    ? "border-accent bg-accent/10"
                    : "border-border hover:border-accent/50"
                }`}
              >
                <span className="block text-sm font-bold text-foreground">
                  {info?.label ?? s.toUpperCase()}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {info?.inches ?? ""}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {info?.centimetres ?? ""}
                </span>
                {info ? (
                  <span className="mt-1 block text-xs text-muted-foreground/80">
                    {info.compare}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Finish
        </h2>
        <div className="space-y-3">
          <OptionRow
            selected={option === "standard_direct"}
            onSelect={() => onOption("standard_direct")}
            title="Standard Direct"
            price={standard?.priceCents ?? 0}
            points={[
              "NFC only — no printed QR code",
              "You provide one destination link",
              "Ships with our standard artwork",
            ]}
          />
          <OptionRow
            selected={option === "branded_qr_direct"}
            onSelect={() => onOption("branded_qr_direct")}
            title="Branded + QR"
            price={branded?.priceCents ?? 0}
            badge={upgradeDelta > 0 ? `+${formatMoney(upgradeDelta)}` : undefined}
            points={[
              "NFC plus a printed QR code",
              "Your logo and business name printed on the stand",
              "You approve a proof before we print",
            ]}
          />
        </div>
      </div>

      <button
        type="button"
        disabled
        className="w-full cursor-not-allowed rounded-full bg-accent/40 px-6 py-4 text-center font-bold text-background"
      >
        Continue — {chosen ? formatMoney(chosen.priceCents) : "—"}
      </button>
      <p className="text-center text-xs text-muted-foreground">
        Setup flow coming next: you&apos;ll add your link
        {option === "branded_qr_direct"
          ? ", logo and business name, then approve a proof"
          : ""}{" "}
        before checkout.
      </p>

      {upcoming && (
        <p className="rounded-xl border border-border bg-card px-4 py-3 text-center text-sm text-foreground/80">
          Buy any {upcoming.minQuantity} stands and save {upcoming.discountPercent}% —
          mix sizes, faces and finishes however you like.
        </p>
      )}
    </div>
  );
}

function OptionRow({
  selected,
  onSelect,
  title,
  price,
  points,
  badge,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  price: number;
  points: string[];
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-full rounded-xl border p-4 text-left transition-colors ${
        selected ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-bold text-foreground">{title}</span>
        <span className="whitespace-nowrap text-sm font-bold text-foreground">
          {formatMoney(price)}
          {badge && (
            <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">
              {badge}
            </span>
          )}
        </span>
      </div>
      <ul className="mt-2 space-y-1">
        {points.map((p) => (
          <li key={p} className="text-sm text-muted-foreground">
            · {p}
          </li>
        ))}
      </ul>
    </button>
  );
}
