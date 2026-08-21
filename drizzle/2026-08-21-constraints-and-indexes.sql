-- Bring the databases in line with the Drizzle schema.
--
-- Most of these already existed in the hand-written table SQL but not in
-- src/lib/schema, which is what db:push generates from — so a push would have
-- offered to drop them. The rest are new: the unique confirmation code, the
-- status checks, and the indexes the admin order list has been living without.

-- Orders -------------------------------------------------------------------

-- The confirmation code now authorises the confirmation page, and the
-- collision-retry loop in /api/orders had nothing enforcing it.
DELETE FROM orders a
 USING orders b
 WHERE a.confirmation_code = b.confirmation_code AND a.id > b.id;

CREATE UNIQUE INDEX IF NOT EXISTS orders_confirmation_code_key
  ON orders (confirmation_code);

CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at);
CREATE INDEX IF NOT EXISTS orders_status_idx     ON orders (status);

-- Every order page reads its items by order id.
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items (order_id);

-- Stands -------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS stands_status_sort_idx ON stands (status, sort_order);
CREATE INDEX IF NOT EXISTS stand_business_uses_use_idx
  ON stand_business_uses (business_use_id);

ALTER TABLE stands DROP CONSTRAINT IF EXISTS stands_status_check;
ALTER TABLE stands ADD CONSTRAINT stands_status_check
  CHECK (status IN ('draft','active'));

ALTER TABLE stands DROP CONSTRAINT IF EXISTS stands_destination_kind_check;
ALTER TABLE stands ADD CONSTRAINT stands_destination_kind_check
  CHECK (destination_kind IN ('direct','multilink'));

ALTER TABLE stand_variants DROP CONSTRAINT IF EXISTS stand_variants_price_check;
ALTER TABLE stand_variants ADD CONSTRAINT stand_variants_price_check
  CHECK (price_cents >= 0);

ALTER TABLE stand_variants DROP CONSTRAINT IF EXISTS stand_variants_monthly_check;
ALTER TABLE stand_variants ADD CONSTRAINT stand_variants_monthly_check
  CHECK (monthly_cents >= 0);

-- Stock cannot go negative -------------------------------------------------
-- The order route reads stock outside its transaction and decrements inside
-- it, so two orders for the last unit both pass validation. Fixing that race
-- properly is phase 3; until then the database refuses the impossible state
-- rather than silently recording it.
UPDATE products SET quantity = 0 WHERE quantity < 0;

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_quantity_check;
ALTER TABLE products ADD CONSTRAINT products_quantity_check
  CHECK (quantity IS NULL OR quantity >= 0);
