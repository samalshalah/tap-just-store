/**
 * data.ts — order reads used by Server Components.
 *
 * This file used to be the whole catalogue layer. The catalogue now lives in
 * stands-data.ts; what is left here is orders, which are still keyed to the
 * legacy products table until checkout is repointed at stand variants.
 */

import "server-only";
import { eq, desc } from "drizzle-orm";
import { db, ordersTable, orderItemsTable } from "./db";

export type Order = typeof ordersTable.$inferSelect;
export type OrderItem = typeof orderItemsTable.$inferSelect;

export async function getOrderById(id: number): Promise<
  (Order & { items: OrderItem[] }) | null
> {
  if (!id || isNaN(id)) return null;
  try {
    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, id))
      .limit(1);
    if (!order) return null;
    const items = await db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, order.id));
    return { ...order, items };
  } catch (err) {
    console.error("[data] getOrderById failed:", err);
    return null;
  }
}

export async function getAllOrders(): Promise<
  (Order & { items: OrderItem[] })[]
> {
  try {
    const orders = await db
      .select()
      .from(ordersTable)
      .orderBy(desc(ordersTable.createdAt));
    return await Promise.all(
      orders.map(async (o) => {
        const items = await db
          .select()
          .from(orderItemsTable)
          .where(eq(orderItemsTable.orderId, o.id));
        return { ...o, items };
      })
    );
  } catch (err) {
    console.error("[data] getAllOrders failed:", err);
    return [];
  }
}
