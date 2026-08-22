"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { AlertTriangle, ArrowLeft, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "./CartContext";
import { formatMoney } from "@/lib/money";
import { computeCartTotals, shippingCentsFor, type VolumeTierRule } from "@/lib/pricing";
import { sizeLabel } from "@/lib/sizes";
import { OPTION_LABELS, type OptionCode } from "@/lib/shop-filter";
import { isStorageImageUrl } from "@/lib/images";
import { LEGAL } from "@/lib/legal";

/**
 * Checkout.
 *
 * Two steps rather than one page: the address is collected first, then the
 * card. That order is forced by tax — the amount to charge is not knowable
 * until there is an address to calculate it against, so a card form shown
 * before the address would be quoting a total that is about to change.
 *
 * Step 2 mounts Stripe's Payment Element against a client secret the server
 * returned. Card details go straight to Stripe and never touch this origin,
 * which keeps the PCI surface to a minimum even though the form is embedded.
 *
 * Every figure shown before step 2 is an estimate rendered from the cart. The
 * totals that appear with the card form come back from the server, which
 * repriced the whole cart from the database. Where they differ, the server is
 * right — and the customer sees the server's numbers before paying.
 */

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH",
  "NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT",
  "VT","VA","WA","WV","WI","WY","PR","VI","GU","AS","MP",
] as const;

const schema = z.object({
  customerName: z.string().trim().min(2, "Enter your full name"),
  customerEmail: z.string().trim().email("Enter a valid email"),
  customerPhone: z.string().trim().min(7, "Enter a phone number"),
  shipLine1: z.string().trim().min(3, "Enter a street address"),
  shipLine2: z.string().trim().optional(),
  shipCity: z.string().trim().min(2, "Enter a city"),
  shipState: z.enum(US_STATES, { message: "Choose a state" }),
  shipPostalCode: z
    .string()
    .trim()
    .regex(/^\d{5}(-\d{4})?$/, "Enter a 5-digit ZIP code"),
  notes: z.string().trim().max(1000).optional(),
});

type CheckoutForm = z.infer<typeof schema>;

interface Breakdown {
  subtotalCents: number;
  discountCents: number;
  discountLabel: string;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
}

export interface CheckoutConfig {
  ordersPaused: boolean;
  showNotes: boolean;
  paymentsReady: boolean;
  publishableKey: string;
}

