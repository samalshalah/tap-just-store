INSERT INTO stands (slug,name,stand_type_id,badge,destination_label,destination_kind,printed_headline,headline_editable,status,sort_order)
SELECT 'google-review-stand','Google Review Stand',st.id,'GOOGLE REVIEW','Google review','direct','Review us on Google',false,'active',1
FROM stand_types st WHERE st.slug='review-stands'
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, badge=EXCLUDED.badge,
  destination_label=EXCLUDED.destination_label, printed_headline=EXCLUDED.printed_headline,
  destination_kind=EXCLUDED.destination_kind, headline_editable=EXCLUDED.headline_editable,
  status=EXCLUDED.status, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='google-review-stand' AND b.slug='automotive'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='google-review-stand' AND b.slug='restaurant-food'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='google-review-stand' AND b.slug='hotel-travel'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='google-review-stand' AND b.slug='healthcare-dental'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='google-review-stand' AND b.slug='home-services'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='google-review-stand' AND b.slug='legal'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='google-review-stand' AND b.slug='real-estate'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='google-review-stand' AND b.slug='beauty-salon-wellness'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='google-review-stand' AND b.slug='retail-local-business'
ON CONFLICT DO NOTHING;
INSERT INTO stand_variants (stand_id,size,option_code,price_cents,sku)
SELECT s.id,'a5','standard_direct',3900,'TR-GOO-A5-STD' FROM stands s WHERE s.slug='google-review-stand'
ON CONFLICT (stand_id,size,option_code) DO UPDATE SET price_cents=EXCLUDED.price_cents, sku=EXCLUDED.sku;
INSERT INTO stand_variants (stand_id,size,option_code,price_cents,sku)
SELECT s.id,'a5','branded_qr_direct',4900,'TR-GOO-A5-BQR' FROM stands s WHERE s.slug='google-review-stand'
ON CONFLICT (stand_id,size,option_code) DO UPDATE SET price_cents=EXCLUDED.price_cents, sku=EXCLUDED.sku;
INSERT INTO stand_variants (stand_id,size,option_code,price_cents,sku)
SELECT s.id,'a4','standard_direct',4900,'TR-GOO-A4-STD' FROM stands s WHERE s.slug='google-review-stand'
ON CONFLICT (stand_id,size,option_code) DO UPDATE SET price_cents=EXCLUDED.price_cents, sku=EXCLUDED.sku;
INSERT INTO stand_variants (stand_id,size,option_code,price_cents,sku)
SELECT s.id,'a4','branded_qr_direct',6500,'TR-GOO-A4-BQR' FROM stands s WHERE s.slug='google-review-stand'
ON CONFLICT (stand_id,size,option_code) DO UPDATE SET price_cents=EXCLUDED.price_cents, sku=EXCLUDED.sku;
INSERT INTO stands (slug,name,stand_type_id,badge,destination_label,destination_kind,printed_headline,headline_editable,status,sort_order)
SELECT 'yelp-review-stand','Yelp Review Stand',st.id,'YELP REVIEW','Yelp review','direct','Review us on Yelp',false,'active',2
FROM stand_types st WHERE st.slug='review-stands'
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, badge=EXCLUDED.badge,
  destination_label=EXCLUDED.destination_label, printed_headline=EXCLUDED.printed_headline,
  destination_kind=EXCLUDED.destination_kind, headline_editable=EXCLUDED.headline_editable,
  status=EXCLUDED.status, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='yelp-review-stand' AND b.slug='restaurant-food'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='yelp-review-stand' AND b.slug='hotel-travel'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='yelp-review-stand' AND b.slug='home-services'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='yelp-review-stand' AND b.slug='beauty-salon-wellness'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='yelp-review-stand' AND b.slug='retail-local-business'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='yelp-review-stand' AND b.slug='automotive'
