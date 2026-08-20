-- Hero photography for the indexable landing pages.
--
-- The image lives as a static asset under /images/landing/<slug>.(jpg|webp);
-- this column stores the path so an admin can point a page at a different
-- file — or clear it, which makes the page fall back to the text-only hero
-- rather than rendering a broken image.

ALTER TABLE business_uses
  ADD COLUMN IF NOT EXISTS hero_image_url text NOT NULL DEFAULT '';

ALTER TABLE stand_types
  ADD COLUMN IF NOT EXISTS hero_image_url text NOT NULL DEFAULT '';

-- The one photo we have so far.
UPDATE business_uses
   SET hero_image_url = '/images/landing/restaurant-food.jpg'
 WHERE slug = 'restaurant-food';
