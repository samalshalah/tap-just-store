import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";

export type StandSize = "a5" | "a4";
export type StandOption = "standard_direct" | "branded_qr_direct" | "hosted_multilink";

/**
 * Size x option. Prices are integer cents.
 *   A5 standard 3900 / branded 4900
 *   A4 standard 4900 / branded 6500
 * hosted_multilink additionally carries monthlyCents (999).
 */
export const standVariantsTable = pgTable("stand_variants", {
  id: serial("id").primaryKey(),
  standId: integer("stand_id").notNull(),
  size: text("size").notNull(),
  optionCode: text("option_code").notNull(),
  priceCents: integer("price_cents").notNull(),
  monthlyCents: integer("monthly_cents").notNull().default(0),
  sku: text("sku"),
  active: boolean("active").notNull().default(true),
});

export type StandVariant = typeof standVariantsTable.$inferSelect;
