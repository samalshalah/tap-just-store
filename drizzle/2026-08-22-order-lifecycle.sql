-- Phase 04 — the order lifecycle.
--
-- Three things:
--
-- 1. Tracking. An order cannot be marked shipped without a carrier and a
--    number, because the shipped email has to link somewhere.
--
-- 2. An audit trail. `status` only ever shows the current state, so "when did
--    this ship?" and "who cancelled it?" were unanswerable. order_events
--    records every change, and it is append-only.
--
-- 3. Optional stock per variant. Nullable on purpose: null means untracked,
--    so counting stock is opt-in per row rather than a model imposed on
--    every product.
--
-- Statuses move from the dispensary counter's vocabulary
-- (pending/ready/completed/cancelled) to a shipping one. Existing rows are
-- mapped rather than dropped, though production has none yet.

BEGIN;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS carrier         text,
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS shipped_at      timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at    timestamptz,
  -- Set when the shipped email actually goes out, so a status walked back and
  -- forward again does not email the customer twice.
  ADD COLUMN IF NOT EXISTS shipped_email_sent_at timestamptz;

-- Map the old vocabulary onto the new one before constraining the column.
UPDATE orders SET status = 'new'           WHERE status = 'pending';
UPDATE orders SET status = 'in_production' WHERE status = 'ready';
UPDATE orders SET status = 'delivered'     WHERE status = 'completed';
UPDATE orders SET status = 'new'           WHERE status NOT IN
  ('new','in_production','shipped','delivered','cancelled');

ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'new';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_status_check') THEN
    ALTER TABLE orders ADD CONSTRAINT orders_status_check
      CHECK (status IN ('new','in_production','shipped','delivered','cancelled'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_carrier_check') THEN
    ALTER TABLE orders ADD CONSTRAINT orders_carrier_check
      CHECK (carrier IS NULL OR carrier IN ('usps','ups','fedex','dhl'));
  END IF;
END $$;

-- A shipped order must have something to track. Enforced in the database as
-- well as in the code, because this is the guarantee the shipped email relies
-- on and code paths multiply.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_shipped_needs_tracking') THEN
    ALTER TABLE orders ADD CONSTRAINT orders_shipped_needs_tracking
      CHECK (
        status NOT IN ('shipped','delivered')
        OR (carrier IS NOT NULL AND tracking_number IS NOT NULL
            AND length(btrim(tracking_number)) > 0)
      );
  END IF;
END $$;

-- ---------------------------------------------------------------- audit trail

CREATE TABLE IF NOT EXISTS order_events (
  id         serial PRIMARY KEY,
  order_id   integer NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  -- 'status' | 'payment' | 'tracking' | 'note'
  kind       text NOT NULL,
  from_value text NOT NULL DEFAULT '',
  to_value   text NOT NULL DEFAULT '',
  note       text NOT NULL DEFAULT '',
  -- 'admin' | 'stripe' | 'system'. There is one admin login, so this records
  -- which mechanism acted rather than which person.
  actor      text NOT NULL DEFAULT 'system',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT order_events_kind_check
    CHECK (kind IN ('status','payment','tracking','note'))
);

CREATE INDEX IF NOT EXISTS order_events_order_id_idx
  ON order_events (order_id, created_at DESC);

-- -------------------------------------------------------------------- stock
--
-- NULL means "not counted". Opt-in per variant, so nothing is forced to have
-- an inventory model it does not need.

ALTER TABLE stand_variants
  ADD COLUMN IF NOT EXISTS stock_quantity      integer,
  ADD COLUMN IF NOT EXISTS low_stock_threshold integer NOT NULL DEFAULT 5;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stand_variants_stock_check') THEN
    ALTER TABLE stand_variants ADD CONSTRAINT stand_variants_stock_check
      CHECK (stock_quantity IS NULL OR stock_quantity >= 0);
  END IF;
END $$;

COMMIT;
