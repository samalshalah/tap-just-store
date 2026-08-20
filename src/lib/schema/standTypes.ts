import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

/** The 9 locked stand types — what the stand helps a customer do. */
export const standTypesTable = pgTable("stand_types", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  /** Path to the lifestyle photo on the landing page. Empty = text-only hero. */
  heroImageUrl: text("hero_image_url").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type StandType = typeof standTypesTable.$inferSelect;
