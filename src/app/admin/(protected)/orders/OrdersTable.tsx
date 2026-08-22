"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Order } from "@/lib/schema/orders";
import type { OrderItem } from "@/lib/schema/orderItems";
import { formatMoney } from "@/lib/money";
import { sizeLabel } from "@/lib/sizes";
import { OPTION_LABELS, type OptionCode } from "@/lib/shop-filter";
import {
  CARRIERS,
  STATUS_COLORS,
  STATUS_HELP,
  STATUS_LABELS,
  nextStatuses,
  trackingUrl,
  type OrderStatus,
} from "@/lib/order-status";
import { setOrderStatus, setOrderTracking } from "@/lib/orders-admin";

type Row = Order & { items: OrderItem[] };

/**
 * Whether the money arrived — a different question from fulfilment, so it gets
 * its own pill. Light values, because the admin is a white surface.
 */
const PAYMENT_COLORS: Record<string, string> = {
  unpaid: "border-zinc-300 bg-zinc-100 text-zinc-600",
  processing: "border-blue-300 bg-blue-50 text-blue-800",
  paid: "border-emerald-300 bg-emerald-50 text-emerald-800",
  failed: "border-red-300 bg-red-50 text-red-800",
  refunded: "border-amber-300 bg-amber-50 text-amber-900",
};

/**
 * The orders list, and the production queue.
 *
 * The expanded panel is what a stand actually gets made from: the link to
 * program onto the chip, the name to print, the logo to download. Everything
 * needed is on screen, because the alternative is emailing the customer to
 * ask — which is exactly what this build exists to avoid.
 *
 * The status buttons only ever offer legal moves. The rules are in
 * order-status.ts and enforced again on the server; this just refuses to
 * render a button that would be rejected.
 */
