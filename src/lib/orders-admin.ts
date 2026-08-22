"use server";

import { and, eq, desc, ilike, or, sql, inArray, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertAdmin } from "@/lib/admin-auth";
import { ordersTable } from "@/lib/schema/orders";
import { orderItemsTable } from "@/lib/schema/orderItems";
import { orderEventsTable } from "@/lib/schema/orderEvents";
import {
  isOrderStatus,
  isCarrierCode,
  transitionError,
  type OrderStatus,
} from "@/lib/order-status";
import { sendShippedEmail } from "@/lib/shipped-email";

/**
 * Everything the admin does to an order.
 *
 * Every export here calls assertAdmin() first. That is not belt and braces:
 * every exported async function in a "use server" module is registered in the
 * action manifest and can be POSTed to directly by anyone who learns its id.
 * The admin layout is not a gate — each action has to be its own.
 *
 * All state changes are written through recordEvent(), so `order_events` is a
 * complete history rather than a partial one.
 */

const PAGE_SIZE = 25;

export interface OrderListQuery {
  /** Free text over confirmation code, name, email and tracking number. */
  q?: string;
  status?: string;
  paymentStatus?: string;
  page?: number;
}

export interface OrderListResult {
  orders: (typeof ordersTable.$inferSelect & {
    items: (typeof orderItemsTable.$inferSelect)[];
  })[];
  total: number;
  page: number;
  pageCount: number;
  /** Open work, for the badge on the queue tab. */
  openCount: number;
}

/**
 * The admin order list.
 *
 * Paginated because the previous version selected every order and every line
 * item, then ran a separate query per order to fetch those lines. That is fine
 * at three orders and a serious problem at three thousand — the lines are now
 * fetched in one query for the page being shown.
 */
