import { pgTable, serial, integer, text, index } from "drizzle-orm/pg-core";
import { z } from "zod";
import { ordersTable } from "./orders";
import { standVariantsTable } from "./standVariants";

/**
 * One line of an order.
 *
 * The stand name, size and option are denormalised on purpose. A variant can
 * be repriced, renamed or retired, and none of that may change what an order
 * from last March says it was. The variant id is kept as a link for reporting
 * and is nulled rather than cascaded if the row ever goes.
 *
 * The setup columns are the reason this table exists in this shape: they are
 * what gets programmed onto the chip and printed onto the acrylic. Before
 * this they lived only in the customer's localStorage, which is not a place
 * to keep the instructions for making a physical object.
 */
export const orderItemsTable = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => ordersTable.id, { onDelete: "cascade" }),

    standVariantId: integer("stand_variant_id").references(
      () => standVariantsTable.id,
      { onDelete: "set null" }
    ),

    standName: text("stand_name").notNull(),
    size: text("size").notNull().default("a5"),
    optionCode: text("option_code").notNull().default("standard_direct"),

    quantity: integer("quantity").notNull(),
    /** Unit price as charged, integer cents. */
    priceCents: integer("price_cents").notNull(),

    /** Where a tap sends people. Burned into the chip, printed as the QR. */
    destinationUrl: text("destination_url").notNull(),
    /** Branded only: printed on the face. */
    businessName: text("business_name").notNull().default(""),
    /** Branded only: stored path of the uploaded logo. Null means text-only. */
    logoPath: text("logo_path"),
  },
  (t) => [
    // Every order page and the admin list read items by order id. Without
    // this the admin orders screen is a sequential scan per order.
    index("order_items_order_id_idx").on(t.orderId),
  ]
);

export const insertOrderItemSchema = z.object({
  orderId: z.number().int(),
  standVariantId: z.number().int().nullable(),
  standName: z.string(),
  size: z.string(),
  optionCode: z.string(),
  quantity: z.number().int().positive(),
  priceCents: z.number().int().nonnegative(),
  destinationUrl: z.string(),
  businessName: z.string(),
  logoPath: z.string().nullable(),
});
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItemsTable.$inferSelect;
