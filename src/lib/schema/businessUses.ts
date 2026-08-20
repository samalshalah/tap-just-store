import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

/** The 10 locked business uses — which industries a stand suits. */
export const businessUsesTable = pgTable("business_uses", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  /** Path to the lifestyle photo on the landing page. Empty = text-only hero. */
  heroImageUrl: text("hero_image_url").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type BusinessUse = typeof businessUsesTable.$inferSelect;
