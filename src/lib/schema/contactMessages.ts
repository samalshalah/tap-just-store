import { pgTable, serial, text, timestamp, index } from "drizzle-orm/pg-core";

/**
 * Messages from the contact form.
 *
 * Stored rather than emailed, because email is a notification and
 * notifications fail. If the only copy of an enquiry is a message that Resend
 * could not deliver, the enquiry is gone and the customer is waiting for a
 * reply that will never come. The row is the record; the email is a nudge.
 */
export const contactMessagesTable = pgTable(
  "contact_messages",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    message: text("message").notNull(),
    /** Set when it is opened in the admin, so an unread count means something. */
    readAt: timestamp("read_at", { withTimezone: true }),
    /** Set by hand when it has actually been dealt with. */
    handledAt: timestamp("handled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("contact_messages_created_at_idx").on(t.createdAt)]
);

export type ContactMessage = typeof contactMessagesTable.$inferSelect;
