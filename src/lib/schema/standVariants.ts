import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  index,
  unique,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { standsTable } from "./stands";

export type StandSize = "a5" | "a4";
export type StandOption = "standard_direct" | "branded_qr_direct" | "hosted_multilink";

/**
 * Size x option. Prices are integer cents.
 *   A5 standard 3900 / branded 4900
 *   A4 standard 4900 / branded 6500
 * hosted_multilink additionally carries monthlyCents (999).
 */
export const standVariantsTable = pgTable(
  "stand_variants",
  {
    id: serial("id").primaryKey(),
    standId: integer("stand_id")
      .notNull()
      .references(() => standsTable.id, { onDelete: "cascade" }),
    size: text("size").notNull(),
    optionCode: text("option_code").notNull(),
    priceCents: integer("price_cents").notNull(),
    monthlyCents: integer("monthly_cents").notNull().default(0),
    sku: text("sku"),
    active: boolean("active").notNull().default(true),
  },
  // These constraints already exist in the hand-written SQL. They live here
  // too because db:push generates from this file — a push without them would
  // offer to drop every one.
  (t) => [
    index("stand_variants_stand_idx").on(t.standId),
    unique("stand_variants_unique").on(t.standId, t.size, t.optionCode),
    check("stand_variants_size_check", sql`${t.size} IN ('a5','a4')`),
    check(
      "stand_variants_option_check",
      sql`${t.optionCode} IN ('standard_direct','branded_qr_direct','hosted_multilink')`
    ),
    check("stand_variants_price_check", sql`${t.priceCents} >= 0`),
    check("stand_variants_monthly_check", sql`${t.monthlyCents} >= 0`),
  ]
);

export type StandVariant = typeof standVariantsTable.$inferSelect;
