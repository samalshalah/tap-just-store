-- A record of every admin sign-in attempt.
--
-- Two jobs. It is the lockout counter that works across isolates — the
-- in-memory limiter in rate-limit.ts is per-isolate, so on Workers it cannot
-- see an attacker spread across many. And it is the audit trail the admin had
-- none of: who tried, from where, and whether they got in.
--
-- Rows are pruned by the login route itself, so this never needs a cron.

CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id          serial PRIMARY KEY,
  ip          text NOT NULL,
  succeeded   boolean NOT NULL DEFAULT false,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_login_attempts_ip_time_idx
  ON admin_login_attempts (ip, attempted_at DESC);

CREATE INDEX IF NOT EXISTS admin_login_attempts_time_idx
  ON admin_login_attempts (attempted_at DESC);
