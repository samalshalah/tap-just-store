-- Phase 05 — per-stand SEO titles and meta descriptions.
--
-- All 16 active stands had neither, so every page fell back to a generated
-- template and Google wrote its own snippet. These are hand-written per
-- platform: a Toast stand and a Nextdoor stand are bought by different people
-- for different reasons, and one sentence with the word swapped does not say
-- anything to either of them.
--
-- Titles exclude the brand because the layout template appends "| Tap Rater".

-- 16 stands
UPDATE stands SET seo_title='NFC Google Review Stand — One Tap, More Reviews', seo_description='Sit it on your counter and customers tap their phone to open your Google review page. No app to install, nothing to explain. From $39, no monthly fee.' WHERE slug='google-review-stand';
UPDATE stands SET seo_title='NFC Yelp Review Stand for Bars & Restaurants', seo_description='Catch the review while they are still at the table. One tap opens your Yelp page — no app, no searching. Solid acrylic, from $39, one payment.' WHERE slug='yelp-review-stand';
UPDATE stands SET seo_title='NFC Facebook Review Stand for Local Business', seo_description='Turn happy customers into Facebook recommendations before they leave. A tap opens your page and they write it there and then. From $39.' WHERE slug='facebook-review-stand';
UPDATE stands SET seo_title='NFC TripAdvisor Stand for Hotels & Restaurants', seo_description='Ask for the TripAdvisor review at reception or on the table, while the stay is still fresh. One tap, no app, no QR hunting. From $39.' WHERE slug='tripadvisor-review-stand';
UPDATE stands SET seo_title='NFC Trustpilot Review Stand for Your Counter', seo_description='Collect Trustpilot reviews in person, not by chasing emails nobody opens. Customers tap and land straight on your review page. From $39.' WHERE slug='trustpilot-review-stand';
UPDATE stands SET seo_title='NFC Better Business Bureau Review Stand', seo_description='For trades and contractors who live on reputation. Hand it over at sign-off and the customer taps to leave a BBB review on the spot. From $39.' WHERE slug='bbb-review-stand';
UPDATE stands SET seo_title='NFC Nextdoor Recommendation Stand', seo_description='Nextdoor recommendations travel street by street. One tap opens your page so a happy neighbour can vouch for you while they are thinking of it. From $39.' WHERE slug='nextdoor-review-stand';
UPDATE stands SET seo_title='NFC Yellow Pages Review Stand', seo_description='Still where a lot of local searches land. Customers tap the stand and your Yellow Pages listing opens ready for a review. From $39, no monthly fee.' WHERE slug='yellow-pages-review-stand';
UPDATE stands SET seo_title='NFC Apple Maps Review Stand for iPhone Users', seo_description='Most of your customers are holding an iPhone. One tap opens your Apple Maps listing — where they were going to look for you anyway. From $39.' WHERE slug='apple-maps-review-stand';
UPDATE stands SET seo_title='NFC Bing Places Review Stand', seo_description='The listing most businesses forget, and the reason some of them are invisible on Windows and Copilot. A tap opens it for a review. From $39.' WHERE slug='bing-places-review-stand';
UPDATE stands SET seo_title='NFC OpenTable Review Stand for Restaurants', seo_description='Diners who book through OpenTable are the ones whose reviews rank you there. Catch them at the table with one tap. From $39, one payment.' WHERE slug='opentable-review-stand';
UPDATE stands SET seo_title='NFC Toast Review Stand for Restaurants', seo_description='If you take payment on Toast, the review belongs there too. Sit it by the terminal and let them tap while they settle up. From $39.' WHERE slug='toast-review-stand';
UPDATE stands SET seo_title='NFC Menu Stand — Tap to Open Your Menu', seo_description='No sticky laminated cards, no printing a new menu every time a price moves. Customers tap and your current menu opens on their phone. From $39.' WHERE slug='view-menu-stand';
UPDATE stands SET seo_title='NFC Booking Stand for Salons & Clinics', seo_description='Rebook them before they walk out. One tap opens your booking page while they are still at the desk with their diary in hand. From $39.' WHERE slug='book-appointment-stand';
UPDATE stands SET seo_title='NFC Social Media Stand — Tap to Follow', seo_description='Followers you can actually count. A tap opens your Instagram, TikTok or Facebook and they follow before they have left the counter. From $39.' WHERE slug='follow-us-stand';
UPDATE stands SET seo_title='NFC Website Stand — Tap to Open Your Site', seo_description='Send people to any page you like: your shop, a form, a price list, a portfolio. One tap, no typing, no app. Solid acrylic, from $39.' WHERE slug='visit-website-stand';
