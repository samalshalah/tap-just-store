-- Locked taxonomies -----------------------------------------------------
INSERT INTO stand_types (slug, name, sort_order) VALUES
 ('review-stands','Review Stands',1),
 ('social-media-stands','Social Media Stands',2),
 ('appointment-reservation-stands','Appointment & Reservation Stands',3),
 ('feedback-survey-stands','Feedback & Survey Stands',4),
 ('menu-info-stands','Menu & Info Stands',5),
 ('website-link-stands','Website & Link Stands',6),
 ('payment-tip-donation-stands','Payment, Tip & Donation Stands',7),
 ('loyalty-rewards-stands','Loyalty & Rewards Stands',8),
 ('custom-stands','Custom Stands',9)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO business_uses (slug, name, sort_order) VALUES
 ('automotive','Automotive',1),
 ('restaurant-food','Restaurant / Food',2),
 ('hotel-travel','Hotel / Travel',3),
 ('healthcare-dental','Healthcare / Dental',4),
 ('home-services','Home Services',5),
 ('legal','Legal',6),
 ('real-estate','Real Estate',7),
 ('beauty-salon-wellness','Beauty / Salon / Wellness',8),
 ('ecommerce-online-brand','Ecommerce / Online Brand',9),
 ('retail-local-business','Retail / Local Business',10)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO volume_tiers (min_quantity, discount_percent, label) VALUES
 (3, 15, 'Buy 3, save 15%'),
 (5, 20, 'Buy 5, save 20%'),
 (10, 25, 'Buy 10, save 25%')
ON CONFLICT (min_quantity) DO UPDATE SET discount_percent = EXCLUDED.discount_percent, label = EXCLUDED.label;