export async function listOrders(query: OrderListQuery = {}): Promise<OrderListResult> {
  await assertAdmin();

  const page = Math.max(1, Math.floor(query.page ?? 1));
  const filters = [];

  const q = (query.q ?? "").trim();
  if (q) {
    const like = `%${q}%`;
    filters.push(
      or(
        ilike(ordersTable.confirmationCode, like),
        ilike(ordersTable.customerName, like),
        ilike(ordersTable.customerEmail, like),
        ilike(ordersTable.trackingNumber, like)
      )!
    );
  }
  if (query.status && isOrderStatus(query.status)) {
    filters.push(eq(ordersTable.status, query.status));
  }
  if (query.paymentStatus) {
    filters.push(eq(ordersTable.paymentStatus, query.paymentStatus));
  }

  const where = filters.length ? and(...filters) : undefined;

  const [[{ value: total }], [{ value: openCount }], rows] = await Promise.all([
    db.select({ value: count() }).from(ordersTable).where(where),
    db
      .select({ value: count() })
      .from(ordersTable)
      .where(inArray(ordersTable.status, ["new", "in_production"])),
    db
      .select()
      .from(ordersTable)
      .where(where)
      .orderBy(desc(ordersTable.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
  ]);

  const ids = rows.map((o) => o.id);
  const items = ids.length
    ? await db.select().from(orderItemsTable).where(inArray(orderItemsTable.orderId, ids))
    : [];

  const byOrder = new Map<number, (typeof orderItemsTable.$inferSelect)[]>();
  for (const item of items) {
    const list = byOrder.get(item.orderId) ?? [];
    list.push(item);
    byOrder.set(item.orderId, list);
  }

  return {
    orders: rows.map((o) => ({ ...o, items: byOrder.get(o.id) ?? [] })),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    openCount,
  };
}

/** The append-only history for one order, newest first. */
export async function listOrderEvents(orderId: number) {
  await assertAdmin();
  return db
    .select()
    .from(orderEventsTable)
    .where(eq(orderEventsTable.orderId, orderId))
    .orderBy(desc(orderEventsTable.createdAt))
    .limit(50);
}

/**
 * Narrow shape rather than `typeof db`, so the same helper takes either the
 * pool or a transaction. Casting a transaction to the database type is a lie
 * the compiler correctly refuses.
 */
type Inserter = Pick<typeof db, "insert">;

async function recordEvent(
  tx: Inserter,
  event: {
    orderId: number;
    kind: "status" | "payment" | "tracking" | "note";
    fromValue?: string;
    toValue?: string;
    note?: string;
    actor?: string;
  }
) {
  await tx.insert(orderEventsTable).values({
    orderId: event.orderId,
    kind: event.kind,
    fromValue: event.fromValue ?? "",
    toValue: event.toValue ?? "",
    note: event.note ?? "",
    actor: event.actor ?? "admin",
  });
}

export interface MutationResult {
  ok: boolean;
  error?: string;
}

/**
 * Move an order to a new status.
 *
 * The transition rules are checked here rather than only in the UI, because
 * the UI is not a gate. Illegal moves return their reason instead of throwing,
 * so the admin can show it.
 */
export async function setOrderStatus(
  orderId: number,
  next: string
): Promise<MutationResult> {
  await assertAdmin();
  if (!Number.isSafeInteger(orderId) || orderId < 1) {
    return { ok: false, error: "Bad order id" };
  }
  if (!isOrderStatus(next)) {
    return { ok: false, error: `Unknown status: ${next}` };
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) return { ok: false, error: "Order not found" };

  const from = order.status as OrderStatus;
  if (from === next) return { ok: true };

  const problem = transitionError(from, next, {
    hasTracking: Boolean(order.carrier && order.trackingNumber?.trim()),
  });
  if (problem) return { ok: false, error: problem };

  // Paying for something we then refuse to make is the wrong way round: an
  // unpaid order should not enter production.
  if (next === "in_production" && order.paymentStatus !== "paid") {
    return {
      ok: false,
      error: "This order has not been paid for yet. Do not start production on it.",
    };
  }

  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(ordersTable)
      .set({
        status: next,
        updatedAt: now,
        ...(next === "shipped" ? { shippedAt: order.shippedAt ?? now } : {}),
        ...(next === "delivered" ? { deliveredAt: order.deliveredAt ?? now } : {}),
      })
      .where(eq(ordersTable.id, orderId));

    await recordEvent(tx, {
      orderId,
      kind: "status",
      fromValue: from,
      toValue: next,
    });
  });

  // Emailed after the transaction commits, so a failed write never sends a
  // notification about a state the order is not in. sendShippedEmail is itself
  // guarded against sending twice.
  if (next === "shipped") {
    await sendShippedEmail(orderId);
  }

  revalidatePath("/admin/orders");
  return { ok: true };
}

/** Attach or correct the carrier and tracking number. */
export async function setOrderTracking(
  orderId: number,
  carrier: string,
  trackingNumber: string
): Promise<MutationResult> {
  await assertAdmin();
  if (!Number.isSafeInteger(orderId) || orderId < 1) {
    return { ok: false, error: "Bad order id" };
  }

  const number = trackingNumber.trim();
  if (!number) return { ok: false, error: "Enter a tracking number." };
  if (number.length > 60) return { ok: false, error: "That tracking number is too long." };
  if (!isCarrierCode(carrier)) {
    // Never guessed from the number's shape — a wrong carrier sends the
    // customer to a page saying their parcel does not exist.
    return { ok: false, error: "Choose the carrier." };
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) return { ok: false, error: "Order not found" };

  await db.transaction(async (tx) => {
    await tx
      .update(ordersTable)
      .set({ carrier, trackingNumber: number, updatedAt: new Date() })
      .where(eq(ordersTable.id, orderId));

    await recordEvent(tx, {
      orderId,
      kind: "tracking",
      fromValue: order.trackingNumber ?? "",
      toValue: `${carrier} ${number}`,
    });
  });

  revalidatePath("/admin/orders");
  return { ok: true };
}

/** A free-text note on the order, kept in the same history as everything else. */
export async function addOrderNote(
  orderId: number,
  note: string
): Promise<MutationResult> {
  await assertAdmin();
  const text = note.trim();
  if (!text) return { ok: false, error: "Write something first." };
  if (text.length > 1000) return { ok: false, error: "That note is too long." };

  await recordEvent(db, { orderId, kind: "note", note: text });
  revalidatePath("/admin/orders");
  return { ok: true };
}