export function OrdersTable({ orders }: { orders: Row[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function move(id: number, status: OrderStatus) {
    setError(null);
    startTransition(async () => {
      const result = await setOrderStatus(id, status);
      if (!result.ok) setError(result.error ?? "That change was refused.");
      router.refresh();
    });
  }

  if (orders.length === 0) {
    return (
      <p className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-zinc-500">
        No orders match.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {orders.map((o) => {
        const status = (o.status as OrderStatus) ?? "new";
        const track = trackingUrl(o.carrier, o.trackingNumber);
        const isOpen = expanded === o.id;

        return (
          <div
            key={o.id}
            className="overflow-hidden rounded-xl border border-zinc-200 bg-white"
          >
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : o.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-zinc-50"
            >
              <div className="min-w-0 flex-1">
                <p className="font-mono font-semibold text-amber-600">
                  {o.confirmationCode}
                </p>
                <p className="truncate text-sm text-zinc-500">
                  {o.customerName} · {o.shipCity}, {o.shipState}
                </p>
              </div>

              <div
                className="hidden whitespace-nowrap text-sm text-zinc-500 md:block"
                suppressHydrationWarning
              >
                {new Date(o.createdAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </div>

              <span
                className={`whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs ${
                  PAYMENT_COLORS[o.paymentStatus] ?? PAYMENT_COLORS.unpaid
                }`}
              >
                {o.paymentStatus}
              </span>

              <span className="whitespace-nowrap font-bold text-zinc-900">
                {formatMoney(o.totalPrice)}
              </span>

              <span
                className={`whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs ${STATUS_COLORS[status]}`}
              >
                {STATUS_LABELS[status]}
              </span>
            </button>

            {isOpen && (
              <div className="grid gap-6 border-t border-zinc-200 bg-zinc-50 p-4 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-zinc-700">
                    Make these
                  </h3>
                  <ul className="space-y-3 text-sm">
                    {o.items.map((it) => (
                      <li
                        key={it.id}
                        className="rounded-lg border border-zinc-200 bg-white p-3"
                      >
                        <div className="flex justify-between gap-3">
                          <span className="font-semibold text-zinc-900">
                            {it.quantity} × {it.standName}
                          </span>
                          <span className="whitespace-nowrap text-zinc-500">
                            {formatMoney(it.priceCents * it.quantity)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {sizeLabel(it.size)} ·{" "}
                          {OPTION_LABELS[it.optionCode as OptionCode] ?? it.optionCode}
                        </p>
                        <p className="mt-2 break-all text-xs text-zinc-700">
                          <span className="text-zinc-400">Program: </span>
                          <code className="rounded bg-zinc-100 px-1 py-0.5">
                            {it.destinationUrl}
                          </code>
                        </p>
                        {it.businessName && (
                          <p className="text-xs text-zinc-700">
                            <span className="text-zinc-400">Print: </span>
                            <strong>{it.businessName}</strong>
                          </p>
                        )}
                        {it.optionCode !== "standard_direct" && (
                          <p className="text-xs text-zinc-700">
                            <span className="text-zinc-400">Logo: </span>
                            {it.logoPath ? (
                              <a
                                href={`/api/storage${it.logoPath}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-blue-600 underline"
                              >
                                download
                              </a>
                            ) : (
                              "text only"
                            )}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>

                  <h3 className="mb-1.5 mt-4 text-sm font-semibold text-zinc-700">
                    Ship to
                  </h3>
                  <p className="text-sm text-zinc-600">
                    {o.shipName}
                    <br />
                    {o.shipLine1}
                    {o.shipLine2 && <>, {o.shipLine2}</>}
                    <br />
                    {o.shipCity}, {o.shipState} {o.shipPostalCode}
                  </p>
                  <p className="mt-2 break-all text-sm text-zinc-600">
                    {o.customerEmail} · {o.customerPhone}
                  </p>
                  {o.notes && (
                    <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-sm italic text-amber-900">
                      &ldquo;{o.notes}&rdquo;
                    </p>
                  )}
                </div>

                <div>
                  <TrackingForm
                    orderId={o.id}
                    carrier={o.carrier}
                    trackingNumber={o.trackingNumber}
                    trackUrl={track}
                    onDone={() => router.refresh()}
                  />

                  <h3 className="mb-1.5 mt-5 text-sm font-semibold text-zinc-700">
                    Status
                  </h3>
                  <p className="mb-2 text-xs text-zinc-500">{STATUS_HELP[status]}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {nextStatuses(status).length === 0 && (
                      <span className="text-xs text-zinc-500">
                        This order is finished — no further changes.
                      </span>
                    )}
                    {nextStatuses(status).map((s) => (
                      <button
                        key={s}
                        type="button"
                        disabled={pending}
                        onClick={() => move(o.id, s)}
                        className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:border-blue-500 hover:text-blue-700 disabled:opacity-50"
                      >
                        {s === "cancelled" ? "Cancel order" : `Mark ${STATUS_LABELS[s].toLowerCase()}`}
                      </button>
                    ))}
                  </div>

                  <dl className="mt-5 space-y-0.5 text-xs text-zinc-500">
                    <Line label="Subtotal" value={formatMoney(o.subtotalCents)} />
                    {o.discountCents > 0 && (
                      <Line
                        label={o.discountLabel || "Discount"}
                        value={`−${formatMoney(o.discountCents)}`}
                      />
                    )}
                    <Line
                      label="Shipping"
                      value={o.shippingCents === 0 ? "Free" : formatMoney(o.shippingCents)}
                    />
                    <Line label="Tax" value={formatMoney(o.taxCents)} />
                    <div className="flex justify-between pt-1 font-semibold text-zinc-800">
                      <dt>Charged</dt>
                      <dd>{formatMoney(o.totalPrice)}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TrackingForm({
  orderId,
  carrier,
  trackingNumber,
  trackUrl,
  onDone,
}: {
  orderId: number;
  carrier: string | null;
  trackingNumber: string | null;
  trackUrl: string | null;
  onDone: () => void;
}) {
  const [c, setC] = useState(carrier ?? "usps");
  const [n, setN] = useState(trackingNumber ?? "");
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setProblem(null);
    const result = await setOrderTracking(orderId, c, n);
    setSaving(false);
    if (!result.ok) {
      setProblem(result.error ?? "Could not save that.");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    onDone();
  }

  return (
    <div>
      <h3 className="mb-1.5 text-sm font-semibold text-zinc-700">Tracking</h3>
      <p className="mb-2 text-xs text-zinc-500">
        Needed before an order can be marked shipped — the shipped email links
        to it.
      </p>
      <div className="flex flex-wrap gap-2">
        <select
          value={c}
          onChange={(e) => setC(e.target.value)}
          className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
        >
          {Object.entries(CARRIERS).map(([code, info]) => (
            <option key={code} value={code}>
              {info.label}
            </option>
          ))}
        </select>
        <input
          value={n}
          onChange={(e) => setN(e.target.value)}
          placeholder="Tracking number"
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      {problem && <p className="mt-1.5 text-xs text-red-600">{problem}</p>}
      {saved && <p className="mt-1.5 text-xs text-emerald-600">Saved.</p>}
      {trackUrl && (
        <a
          href={trackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-block text-xs font-semibold text-blue-600 underline"
        >
          Open tracking page
        </a>
      )}
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
