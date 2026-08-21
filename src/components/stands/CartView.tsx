"use client";

import Link from "next/link";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { useCart } from "@/components/CartContext";
import { formatMoney } from "@/lib/money";
import { computeCartTotals, type VolumeTierRule } from "@/lib/pricing";
import { sizeLabel } from "@/lib/sizes";
import { OPTION_LABELS, type OptionCode } from "@/lib/shop-filter";
import { LEGAL } from "@/lib/legal";

/** The destination, short enough to read at a glance in a cart line. */
function prettyUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname === "/" ? "" : u.pathname;
    const shown = `${u.host}${path}`;
    return shown.length > 44 ? `${shown.slice(0, 43)}…` : shown;
  } catch {
    return url.length > 44 ? `${url.slice(0, 43)}…` : url;
  }
}

export function CartView({ tiers }: { tiers: VolumeTierRule[] }) {
  const {
    items,
    totalItems,
    totalPrice,
    monthlyTotal,
    removeItem,
    updateQuantity,
    hydrated,
  } = useCart();

  // Before hydration the cart is always empty, so rendering the empty state
  // would flash "your cart is empty" at someone who has items.
  if (!hydrated) {
    return (
      <div className="mt-10 rounded-2xl border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground">Loading your cart…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-full bg-accent px-8 py-3.5 font-bold text-background transition-opacity hover:opacity-90"
        >
          Browse stands
        </Link>
      </div>
    );
  }

  const totals = computeCartTotals(
    items.map((i) => ({ priceCents: i.priceCents, quantity: i.quantity })),
    tiers
  );
  const upcoming = totals.nextTier;

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        {items.map((item) => (
          <div
            key={item.lineId}
            className="flex gap-4 rounded-2xl border border-border bg-card p-4"
          >
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-white">
              {item.imageUrl && (
                <Image
                  src={item.imageUrl}
                  alt={item.standName}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-foreground">
                <Link
                  href={`/stands/${item.standSlug}`}
                  className="hover:text-accent"
                >
                  {item.standName}
                </Link>
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {sizeLabel(item.size)} ·{" "}
                {OPTION_LABELS[item.optionCode as OptionCode] ?? item.optionCode} ·{" "}
                {formatMoney(item.priceCents)} each
                {item.monthlyCents > 0 &&
                  ` + ${formatMoney(item.monthlyCents)}/mo`}
              </p>

              {/*
                The setup is shown on the line, not hidden behind an edit
                screen. It is what will be printed and programmed, and the
                cart is the last place a typo in a review link is cheap to
                catch. After this it is printed acrylic.
              */}
              <dl className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                <div className="flex gap-1.5">
                  <dt className="shrink-0 font-semibold text-foreground/70">
                    Taps to
                  </dt>
                  <dd className="truncate">{prettyUrl(item.setup.destinationUrl)}</dd>
                </div>
                {item.setup.businessName && (
                  <div className="flex gap-1.5">
                    <dt className="shrink-0 font-semibold text-foreground/70">
                      Printed name
                    </dt>
                    <dd className="truncate">{item.setup.businessName}</dd>
                  </div>
                )}
                {item.setup.logoPath !== undefined && (
                  <div className="flex gap-1.5">
                    <dt className="shrink-0 font-semibold text-foreground/70">
                      Logo
                    </dt>
                    <dd>{item.setup.logoPath ? "Uploaded" : "Text only"}</dd>
                  </div>
                )}
              </dl>

              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-center rounded-full border border-border">
                  <button
                    type="button"
                    aria-label={`Decrease quantity of ${item.standName}`}
                    onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                    className="px-3 py-1.5 text-foreground hover:text-accent"
                  >
                    −
                  </button>
                  <span className="min-w-8 text-center text-sm font-bold text-foreground">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label={`Increase quantity of ${item.standName}`}
                    onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                    className="px-3 py-1.5 text-foreground hover:text-accent"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.lineId)}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" /> Remove
                </button>
              </div>
            </div>

            <p className="whitespace-nowrap font-bold text-foreground">
              {formatMoney(item.priceCents * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      <aside className="h-fit rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-bold text-foreground">Summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              Subtotal ({totalItems} {totalItems === 1 ? "stand" : "stands"})
            </dt>
            <dd className="text-foreground">{formatMoney(totals.subtotalCents)}</dd>
          </div>
          {totals.discountCents > 0 && (
            <div className="flex justify-between text-accent">
              <dt>Volume discount ({totals.discountPercent}%)</dt>
              <dd>−{formatMoney(totals.discountCents)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
            <dt className="text-foreground">Total</dt>
            <dd className="text-foreground">{formatMoney(totals.totalCents)}</dd>
          </div>
          {monthlyTotal > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <dt>Then monthly</dt>
              <dd>{formatMoney(monthlyTotal)}/mo</dd>
            </div>
          )}
        </dl>

        {upcoming && (
          <p className="mt-4 rounded-xl border border-accent/40 bg-accent/5 p-3 text-sm text-foreground/85">
            Add {upcoming.minQuantity - totalItems} more and save{" "}
            {upcoming.discountPercent}%.
          </p>
        )}

        <Link
          href="/checkout"
          className="mt-6 block rounded-full bg-accent px-6 py-3.5 text-center font-bold text-background transition-opacity hover:opacity-90"
        >
          Checkout
        </Link>
        <Link
          href="/shop"
          className="mt-3 block text-center text-sm text-muted-foreground hover:text-accent"
        >
          Continue shopping
        </Link>

        {/*
          The warranty link belongs here, not only in the footer. The FTC's
          pre-sale availability rule requires the terms of a written warranty
          on a product over $15 to be readable before the customer buys.
        */}
        <p className="mt-6 border-t border-border pt-4 text-center text-xs leading-relaxed text-muted-foreground">
          Every stand carries our{" "}
          <Link href="/warranty" className="font-semibold text-accent hover:underline">
            {LEGAL.warrantyName}
          </Link>
          {" — "}
          {LEGAL.warrantyTerm}.{" "}
          <Link
            href="/shipping-returns"
            className="font-semibold text-accent hover:underline"
          >
            Shipping &amp; returns
          </Link>
          .
        </p>
      </aside>
    </div>
  );
}
