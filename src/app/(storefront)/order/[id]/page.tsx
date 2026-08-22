import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  Link2,
  MapPin,
  Truck,
} from "lucide-react";
import { getOrderById } from "@/lib/data";
import { isAdminSession } from "@/lib/admin-auth";
import { formatMoney } from "@/lib/money";
import { sizeLabel } from "@/lib/sizes";
import { OPTION_LABELS, type OptionCode } from "@/lib/shop-filter";
import { LEGAL } from "@/lib/legal";
import {
  CARRIERS,
  isCarrierCode,
  STATUS_LABELS,
  trackingUrl,
  type OrderStatus,
} from "@/lib/order-status";

export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: { index: false, follow: false },
};

/**
 * The order confirmation.
 *
 * Rewritten in Phase 03. It used to be a dispensary pickup receipt — it told
 * the customer their "pickup window", showed the shop's address as the
 * collection point, and asked them to bring government-issued ID and cash. All
 * of that was live on a real page for a product that ships in a box.
 *
 * It also printed `${item.pricePerItem * item.quantity}` directly, so a
 * $78.00 line rendered as "$7800".
 */
export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ code?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const orderId = parseInt(id, 10);
  if (!orderId || isNaN(orderId)) notFound();

  const order = (await getOrderById(orderId)) ?? notFound();

  // The id is sequential, so the page needs the confirmation code — otherwise
  // counting from 1 walks every customer's name, email, phone and address.
  // notFound() rather than a 403: a 403 would confirm the order exists.
  const supplied = (query.code ?? "").trim().toUpperCase();
  if (supplied !== (order.confirmationCode ?? "").toUpperCase()) {
    if (!(await isAdminSession())) notFound();
  }

  const paid = order.paymentStatus === "paid";
  const branded = order.items.some((i) => i.optionCode !== "standard_direct");
  const status = (order.status as OrderStatus) ?? "new";
  const track = trackingUrl(order.carrier, order.trackingNumber);
  const carrierLabel =
    order.carrier && isCarrierCode(order.carrier)
      ? CARRIERS[order.carrier].label
      : null;

  return (
    <section className="min-h-[80vh] bg-background py-16">
      <div className="container mx-auto max-w-2xl px-4">
        <div className="mb-10 text-center">
          <div
            className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full ${
              paid ? "bg-accent/20" : "bg-amber-500/15"
            }`}
          >
            {paid ? (
              <CheckCircle2 className="h-10 w-10 text-accent" />
            ) : (
              <Clock className="h-10 w-10 text-amber-500" />
            )}
          </div>
          <h1 className="mb-3 font-display text-4xl font-bold text-foreground md:text-5xl">
            {paid ? "Order confirmed" : "Payment processing"}
          </h1>
          <p className="text-muted-foreground">
            {paid
              ? `Thanks ${order.customerName.split(" ")[0]} — we have your order and a receipt is on its way to ${order.customerEmail}.`
              : "Your payment is still being confirmed. This page updates once it clears, and we will email you either way."}
          </p>
        </div>

        <div className="mb-6 rounded-3xl border border-border/50 bg-card p-6 md:p-8">
          <div className="mb-4 flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Confirmation
              </p>
              <p className="font-mono text-2xl font-bold text-accent">
                {order.confirmationCode}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Order #{order.id} ·{" "}
              {new Date(order.createdAt).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>

          <h2 className="mb-3 font-bold text-foreground">What we are making</h2>
          <ul className="mb-5 space-y-4">
            {order.items.map((item) => (
              <li key={item.id} className="text-sm">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-semibold text-foreground">
                    {item.quantity} × {item.standName}
                  </span>
                  <span className="whitespace-nowrap text-foreground">
                    {formatMoney(item.priceCents * item.quantity)}
                  </span>
                </div>
                <p className="mt-0.5 text-muted-foreground">
                  {sizeLabel(item.size)} ·{" "}
                  {OPTION_LABELS[item.optionCode as OptionCode] ?? item.optionCode}
                </p>
                {/* The destination is shown back one last time. It is the one
                    detail that cannot be corrected after printing. */}
                <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Link2 className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="break-all">{item.destinationUrl}</span>
                </p>
                {item.businessName && (
                  <p className="text-xs text-muted-foreground">
                    Printed name: {item.businessName}
                  </p>
                )}
              </li>
            ))}
          </ul>

          <dl className="space-y-1.5 border-t border-border pt-4 text-sm">
            <Row label="Subtotal" value={formatMoney(order.subtotalCents)} />
            {order.discountCents > 0 && (
              <Row
                label={order.discountLabel || "Volume discount"}
                value={`−${formatMoney(order.discountCents)}`}
                accent
              />
            )}
            <Row
              label="Shipping"
              value={
                order.shippingCents === 0 ? "Free" : formatMoney(order.shippingCents)
              }
            />
            <Row label="Sales tax" value={formatMoney(order.taxCents)} />
            <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
              <dt className="text-foreground">Total</dt>
              <dd className="text-2xl text-accent">{formatMoney(order.totalPrice)}</dd>
            </div>
          </dl>
        </div>

        <div className="mb-6 space-y-4 rounded-3xl border border-border/50 bg-card p-6 md:p-8">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <div>
              <p className="mb-0.5 text-xs uppercase tracking-wider text-muted-foreground">
                Shipping to
              </p>
              <p className="font-medium text-foreground">{order.shipName}</p>
              <p className="text-sm text-muted-foreground">
                {order.shipLine1}
                {order.shipLine2 && <>, {order.shipLine2}</>}
                <br />
                {order.shipCity}, {order.shipState} {order.shipPostalCode}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            {track ? (
              <Truck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            ) : (
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            )}
            <div className="min-w-0">
              <p className="mb-0.5 text-xs uppercase tracking-wider text-muted-foreground">
                {track ? "On its way" : "When it ships"}
              </p>
              {track ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    {STATUS_LABELS[status]} with {carrierLabel}. Tracking number{" "}
                    <span className="break-all font-mono text-foreground">
                      {order.trackingNumber}
                    </span>
                    .
                  </p>
                  <a
                    href={track}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-background transition-opacity hover:opacity-90"
                  >
                    Track your parcel
                  </a>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {branded
                    ? `Your stands are printed to order, so they leave us in ${LEGAL.dispatchDaysBranded}.`
                    : `Dispatched in ${LEGAL.dispatchDaysStandard}.`}{" "}
                  Delivery usually takes {LEGAL.transitDays} after that. We email
                  a tracking number as soon as it is on its way.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <div>
              <p className="mb-0.5 text-xs uppercase tracking-wider text-muted-foreground">
                Payment
              </p>
              <p className="text-sm text-muted-foreground">
                {paid
                  ? `Paid — ${formatMoney(order.totalPrice)}.`
                  : "Awaiting confirmation from your bank."}
              </p>
            </div>
          </div>
        </div>

        {branded && (
          <div className="mb-8 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-5 text-sm leading-relaxed text-foreground/85">
            <p className="mb-1 font-semibold">Spotted a mistake?</p>
            <p>
              Branded stands go into production quickly and cannot be returned
              once printed. If the link or the spelling above is wrong, reply to
              your confirmation email straight away and we will catch it if we
              can.
            </p>
          </div>
        )}

        <div className="text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-bold text-background transition-opacity hover:opacity-90"
          >
            Continue shopping <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className={`flex justify-between ${accent ? "text-accent" : ""}`}>
      <dt className={accent ? "" : "text-muted-foreground"}>{label}</dt>
      <dd className={accent ? "" : "text-foreground"}>{value}</dd>
    </div>
  );
}
