import { pgTable, text, serial, timestamp, integer, index } from "drizzle-orm/pg-core";
import { z } from "zod";

export const ordersTable = pgTable(
  "orders",
  {
  id: serial("id").primaryKey(),
  /**
   * Unique because the code is now an authorisation token for the
   * confirmation page, and because the collision-retry loop in /api/orders
   * was checking for a duplicate with nothing stopping two concurrent
   * transactions choosing the same one.
   */
  confirmationCode: text("confirmation_code").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  preferredPickupTime: text("preferred_pickup_time").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  totalPrice: integer("total_price").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // The admin list is ordered by this column and nothing else.
    index("orders_created_at_idx").on(t.createdAt),
    index("orders_status_idx").on(t.status),
  ]
);

export const insertOrderSchema = z.object({
  confirmationCode: z.string(),
  customerName: z.string(),
  customerEmail: z.string(),
  customerPhone: z.string(),
  preferredPickupTime: z.string(),
  notes: z.string().optional(),
  status: z.string().optional(),
  totalPrice: z.number().int(),
});
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