export function CheckoutClient({
  config,
  tiers,
}: {
  config: CheckoutConfig;
  tiers: VolumeTierRule[];
}) {
  const { items, totalItems, hydrated, clearCart } = useCart();
  const [starting, setStarting] = useState(false);
  const [payment, setPayment] = useState<{
    clientSecret: string;
    orderId: number;
    confirmationCode: string;
    breakdown: Breakdown;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutForm>({ resolver: zodResolver(schema) });

  // Shown until the server prices it for real. Deliberately labelled as an
  // estimate, because tax is not knowable without an address.
  const estimate = useMemo(() => {
    const totals = computeCartTotals(
      items.map((i) => ({ priceCents: i.priceCents, quantity: i.quantity })),
      tiers
    );
    return { ...totals, shippingCents: shippingCentsFor(totals.totalCents) };
  }, [items, tiers]);

  const stripePromise = useMemo(
    () => (config.publishableKey ? loadStripe(config.publishableKey) : null),
    [config.publishableKey]
  );

  async function onSubmit(data: CheckoutForm) {
    if (items.length === 0) return;
    setStarting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          items: items.map((i) => ({
            standVariantId: i.standVariantId,
            quantity: i.quantity,
            setup: i.setup,
          })),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "We could not start your order.");
      setPayment({
        clientSecret: body.clientSecret,
        orderId: body.id,
        confirmationCode: body.confirmationCode,
        breakdown: body.breakdown,
      });
    } catch (err) {
      toast.error("Checkout failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setStarting(false);
    }
  }

  if (!hydrated) {
    return <Shell><p className="text-muted-foreground">Loading your cart…</p></Shell>;
  }

  if (items.length === 0 && !payment) {
    return (
      <Shell>
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-full bg-accent px-8 py-3.5 font-bold text-background"
        >
          Browse stands
        </Link>
      </Shell>
    );
  }

  if (config.ordersPaused) {
    return (
      <Shell>
        <Notice>
          Orders are paused right now. Your cart is saved — please try again
          shortly.
        </Notice>
      </Shell>
    );
  }

  if (!config.paymentsReady) {
    return (
      <Shell>
        <Notice>
          Card payments are not switched on yet. Your cart is saved.
        </Notice>
      </Shell>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <Link
        href="/cart"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" /> Back to cart
      </Link>

      <h1 className="font-display text-3xl font-bold text-foreground">Checkout</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {payment ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: payment.clientSecret,
                appearance: { theme: "stripe" },
              }}
            >
              <PayStep
                orderId={payment.orderId}
                confirmationCode={payment.confirmationCode}
                totalCents={payment.breakdown.totalCents}
                onPaid={clearCart}
              />
            </Elements>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Section title="Contact">
                <Field label="Full name" error={errors.customerName?.message}>
                  <input {...register("customerName")} autoComplete="name" className={inputClass} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Email" error={errors.customerEmail?.message}>
                    <input {...register("customerEmail")} type="email" autoComplete="email" className={inputClass} />
                  </Field>
                  <Field label="Phone" error={errors.customerPhone?.message}>
                    <input {...register("customerPhone")} type="tel" autoComplete="tel" className={inputClass} />
                  </Field>
                </div>
              </Section>

              <Section title="Shipping address">
                <Field label="Street address" error={errors.shipLine1?.message}>
                  <input {...register("shipLine1")} autoComplete="address-line1" className={inputClass} />
                </Field>
                <Field label="Apartment, suite (optional)">
                  <input {...register("shipLine2")} autoComplete="address-line2" className={inputClass} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="City" error={errors.shipCity?.message}>
                    <input {...register("shipCity")} autoComplete="address-level2" className={inputClass} />
                  </Field>
                  <Field label="State" error={errors.shipState?.message}>
                    <select {...register("shipState")} autoComplete="address-level1" className={inputClass} defaultValue="">
                      <option value="" disabled>Choose</option>
                      {US_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="ZIP code" error={errors.shipPostalCode?.message}>
                    <input {...register("shipPostalCode")} inputMode="numeric" autoComplete="postal-code" className={inputClass} />
                  </Field>
                </div>
                <p className="text-xs text-muted-foreground">
                  We ship within the United States only at the moment.
                </p>
              </Section>

              {config.showNotes && (
                <Section title="Anything we should know?">
                  <textarea
                    {...register("notes")}
                    rows={3}
                    className={`${inputClass} resize-none`}
                    placeholder="Optional"
                  />
                </Section>
              )}

              <button
                type="submit"
                disabled={starting}
                className="w-full rounded-full bg-accent px-6 py-4 font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {starting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Working out tax…
                  </span>
                ) : (
                  "Continue to payment"
                )}
              </button>
            </form>
          )}
        </div>

        <aside className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-bold text-foreground">
              {totalItems} {totalItems === 1 ? "stand" : "stands"}
            </h2>

            <ul className="mt-4 space-y-3">
              {items.map((item) => (
                <li key={item.lineId} className="flex gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white">
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.standName}
                        fill
                        sizes="48px"
                        unoptimized={isStorageImageUrl(item.imageUrl)}
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {item.quantity} × {item.standName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {sizeLabel(item.size)} ·{" "}
                      {OPTION_LABELS[item.optionCode as OptionCode] ?? item.optionCode}
                    </p>
                  </div>
                  <p className="whitespace-nowrap text-sm text-foreground">
                    {formatMoney(item.priceCents * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-1.5 border-t border-border pt-4 text-sm">
              <Row label="Subtotal" value={formatMoney(estimate.subtotalCents)} />
              {estimate.discountCents > 0 && (
                <Row
                  label={estimate.appliedTier?.label ?? "Volume discount"}
                  value={`−${formatMoney(estimate.discountCents)}`}
                  accent
                />
              )}
              <Row
                label="Shipping"
                value={estimate.shippingCents === 0 ? "Free" : formatMoney(estimate.shippingCents)}
              />
              <Row
                label="Sales tax"
                value={payment ? formatMoney(payment.breakdown.taxCents) : "At next step"}
              />
              <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
                <dt className="text-foreground">Total</dt>
                <dd className="text-foreground">
                  {payment
                    ? formatMoney(payment.breakdown.totalCents)
                    : formatMoney(estimate.totalCents + estimate.shippingCents)}
                </dd>
              </div>
            </dl>

            {!payment && (
              <p className="mt-3 text-xs text-muted-foreground">
                Sales tax is worked out from your address on the next step.
              </p>
            )}

            <p className="mt-5 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
              Every stand carries our{" "}
              <Link href="/warranty" className="font-semibold text-accent hover:underline">
                {LEGAL.warrantyName}
              </Link>
              . Branded stands are printed to order and cannot be returned.{" "}
              <Link href="/shipping-returns" className="font-semibold text-accent hover:underline">
                Shipping &amp; returns
              </Link>
              .
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

/**
 * Step 2 — the card.
 *
 * `redirect: "if_required"` keeps most cards on this page, while still
 * supporting methods that must bounce off the bank's own site (3-D Secure and
 * the wallets). The return URL is where those come back to.
 *
 * The cart is cleared on success, but the order is *not* marked paid here —
 * that is the webhook's job. A browser saying "it worked" is not evidence.
 */
function PayStep({
  orderId,
  confirmationCode,
  totalCents,
  onPaid,
}: {
  orderId: number;
  confirmationCode: string;
  totalCents: number;
  onPaid: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [paying, setPaying] = useState(false);

  const returnUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/order/${orderId}?code=${encodeURIComponent(confirmationCode)}`
      : "";

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: "if_required",
    });

    if (error) {
      setPaying(false);
      toast.error("Payment failed", {
        description: error.message ?? "Your card was not charged.",
      });
      return;
    }

    onPaid();
    router.push(`/order/${orderId}?code=${encodeURIComponent(confirmationCode)}`);
  }

  return (
    <form onSubmit={pay} className="space-y-5">
      <Section title="Payment">
        <PaymentElement />
      </Section>

      <button
        type="submit"
        disabled={!stripe || paying}
        className="w-full rounded-full bg-accent px-6 py-4 font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {paying ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Paying…
          </span>
        ) : (
          `Pay ${formatMoney(totalCents)}`
        )}
      </button>

      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" aria-hidden="true" />
        Card details go straight to Stripe and never touch our servers.
      </p>
    </form>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-accent";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="mb-6 font-display text-3xl font-bold text-foreground">Checkout</h1>
      {children}
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="mx-auto flex max-w-md items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 text-left text-sm text-foreground/85">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-foreground">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-500">{error}</span>}
    </label>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`flex justify-between ${accent ? "text-accent" : ""}`}>
      <dt className={accent ? "" : "text-muted-foreground"}>{label}</dt>
      <dd className={accent ? "" : "text-foreground"}>{value}</dd>
    </div>
  );
}