ON CONFLICT DO NOTHING;
INSERT INTO stand_variants (stand_id,size,option_code,price_cents,sku)
SELECT s.id,'a5','standard_direct',3900,'TR-YEL-A5-STD' FROM stands s WHERE s.slug='yelp-review-stand'
ON CONFLICT (stand_id,size,option_code) DO UPDATE SET price_cents=EXCLUDED.price_cents, sku=EXCLUDED.sku;
INSERT INTO stand_variants (stand_id,size,option_code,price_cents,sku)
SELECT s.id,'a5','branded_qr_direct',4900,'TR-YEL-A5-BQR' FROM stands s WHERE s.slug='yelp-review-stand'
ON CONFLICT (stand_id,size,option_code) DO UPDATE SET price_cents=EXCLUDED.price_cents, sku=EXCLUDED.sku;
INSERT INTO stand_variants (stand_id,size,option_code,price_cents,sku)
SELECT s.id,'a4','standard_direct',4900,'TR-YEL-A4-STD' FROM stands s WHERE s.slug='yelp-review-stand'
ON CONFLICT (stand_id,size,option_code) DO UPDATE SET price_cents=EXCLUDED.price_cents, sku=EXCLUDED.sku;
INSERT INTO stand_variants (stand_id,size,option_code,price_cents,sku)
SELECT s.id,'a4','branded_qr_direct',6500,'TR-YEL-A4-BQR' FROM stands s WHERE s.slug='yelp-review-stand'
ON CONFLICT (stand_id,size,option_code) DO UPDATE SET price_cents=EXCLUDED.price_cents, sku=EXCLUDED.sku;
INSERT INTO stands (slug,name,stand_type_id,badge,destination_label,destination_kind,printed_headline,headline_editable,status,sort_order)
SELECT 'facebook-review-stand','Facebook Review Stand',st.id,'FACEBOOK REVIEW','Facebook review','direct','Review us on Facebook',false,'active',3
FROM stand_types st WHERE st.slug='review-stands'
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, badge=EXCLUDED.badge,
  destination_label=EXCLUDED.destination_label, printed_headline=EXCLUDED.printed_headline,
  destination_kind=EXCLUDED.destination_kind, headline_editable=EXCLUDED.headline_editable,
  status=EXCLUDED.status, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='facebook-review-stand' AND b.slug='restaurant-food'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='facebook-review-stand' AND b.slug='beauty-salon-wellness'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='facebook-review-stand' AND b.slug='retail-local-business'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='facebook-review-stand' AND b.slug='home-services'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='facebook-review-stand' AND b.slug='healthcare-dental'
ON CONFLICT DO NOTHING;
INSERT INTO stand_variants (stand_id,size,option_code,price_cents,sku)
SELECT s.id,'a5','standard_direct',3900,'TR-FAC-A5-STD' FROM stands s WHERE s.slug='facebook-review-stand'
ON CONFLICT (stand_id,size,option_code) DO UPDATE SET price_cents=EXCLUDED.price_cents, sku=EXCLUDED.sku;
INSERT INTO stand_variants (stand_id,size,option_code,price_cents,sku)
SELECT s.id,'a5','branded_qr_direct',4900,'TR-FAC-A5-BQR' FROM stands s WHERE s.slug='facebook-review-stand'
ON CONFLICT (stand_id,size,option_code) DO UPDATE SET price_cents=EXCLUDED.price_cents, sku=EXCLUDED.sku;
INSERT INTO stand_variants (stand_id,size,option_code,price_cents,sku)
SELECT s.id,'a4','standard_direct',4900,'TR-FAC-A4-STD' FROM stands s WHERE s.slug='facebook-review-stand'
ON CONFLICT (stand_id,size,option_code) DO UPDATE SET price_cents=EXCLUDED.price_cents, sku=EXCLUDED.sku;
INSERT INTO stand_variants (stand_id,size,option_code,price_cents,sku)
SELECT s.id,'a4','branded_qr_direct',6500,'TR-FAC-A4-BQR' FROM stands s WHERE s.slug='facebook-review-stand'
ON CONFLICT (stand_id,size,option_code) DO UPDATE SET price_cents=EXCLUDED.price_cents, sku=EXCLUDED.sku;
INSERT INTO stands (slug,name,stand_type_id,badge,destination_label,destination_kind,printed_headline,headline_editable,status,sort_order)
SELECT 'tripadvisor-review-stand','TripAdvisor Review Stand',st.id,'TRIPADVISOR REVIEW','TripAdvisor review','direct','Review us on TripAdvisor',false,'active',4
FROM stand_types st WHERE st.slug='review-stands'
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, badge=EXCLUDED.badge,
  destination_label=EXCLUDED.destination_label, printed_headline=EXCLUDED.printed_headline,
  destination_kind=EXCLUDED.destination_kind, headline_editable=EXCLUDED.headline_editable,
  status=EXCLUDED.status, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='tripadvisor-review-stand' AND b.slug='hotel-travel'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='tripadvisor-review-stand' AND b.slug='restaurant-food'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='tripadvisor-review-stand' AND b.slug='retail-local-business'
