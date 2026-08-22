-- Phase 05 — stop losing enquiries.
--
-- The contact form and the newsletter signup both returned success and then
-- did nothing but write a line to the platform log. A customer typed a
-- question, saw "thanks, we'll be in touch", and nobody was ever in touch.
--
-- The fix is to store the message rather than to email it. Email is a
-- notification and notifications fail: a provider has a bad minute, a key is
-- not configured yet, a spam filter eats it. If the only copy of an enquiry is
-- an email that failed to send, the enquiry is gone. Stored first, emailed
-- second, and the admin can read them either way.

BEGIN;

CREATE TABLE IF NOT EXISTS contact_messages (
  id         serial PRIMARY KEY,
  name       text NOT NULL,
  email      text NOT NULL,
  message    text NOT NULL,
  -- Set when someone opens it in the admin, so the unread count means
  -- something.
  read_at    timestamptz,
  -- Set by hand when it has been dealt with.
  handled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx
  ON contact_messages (created_at DESC);

-- Partial index: the admin's default view is "what have I not read", and that
-- is a small slice of a table that only grows.
CREATE INDEX IF NOT EXISTS contact_messages_unread_idx
  ON contact_messages (created_at DESC) WHERE read_at IS NULL;

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id             serial PRIMARY KEY,
  email          text NOT NULL,
  -- Kept as a row rather than deleted, so re-subscribing does not lose the
  -- fact that they once opted out.
  unsubscribed_at timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Case-insensitive, because Sam@Example.com and sam@example.com are one
-- person and signing up twice should not create two rows.
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_email_key
  ON newsletter_subscribers (lower(email));

COMMIT;
