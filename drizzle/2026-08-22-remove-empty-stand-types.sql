-- Phase 05 — remove the stand types nothing sells.
--
-- These three were inherited scaffolding. They have no stands, so their
-- landing pages 404, and they are dead SEO surface that the mega-menu already
-- has to filter out.
--
-- `feedback-survey-stands` is deliberately NOT removed, even though it also
-- shows as empty: it holds `rate-your-experience-stand`, which is a draft and
-- the only multilink stand in the catalogue. That is the Phase 06 product.
-- Deleting the type would strand it.
--
-- `custom-stands` goes because /custom-stands is a real page in its own right;
-- the taxonomy row was a second, broken way to reach the same idea.

BEGIN;

DELETE FROM stand_types
WHERE slug IN (
  'payment-tip-donation-stands',
  'loyalty-rewards-stands',
  'custom-stands'
)
-- Belt and braces: never delete a type that has acquired a stand since this
-- migration was written.
AND id NOT IN (SELECT stand_type_id FROM stands WHERE stand_type_id IS NOT NULL);

COMMIT;
