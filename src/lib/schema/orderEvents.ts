import { pgTable, serial, integer, text, timestamp, index } from "drizzle-orm/pg-core";

/**
 * Every change to an order, append-only.
 *
 * `orders.status` only ever holds the current state, so questions that matter
 * to a real business were unanswerable: when did this actually ship? Was it
 * cancelled before or after the customer complained? Did the refund come
 * before or after we posted it?
 *
 * Nothing here is ever updated or deleted. That is the point — an audit trail
 * that can be edited is not one.
 */
export const orderEventsTable = pgTable(
  "order_events",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id").notNull(),
    /** status | payment | tracking | note */
    kind: text("kind").notNull(),
    fromValue: text("from_value").notNull().default(""),
    toValue: text("to_value").notNull().default(""),
    note: text("note").notNull().default(""),
    /**
     * admin | stripe | system.
     *
     * There is one shared admin login, so this records which mechanism made
     * the change rather than which person — honest about what we can know.
     */
    actor: text("actor").notNull().default("system"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("order_events_order_id_idx").on(t.orderId, t.createdAt)]
);

export type OrderEvent = typeof orderEventsTable.$inferSelect;
