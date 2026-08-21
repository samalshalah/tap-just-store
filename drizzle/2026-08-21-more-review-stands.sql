-- Eight more review stands, from the product renders in public/images/stands.
--
-- Every one is a Review Stand: the printed panel on each render reads
-- "Review us on <platform>", so that is what the product is. They are tagged
-- into business uses, never duplicated per category.
--
-- Branded images are deliberately left empty across the whole catalogue: the
-- branded renders do not exist yet, and an empty column makes the gallery show
-- one view rather than a mismatched second picture.

INSERT INTO stands
  (slug, name, stand_type_id, badge, destination_label, destination_kind,
   printed_headline, headline_editable, status, main_image_url,
   branded_image_url, seo_title, seo_description, sort_order)
SELECT v.slug, v.name, st.id, v.badge, v.destination_label, 'direct',
       v.printed_headline, false, 'active',
       '/images/stands/' || v.slug || '.webp?v=1784334036', '',
       '', '', v.sort_order
FROM (VALUES
  ('trustpilot-review-stand',   'Trustpilot Review Stand',           'TRUSTPILOT REVIEW',  'Trustpilot review',           'Review us on Trustpilot',            10),
  ('bbb-review-stand',          'Better Business Bureau Stand',      'BBB REVIEW',         'Better Business Bureau review','Review us on Better Business Bureau',11),
  ('nextdoor-review-stand',     'Nextdoor Review Stand',             'NEXTDOOR REVIEW',    'Nextdoor review',             'Review us on Nextdoor',              12),
  ('yellow-pages-review-stand', 'Yellow Pages Review Stand',         'YELLOW PAGES REVIEW','Yellow Pages review',         'Review us on Yellow Pages',          13),
  ('apple-maps-review-stand',   'Apple Maps Review Stand',           'APPLE MAPS REVIEW',  'Apple Maps review',           'Review us on Apple Maps',            14),
  ('bing-places-review-stand',  'Bing Places Review Stand',          'BING PLACES REVIEW', 'Bing Places review',          'Review us on Bing Places',           15),
  ('opentable-review-stand',    'OpenTable Review Stand',            'OPENTABLE REVIEW',   'OpenTable review',            'Review us on OpenTable',             16),
  ('toast-review-stand',        'Toast Review Stand',                'TOAST REVIEW',       'Toast review',                'Review us on Toast',                 17)
) AS v(slug, name, badge, destination_label, printed_headline, sort_order)
CROSS JOIN stand_types st
WHERE st.slug = 'review-stands'
ON CONFLICT (slug) DO NOTHING;

-- Same variant grid as every other direct stand: A5 39/49, A4 49/65.
INSERT INTO stand_variants (stand_id, size, option_code, price_cents, monthly_cents, active)
SELECT s.id, v.size, v.option_code, v.price_cents, 0, true
FROM stands s
CROSS JOIN (VALUES
  ('a5', 'standard_direct',   3900),
  ('a5', 'branded_qr_direct', 4900),
  ('a4', 'standard_direct',   4900),
  ('a4', 'branded_qr_direct', 6500)
) AS v(size, option_code, price_cents)
WHERE s.slug IN ('trustpilot-review-stand','bbb-review-stand','nextdoor-review-stand',
                 'yellow-pages-review-stand','apple-maps-review-stand',
                 'bing-places-review-stand','opentable-review-stand','toast-review-stand')
ON CONFLICT (stand_id, size, option_code) DO NOTHING;

-- Business uses, chosen per platform rather than pasted across all eight.
INSERT INTO stand_business_uses (stand_id, business_use_id)
SELECT s.id, bu.id
FROM (VALUES
  ('trustpilot-review-stand',   'ecommerce-online-brand'),
  ('trustpilot-review-stand',   'retail-local-business'),
  ('trustpilot-review-stand',   'legal'),
  ('trustpilot-review-stand',   'home-services'),
  ('bbb-review-stand',          'home-services'),
  ('bbb-review-stand',          'legal'),
  ('bbb-review-stand',          'automotive'),
  ('bbb-review-stand',          'retail-local-business'),
  ('nextdoor-review-stand',     'home-services'),
  ('nextdoor-review-stand',     'retail-local-business'),
  ('nextdoor-review-stand',     'beauty-salon-wellness'),
  ('nextdoor-review-stand',     'real-estate'),
  ('yellow-pages-review-stand', 'home-services'),
  ('yellow-pages-review-stand', 'automotive'),
  ('yellow-pages-review-stand', 'legal'),
  ('yellow-pages-review-stand', 'retail-local-business'),
  ('apple-maps-review-stand',   'retail-local-business'),
  ('apple-maps-review-stand',   'restaurant-food'),
  ('apple-maps-review-stand',   'hotel-travel'),
  ('apple-maps-review-stand',   'beauty-salon-wellness'),
  ('bing-places-review-stand',  'retail-local-business'),
  ('bing-places-review-stand',  'home-services'),
  ('bing-places-review-stand',  'automotive'),
  ('opentable-review-stand',    'restaurant-food'),
  ('opentable-review-stand',    'hotel-travel'),
  ('toast-review-stand',        'restaurant-food'),
  ('toast-review-stand',        'retail-local-business')
) AS t(stand_slug, use_slug)
JOIN stands s ON s.slug = t.stand_slug
JOIN business_uses bu ON bu.slug = t.use_slug
ON CONFLICT DO NOTHING;

-- Hide the Branded + QR picture everywhere until the branded renders exist.
-- The Branded + QR option itself stays: it comes from stand_variants.
UPDATE stands SET branded_image_url = '';
