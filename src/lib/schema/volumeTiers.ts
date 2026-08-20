import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";

/** Mix-and-match volume discounts, applied on total stand quantity. */
export const volumeTiersTable = pgTable("volume_tiers", {
  id: serial("id").primaryKey(),
  minQuantity: integer("min_quantity").notNull().unique(),
  discountPercent: integer("discount_percent").notNull(),
  label: text("label").notNull().default(""),
});

export type VolumeTier = typeof volumeTiersTable.$inferSelect;
