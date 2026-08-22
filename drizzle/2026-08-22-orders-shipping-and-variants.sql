-- Phase 03a — turn the pickup-counter order model into a shipping one.
--
-- The orders table was inherited from the dispensary template: it had
-- `preferred_pickup_time` and no address at all, because nothing was ever
-- posted. It also stored one `total_price` with no breakdown, so there was
-- nowhere to record what was charged for shipping or tax — which is exactly
-- what a customer disputes and what a tax filing needs.
--
-- Line items pointed at `products`, a table the catalogue deletion emptied.
-- They now point at `stand_variants`, and each line carries the setup the
-- customer configured: the destination URL, and for a branded stand the
-- business name and logo. That is what the production queue prints from, so
-- it belongs on the order and not only in a browser's localStorage.
--
-- Safe to restructure rather than migrate: production has zero orders and
-- zero order items (checked 2026-08-22).

BEGIN;

-- ---------------------------------------------------------------- order_items

DROP TABLE IF EXISTS order_items CASCADE;

CREATE TABLE order_items (
  id                serial PRIMARY KEY,
  order_id          integer NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  -- The variant is the row that was priced. Nulled rather than cascaded if a
  -- variant is ever removed, because an order must survive its catalogue.
  stand_variant_id  integer REFERENCES stand_variants(id) ON DELETE SET NULL,

  -- Denormalised so an order still reads correctly years later, whatever
  -- happens to the stand it came from.
  stand_name        text NOT NULL,
  size              text NOT NULL DEFAULT 'a5',
  option_code       text NOT NULL DEFAULT 'standard_direct',

  quantity          integer NOT NULL,
  price_cents       integer NOT NULL,

  -- What gets programmed onto the chip and printed onto the acrylic.
  destination_url   text NOT NULL,
  business_name     text NOT NULL DEFAULT '',
  logo_path         text,

  CONSTRAINT order_items_quantity_check   CHECK (quantity > 0),
  CONSTRAINT order_items_price_check      CHECK (price_cents >= 0),
  CONSTRAINT order_items_size_check       CHECK (size IN ('a5','a4')),
  CONSTRAINT order_items_option_check
    CHECK (option_code IN ('standard_direct','branded_qr_direct','hosted_multilink'))
);

CREATE INDEX order_items_order_id_idx ON order_items (order_id);

-- --------------------------------------------------------------------- orders

ALTER TABLE orders DROP COLUMN IF EXISTS preferred_pickup_time;

-- A single total cannot answer "what did I pay for shipping?" or "how much
-- tax did I collect in Virginia last quarter?". Every component is stored.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS subtotal_cents  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_cents  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_label  text    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS shipping_cents  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_cents       integer NOT NULL DEFAULT 0;

-- Shipping address. US-only for now, but country is stored rather than
-- assumed so opening another market is a data change, not a schema change.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS ship_name        text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS ship_line1       text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS ship_line2       text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS ship_city        text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS ship_state       text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS ship_postal_code text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS ship_country     text NOT NULL DEFAULT 'US';

-- Payment. `status` stays the fulfilment state (pending, printing, shipped);
-- whether the money arrived is a separate question and gets its own column,
-- because an order can be paid and unshipped or shipped and refunded.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id  text,
  ADD COLUMN IF NOT EXISTS stripe_tax_calculation_id text,
  ADD COLUMN IF NOT EXISTS paid_at    timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- One order per payment intent. This is the idempotency guarantee: Stripe
-- retries webhooks, and a customer can double-click Pay. Without this a
-- retried webhook is a duplicate order.
CREATE UNIQUE INDEX IF NOT EXISTS orders_payment_intent_key
  ON orders (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON orders (payment_status);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_payment_status_check'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check
      CHECK (payment_status IN ('unpaid','processing','paid','failed','refunded'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_amounts_check'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT orders_amounts_check
      CHECK (
        subtotal_cents >= 0 AND discount_cents >= 0 AND
        shipping_cents >= 0 AND tax_cents >= 0 AND total_price >= 0
      );
  END IF;
END $$;

-- ------------------------------------------------- drop the legacy catalogue
--
-- Kept until now only because order_items referenced products. It does not
-- any more, and all four tables are empty in production.

DROP TABLE IF EXISTS restock_history CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS brands CASCADE;

COMMIT;