ON CONFLICT DO NOTHING;
INSERT INTO stand_variants (stand_id,size,option_code,price_cents,sku)
SELECT s.id,'a5','standard_direct',3900,'TR-TRI-A5-STD' FROM stands s WHERE s.slug='tripadvisor-review-stand'
ON CONFLICT (stand_id,size,option_code) DO UPDATE SET price_cents=EXCLUDED.price_cents, sku=EXCLUDED.sku;
INSERT INTO stand_variants (stand_id,size,option_code,price_cents,sku)
SELECT s.id,'a5','branded_qr_direct',4900,'TR-TRI-A5-BQR' FROM stands s WHERE s.slug='tripadvisor-review-stand'
ON CONFLICT (stand_id,size,option_code) DO UPDATE SET price_cents=EXCLUDED.price_cents, sku=EXCLUDED.sku;
INSERT INTO stand_variants (stand_id,size,option_code,price_cents,sku)
SELECT s.id,'a4','standard_direct',4900,'TR-TRI-A4-STD' FROM stands s WHERE s.slug='tripadvisor-review-stand'
ON CONFLICT (stand_id,size,option_code) DO UPDATE SET price_cents=EXCLUDED.price_cents, sku=EXCLUDED.sku;
INSERT INTO stand_variants (stand_id,size,option_code,price_cents,sku)
SELECT s.id,'a4','branded_qr_direct',6500,'TR-TRI-A4-BQR' FROM stands s WHERE s.slug='tripadvisor-review-stand'
ON CONFLICT (stand_id,size,option_code) DO UPDATE SET price_cents=EXCLUDED.price_cents, sku=EXCLUDED.sku;
INSERT INTO stands (slug,name,stand_type_id,badge,destination_label,destination_kind,printed_headline,headline_editable,status,sort_order)
SELECT 'view-menu-stand','View Menu Stand',st.id,'MENU','menu','direct','View our menu',false,'active',5
FROM stand_types st WHERE st.slug='menu-info-stands'
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, badge=EXCLUDED.badge,
  destination_label=EXCLUDED.destination_label, printed_headline=EXCLUDED.printed_headline,
  destination_kind=EXCLUDED.destination_kind, headline_editable=EXCLUDED.headline_editable,
  status=EXCLUDED.status, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='view-menu-stand' AND b.slug='restaurant-food'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='view-menu-stand' AND b.slug='hotel-travel'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='view-menu-stand' AND b.slug='retail-local-business'
ON CONFLICT DO NOTHING;
INSERT INTO stand_variants (stand_id,size,option_code,price_cents,sku)
SELECT s.id,'a5','standard_direct',3900,'TR-VIE-A5-STD' FROM stands s WHERE s.slug='view-menu-stand'
ON CONFLICT (stand_id,size,option_code) DO UPDATE SET price_cents=EXCLUDED.price_cents, sku=EXCLUDED.sku;
INSERT INTO stand_variants (stand_id,size,option_code,price_cents,sku)
SELECT s.id,'a5','branded_qr_direct',4900,'TR-VIE-A5-BQR' FROM stands s WHERE s.slug='view-menu-stand'
ON CONFLICT (stand_id,size,option_code) DO UPDATE SET price_cents=EXCLUDED.price_cents, sku=EXCLUDED.sku;
INSERT INTO stand_variants (stand_id,size,option_code,price_cents,sku)
SELECT s.id,'a4','standard_direct',4900,'TR-VIE-A4-STD' FROM stands s WHERE s.slug='view-menu-stand'
ON CONFLICT (stand_id,size,option_code) DO UPDATE SET price_cents=EXCLUDED.price_cents, sku=EXCLUDED.sku;
INSERT INTO stand_variants (stand_id,size,option_code,price_cents,sku)
SELECT s.id,'a4','branded_qr_direct',6500,'TR-VIE-A4-BQR' FROM stands s WHERE s.slug='view-menu-stand'
ON CONFLICT (stand_id,size,option_code) DO UPDATE SET price_cents=EXCLUDED.price_cents, sku=EXCLUDED.sku;
INSERT INTO stands (slug,name,stand_type_id,badge,destination_label,destination_kind,printed_headline,headline_editable,status,sort_order)
SELECT 'book-appointment-stand','Book Appointment Stand',st.id,'BOOKING','booking','direct','Book an appointment',false,'active',6
FROM stand_types st WHERE st.slug='appointment-reservation-stands'
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, badge=EXCLUDED.badge,
  destination_label=EXCLUDED.destination_label, printed_headline=EXCLUDED.printed_headline,
  destination_kind=EXCLUDED.destination_kind, headline_editable=EXCLUDED.headline_editable,
  status=EXCLUDED.status, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='book-appointment-stand' AND b.slug='healthcare-dental'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='book-appointment-stand' AND b.slug='beauty-salon-wellness'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='book-appointment-stand' AND b.slug='home-services'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='book-appointment-stand' AND b.slug='legal'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='book-appointment-stand' AND b.slug='real-estate'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='book-appointment-stand' AND b.slug='automotive'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='book-appointment-stand' AND b.slug='retail-local-business'
