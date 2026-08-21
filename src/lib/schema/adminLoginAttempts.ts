import { pgTable, serial, text, boolean, timestamp, index } from "drizzle-orm/pg-core";

/**
 * Admin sign-in attempts — the cross-isolate lockout counter and the audit
 * trail. Pruned by the login route, so it needs no scheduled job.
 */
export const adminLoginAttemptsTable = pgTable(
  "admin_login_attempts",
  {
    id: serial("id").primaryKey(),
    ip: text("ip").notNull(),
    succeeded: boolean("succeeded").notNull().default(false),
    attemptedAt: timestamp("attempted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("admin_login_attempts_ip_time_idx").on(t.ip, t.attemptedAt),
    index("admin_login_attempts_time_idx").on(t.attemptedAt),
  ]
);

export type AdminLoginAttempt = typeof adminLoginAttemptsTable.$inferSelect;
