import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Newsletter signups.
 *
 * An unsubscribe sets a timestamp rather than deleting the row, so
 * re-subscribing later does not erase the fact that they once opted out —
 * which is the thing you need to be able to show if anyone ever asks.
 *
 * The unique index is on lower(email) and lives in SQL: Sam@Example.com and
 * sam@example.com are one person.
 */
export const newsletterSubscribersTable = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type NewsletterSubscriber = typeof newsletterSubscribersTable.$inferSelect;