ON CONFLICT DO NOTHING;
INSERT INTO stand_variants (stand_id,size,option_code,price_cents,sku)
SELECT s.id,'a5','standard_direct',3900,'TR-BOO-A5-STD' FROM stands s WHERE s.slug='book-appointment-stand'
ON CONFLICT (stand_id,size,option_code) DO UPDATE SET price_cents=EXCLUDED.price_cents, sku=EXCLUDED.sku;
INSERT INTO stand_variants (stand_id,size,option_code,price_cents,sku)
SELECT s.id,'a5','branded_qr_direct',4900,'TR-BOO-A5-BQR' FROM stands s WHERE s.slug='book-appointment-stand'
ON CONFLICT (stand_id,size,option_code) DO UPDATE SET price_cents=EXCLUDED.price_cents, sku=EXCLUDED.sku;
INSERT INTO stand_variants (stand_id,size,option_code,price_cents,sku)
SELECT s.id,'a4','standard_direct',4900,'TR-BOO-A4-STD' FROM stands s WHERE s.slug='book-appointment-stand'
ON CONFLICT (stand_id,size,option_code) DO UPDATE SET price_cents=EXCLUDED.price_cents, sku=EXCLUDED.sku;
INSERT INTO stand_variants (stand_id,size,option_code,price_cents,sku)
SELECT s.id,'a4','branded_qr_direct',6500,'TR-BOO-A4-BQR' FROM stands s WHERE s.slug='book-appointment-stand'
ON CONFLICT (stand_id,size,option_code) DO UPDATE SET price_cents=EXCLUDED.price_cents, sku=EXCLUDED.sku;
INSERT INTO stands (slug,name,stand_type_id,badge,destination_label,destination_kind,printed_headline,headline_editable,status,sort_order)
SELECT 'follow-us-stand','Follow Us Stand',st.id,'SOCIAL MEDIA','social media','direct','Follow us',false,'active',7
FROM stand_types st WHERE st.slug='social-media-stands'
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, badge=EXCLUDED.badge,
  destination_label=EXCLUDED.destination_label, printed_headline=EXCLUDED.printed_headline,
  destination_kind=EXCLUDED.destination_kind, headline_editable=EXCLUDED.headline_editable,
  status=EXCLUDED.status, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='follow-us-stand' AND b.slug='restaurant-food'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='follow-us-stand' AND b.slug='beauty-salon-wellness'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='follow-us-stand' AND b.slug='retail-local-business'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='follow-us-stand' AND b.slug='ecommerce-online-brand'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='follow-us-stand' AND b.slug='hotel-travel'
ON CONFLICT DO NOTHING;
INSERT INTO stand_variants (stand_id,size,option_code,price_cents,sku)
SELECT s.id,'a5','standard_direct',3900,'TR-FOL-A5-STD' FROM stands s WHERE s.slug='follow-us-stand'
ON CONFLICT (stand_id,size,option_code) DO UPDATE SET price_cents=EXCLUDED.price_cents, sku=EXCLUDED.sku;
INSERT INTO stand_variants (stand_id,size,option_code,price_cents,sku)
SELECT s.id,'a5','branded_qr_direct',4900,'TR-FOL-A5-BQR' FROM stands s WHERE s.slug='follow-us-stand'
ON CONFLICT (stand_id,size,option_code) DO UPDATE SET price_cents=EXCLUDED.price_cents, sku=EXCLUDED.sku;
INSERT INTO stand_variants (stand_id,size,option_code,price_cents,sku)
SELECT s.id,'a4','standard_direct',4900,'TR-FOL-A4-STD' FROM stands s WHERE s.slug='follow-us-stand'
ON CONFLICT (stand_id,size,option_code) DO UPDATE SET price_cents=EXCLUDED.price_cents, sku=EXCLUDED.sku;
INSERT INTO stand_variants (stand_id,size,option_code,price_cents,sku)
SELECT s.id,'a4','branded_qr_direct',6500,'TR-FOL-A4-BQR' FROM stands s WHERE s.slug='follow-us-stand'
ON CONFLICT (stand_id,size,option_code) DO UPDATE SET price_cents=EXCLUDED.price_cents, sku=EXCLUDED.sku;
INSERT INTO stands (slug,name,stand_type_id,badge,destination_label,destination_kind,printed_headline,headline_editable,status,sort_order)
SELECT 'visit-website-stand','Visit Website Stand',st.id,'WEBSITE','website','direct','Visit our website',false,'active',8
FROM stand_types st WHERE st.slug='website-link-stands'
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, badge=EXCLUDED.badge,
  destination_label=EXCLUDED.destination_label, printed_headline=EXCLUDED.printed_headline,
  destination_kind=EXCLUDED.destination_kind, headline_editable=EXCLUDED.headline_editable,
  status=EXCLUDED.status, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='visit-website-stand' AND b.slug='ecommerce-online-brand'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='visit-website-stand' AND b.slug='retail-local-business'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='visit-website-stand' AND b.slug='legal'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='visit-website-stand' AND b.slug='real-estate'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='visit-website-stand' AND b.slug='home-services'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='visit-website-stand' AND b.slug='automotive'
