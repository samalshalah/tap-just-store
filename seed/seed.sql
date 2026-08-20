-- Tap Rater starting state: one brand, one category, no products.
-- Safe to re-run; it resets the catalog.
TRUNCATE order_items, orders, restock_history, products, brands, categories RESTART IDENTITY CASCADE;

INSERT INTO brands (name, description, website, featured) VALUES
 ('Tap Rater', 'NFC review stands for local businesses.', '', true);

INSERT INTO categories (name, slug, description) VALUES
 ('NFC Stands', 'nfc-stands', 'Countertop NFC stands that open your review page in one tap.');

INSERT INTO site_settings (key, value) VALUES
 ('store','{"name":"Tap-Just","tagline":"NFC stands that turn taps into reviews","footer_text":"Tap-Just — NFC hardware for local businesses.","display_age_gate":false,"phone":"(202) 555-0134","address":"Washington, DC","timezone":"America/New_York","order_confirmation_enabled":false}'),
 ('seo','{"title_template":"%s | Tap-Just","meta_description":"NFC stands for collecting reviews with one tap.","city":"Washington","canonical_domain":"http://localhost:3000"}'),
 ('menu_config','{"show_strain_badge":false,"show_thc_badge":false,"show_category":true,"show_sale_badge":true,"columns":4,"mobile_columns":2,"default_sort":"new","search_enabled":true,"filter_category":true,"filter_strain":false,"filter_brand":false}'),
 ('shop_config','{"h1":"Shop NFC Stands","subtitle":"Tap Rater countertop stands.","layout":"hybrid","sidebar_show_category":true,"sidebar_show_strain":false,"sidebar_show_feel":false,"sidebar_show_brand":false,"sidebar_show_price":true,"card_show_strain_badge":false,"card_show_thc_badge":false,"card_show_sale_badge":true,"desktop_columns":4,"mobile_columns":2,"page_size":24,"default_sort":"featured"}'),
 ('pdp_config','{"show_specs":false,"show_effects":false,"show_terpenes":false,"show_flavors":false,"show_trust_badges":true,"show_related":true,"related_count":4,"show_breadcrumb":true}'),
 ('homepage_sections','{"hero":{"visible":true,"badge":"NFC hardware","headline":"One tap. More reviews.","subheadline":"Countertop NFC stands that send customers straight to your review page.","cta_primary":"Shop stands","cta_primary_link":"/shop","cta_secondary":"How it works","cta_secondary_link":"/about"},"categories":{"visible":true,"title":"Browse"},"featured":{"visible":true,"title":"Best sellers"},"why_us":{"visible":true,"title":"Why Tap-Just"},"testimonials":{"visible":false},"newsletter":{"visible":true,"title":"Get restock alerts"}}'),
 ('checkout_config','{"require_name":true,"require_email":true,"require_phone":false,"guest_checkout":true,"payment_cash":true,"terms_required":false,"tipping_enabled":false}'),
 ('ordering','{"pickup_enabled":true,"delivery_enabled":true,"delivery_fee":5,"pause_all_orders":false}'),
 ('contact','{"title":"Contact","subtitle":"Questions about bulk orders?","email":"hello@example.com"}'),
 ('about','{"title":"About","headline":"NFC hardware for local businesses","content":"We build countertop NFC stands that make it effortless for customers to leave a review."}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
