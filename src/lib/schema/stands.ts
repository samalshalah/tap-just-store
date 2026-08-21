import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  primaryKey,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { standTypesTable } from "./standTypes";
import { businessUsesTable } from "./businessUses";

/**
 * A stand is one canonical product, named after the action it drives.
 * Never named after a finish (Branded + QR is an option, not a product)
 * and never after a platform that has no printed artwork.
 */
export const standsTable = pgTable(
  "stands",
  {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  standTypeId: integer("stand_type_id")
    .notNull()
    .references(() => standTypesTable.id),

  /** Copy comes from the destination — never a Google fallback. */
  badge: text("badge").notNull().default(""),
  destinationLabel: text("destination_label").notNull().default("direct link"),
  /** "direct" = one customer URL. "multilink" = hosted Tap Rater page. */
  destinationKind: text("destination_kind").notNull().default("direct"),

  /** The line printed on the face. Editable by the customer on multi-link. */
  printedHeadline: text("printed_headline").notNull().default(""),
  headlineEditable: boolean("headline_editable").notNull().default(false),

  description: text("description").notNull().default(""),
  /** Draft stands never appear in the public shop. */
  status: text("status").notNull().default("draft"),

  /** Three media slots: card/gallery, branded angled, proof template. */
  mainImageUrl: text("main_image_url"),
  brandedImageUrl: text("branded_image_url"),
  frontTemplateUrl: text("front_template_url"),

  /** Auto-generated SEO unless an admin overrides it here. */
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),

  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("stands_status_sort_idx").on(t.status, t.sortOrder),
    // A typo in a status is the difference between a live product and one
    // nobody can buy, so the database refuses anything but these two.
    check("stands_status_check", sql`${t.status} IN ('draft','active')`),
    check(
      "stands_destination_kind_check",
      sql`${t.destinationKind} IN ('direct','multilink')`
    ),
  ]
);

export const standBusinessUsesTable = pgTable(
  "stand_business_uses",
  {
    standId: integer("stand_id")
      .notNull()
      .references(() => standsTable.id, { onDelete: "cascade" }),
    businessUseId: integer("business_use_id")
      .notNull()
      .references(() => businessUsesTable.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.standId, t.businessUseId] }),
    index("stand_business_uses_use_idx").on(t.businessUseId),
  ]
);

export type Stand = typeof standsTable.$inferSelect;