ON CONFLICT DO NOTHING;
INSERT INTO stand_variants (stand_id,size,option_code,price_cents,sku)
SELECT s.id,'a5','standard_direct',3900,'TR-VIS-A5-STD' FROM stands s WHERE s.slug='visit-website-stand'
ON CONFLICT (stand_id,size,option_code) DO UPDATE SET price_cents=EXCLUDED.price_cents, sku=EXCLUDED.sku;
INSERT INTO stand_variants (stand_id,size,option_code,price_cents,sku)
SELECT s.id,'a5','branded_qr_direct',4900,'TR-VIS-A5-BQR' FROM stands s WHERE s.slug='visit-website-stand'
ON CONFLICT (stand_id,size,option_code) DO UPDATE SET price_cents=EXCLUDED.price_cents, sku=EXCLUDED.sku;
INSERT INTO stand_variants (stand_id,size,option_code,price_cents,sku)
SELECT s.id,'a4','standard_direct',4900,'TR-VIS-A4-STD' FROM stands s WHERE s.slug='visit-website-stand'
ON CONFLICT (stand_id,size,option_code) DO UPDATE SET price_cents=EXCLUDED.price_cents, sku=EXCLUDED.sku;
INSERT INTO stand_variants (stand_id,size,option_code,price_cents,sku)
SELECT s.id,'a4','branded_qr_direct',6500,'TR-VIS-A4-BQR' FROM stands s WHERE s.slug='visit-website-stand'
ON CONFLICT (stand_id,size,option_code) DO UPDATE SET price_cents=EXCLUDED.price_cents, sku=EXCLUDED.sku;
INSERT INTO stands (slug,name,stand_type_id,badge,destination_label,destination_kind,printed_headline,headline_editable,status,sort_order)
SELECT 'rate-your-experience-stand','Rate Your Experience Stand',st.id,'FEEDBACK','feedback','multilink','Rate your experience',true,'draft',9
FROM stand_types st WHERE st.slug='feedback-survey-stands'
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, badge=EXCLUDED.badge,
  destination_label=EXCLUDED.destination_label, printed_headline=EXCLUDED.printed_headline,
  destination_kind=EXCLUDED.destination_kind, headline_editable=EXCLUDED.headline_editable,
  status=EXCLUDED.status, sort_order=EXCLUDED.sort_order, updated_at=now();
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='rate-your-experience-stand' AND b.slug='restaurant-food'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='rate-your-experience-stand' AND b.slug='hotel-travel'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='rate-your-experience-stand' AND b.slug='healthcare-dental'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='rate-your-experience-stand' AND b.slug='beauty-salon-wellness'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='rate-your-experience-stand' AND b.slug='retail-local-business'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='rate-your-experience-stand' AND b.slug='automotive'
ON CONFLICT DO NOTHING;
INSERT INTO stand_business_uses (stand_id,business_use_id)
SELECT s.id,b.id FROM stands s, business_uses b WHERE s.slug='rate-your-experience-stand' AND b.slug='home-services'
ON CONFLICT DO NOTHING;
INSERT INTO stand_variants (stand_id,size,option_code,price_cents,monthly_cents,sku,active)
SELECT s.id,'a5','hosted_multilink',4900,999,'TR-RYE-A5-MLK',false FROM stands s WHERE s.slug='rate-your-experience-stand'
ON CONFLICT (stand_id,size,option_code) DO UPDATE SET price_cents=EXCLUDED.price_cents, monthly_cents=EXCLUDED.monthly_cents;
INSERT INTO stand_variants (stand_id,size,option_code,price_cents,monthly_cents,sku,active)
SELECT s.id,'a4','hosted_multilink',6500,999,'TR-RYE-A4-MLK',false FROM stands s WHERE s.slug='rate-your-experience-stand'
ON CONFLICT (stand_id,size,option_code) DO UPDATE SET price_cents=EXCLUDED.price_cents, monthly_cents=EXCLUDED.monthly_cents;
