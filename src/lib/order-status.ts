/**
 * order-status.ts — where an order is, and where it may go next.
 *
 * The statuses used to be `pending / ready / completed / cancelled`, which is
 * the vocabulary of a dispensary counter: "ready" meant ready to collect. For
 * a business that prints a stand and posts it, none of those words describe
 * anything real, and "completed" in particular hid the difference between
 * "we finished making it" and "the customer has it".
 *
 * This is a state machine rather than a free-text column because the
 * transitions genuinely matter. Marking an order shipped without a tracking
 * number, or un-shipping a delivered order, or "cancelling" something already
 * in the post are all mistakes that cost money and trust. The rules live here,
 * are enforced on the server, and are unit tested — the admin UI only reflects
 * them.
 *
 * Payment is deliberately not in this file. Whether money arrived is
 * `payment_status`, a separate column, because the two come apart: an order
 * can be paid and unprinted, or shipped and later refunded.
 */

export const ORDER_STATUSES = [
  /** Paid and waiting. Nothing has been printed yet. */
  "new",
  /** On the bench: printing, programming the chip, packing. */
  "in_production",
  /** Handed to the carrier. Requires a tracking number. */
  "shipped",
  /** Confirmed delivered. */
  "delivered",
  /** Stopped before it shipped. */
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

/**
 * Where each status may go next.
 *
 * Two rules are encoded here rather than left to whoever is clicking:
 *
 *  - **Nothing comes back from `delivered`.** Once the customer has it, the
 *    remedy is a return or a warranty replacement, both of which are their own
 *    thing. Reopening the order would falsify the record.
 *  - **`cancelled` is terminal, and only reachable before shipping.** An order
 *    already with the carrier cannot be un-sent; that is a refund.
 *
 * `shipped` can go back to `in_production` on purpose: marking the wrong order
 * shipped is the single easiest mistake to make on a busy day, and forcing
 * someone to live with it would make them stop using the statuses honestly.
 */
const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  new: ["in_production", "cancelled"],
  in_production: ["shipped", "new", "cancelled"],
  shipped: ["delivered", "in_production"],
  delivered: [],
  cancelled: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function nextStatuses(from: OrderStatus): readonly OrderStatus[] {
  return TRANSITIONS[from];
}

/** Statuses that still need work from us. Drives the production queue. */
export const OPEN_STATUSES: readonly OrderStatus[] = ["new", "in_production"];

export function isOpen(status: OrderStatus): boolean {
  return OPEN_STATUSES.includes(status);
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "New",
  in_production: "In production",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** What the status means, for the admin. Removes any guessing. */
export const STATUS_HELP: Record<OrderStatus, string> = {
  new: "Paid and waiting. Nothing printed yet.",
  in_production: "Being printed, programmed and packed.",
  shipped: "With the carrier. The customer has been emailed a tracking link.",
  delivered: "Confirmed delivered.",
  cancelled: "Stopped before it shipped.",
};

/**
 * Pill colours for the admin, which is a light surface.
 *
 * The first version of these was written in dark-theme values — deep
 * backgrounds with pale text — because the storefront is dark. On the white
 * admin they rendered as pale text on pale fill and were barely readable.
 * Light values, with enough contrast to be scanned down a column at a glance.
 */
export const STATUS_COLORS: Record<OrderStatus, string> = {
  new: "border-blue-300 bg-blue-50 text-blue-800",
  in_production: "border-amber-300 bg-amber-50 text-amber-900",
  shipped: "border-violet-300 bg-violet-50 text-violet-800",
  delivered: "border-emerald-300 bg-emerald-50 text-emerald-800",
  cancelled: "border-zinc-300 bg-zinc-100 text-zinc-600",
};

/**
 * Why a transition is refused, phrased for the person clicking.
 *
 * Returns null when the move is allowed.
 */
export function transitionError(
  from: OrderStatus,
  to: OrderStatus,
  opts: { hasTracking: boolean }
): string | null {
  if (from === to) return null;

  if (!canTransition(from, to)) {
    if (from === "delivered") {
      return "This order is already delivered. Use a return or a warranty replacement instead.";
    }
    if (from === "cancelled") {
      return "This order was cancelled. Cancelled orders cannot be reopened.";
    }
    if (to === "cancelled") {
      return "This order has already shipped, so it cannot be cancelled. Refund it instead.";
    }
    return `An order cannot go from ${STATUS_LABELS[from]} to ${STATUS_LABELS[to]}.`;
  }

  // A shipped order without a tracking number produces a "where is it?" email
  // within a day, and the shipped notification would have nothing to link to.
  if (to === "shipped" && !opts.hasTracking) {
    return "Add a tracking number before marking this order shipped.";
  }

  return null;
}

/** The carriers we hand parcels to, and how to build a tracking link. */
export const CARRIERS = {
  usps: {
    label: "USPS",
    url: (n: string) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(n)}`,
  },
  ups: {
    label: "UPS",
    url: (n: string) => `https://www.ups.com/track?tracknum=${encodeURIComponent(n)}`,
  },
  fedex: {
    label: "FedEx",
    url: (n: string) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`,
  },
  dhl: {
    label: "DHL",
    url: (n: string) => `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${encodeURIComponent(n)}`,
  },
} as const;

export type CarrierCode = keyof typeof CARRIERS;

export function isCarrierCode(value: string): value is CarrierCode {
  return Object.prototype.hasOwnProperty.call(CARRIERS, value);
}

/**
 * A link the customer can actually click, or null when we cannot build one.
 *
 * Never guesses the carrier from the number's shape. A wrong tracking link is
 * worse than none: it sends the customer to a page saying their parcel does
 * not exist.
 */
export function trackingUrl(
  carrier: string | null,
  number: string | null
): string | null {
  const n = (number ?? "").trim();
  if (!n || !carrier || !isCarrierCode(carrier)) return null;
  return CARRIERS[carrier].url(n);
}
