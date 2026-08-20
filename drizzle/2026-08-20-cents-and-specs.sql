-- Money is now stored as integer CENTS everywhere.
-- Existing rows were authored in whole dollars, so scale them once.
UPDATE products     SET price = price * 100 WHERE price < 1000;
UPDATE products     SET sale_price = sale_price * 100 WHERE sale_price IS NOT NULL AND sale_price < 1000;
UPDATE orders       SET total_price = total_price * 100 WHERE total_price < 1000;
UPDATE order_items  SET price_per_item = price_per_item * 100 WHERE price_per_item < 1000;

-- Cannabis-era columns stay for backwards compatibility but are no longer
-- required: give them defaults so inserts never have to mention them.
ALTER TABLE products ALTER COLUMN strain SET DEFAULT '';
ALTER TABLE products ALTER COLUMN thc    SET DEFAULT '';
ALTER TABLE products ALTER COLUMN cbd    SET DEFAULT '';

-- Hardware spec fields that replace them in the UI.
ALTER TABLE products ADD COLUMN IF NOT EXISTS material   text NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS chip_type  text NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS dimensions text NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS mount_type text NOT NULL DEFAULT '';
