/**
 * landing-copy.ts — the words on the indexable landing pages.
 *
 * These pages exist to rank, so each one carries copy written for that
 * audience rather than the same paragraph with a noun swapped. Anything not
 * listed here falls back to neutral wording — never to review copy, because
 * a Follow Us stand must not read like a Google review stand.
 */

export interface LandingCopy {
  /** Small uppercase word above the H1 — the one-word subject of the page. */
  eyebrow: string;
  /** Page H1. */
  heading: string;
  /** Short action headline for the shop-by-use card. */
  cardHeading: string;
  /** Two short lines under the H1 in the hero card, and under the card headline. */
  tagline: string;
  /** The longer paragraph. Used for the meta description. */
  intro: string;
  /** Three short reasons, each a heading plus a line. */
  points: { title: string; body: string }[];
  /** Questions a buyer in this segment actually asks. */
  faqs: { q: string; a: string }[];
}

const GENERIC_FAQS = [
  {
    q: "Does the customer need an app?",
    a: "No. NFC is built into every iPhone from the XR onward and into essentially every Android phone sold in the last several years. They hold the phone near the stand and the page opens.",
  },
  {
    q: "What if a phone does not support tapping?",
    a: "Choose the Branded + QR finish. It prints a real, scannable QR code alongside your logo and business name, so anyone with a camera can still reach the same page.",
  },
  {
    q: "Can I change where the stand points later?",
    a: "Yes. Tell us the new link and we re-point it. You do not need to buy another stand.",
  },
  {
    q: "How much is it?",
    a: "The Small stand (5.8\u2033 \u00d7 8.3\u2033) is $39 and the Large (8.3\u2033 \u00d7 11.7\u2033) is $49 for the Standard finish. Adding your logo, business name and a printed QR is $10 more on the Small and $15 more on the Large. Buy 3 and save 15%, 5 and save 20%, 10 and save 25%.",
  },
];

/** Business-use pages: /for/[slug] */
export const USE_COPY: Record<string, LandingCopy> = {
  automotive: {
    eyebrow: "AUTOMOTIVE",
    heading: "NFC Stands for Auto Shops and Dealerships",
    cardHeading: "Reviews At The Key Handover",
    tagline:
      "Ask for the review while you are still handing back the keys.",
    intro:
      "A car repair is one of the few purchases people talk about. The moment to ask is at the counter while you are handing back the keys — not in an email three days later. Put a stand there and the ask happens by itself.",
    points: [
      {
        title: "Catch them at pickup",
        body: "The service advisor slides the stand across with the invoice. One tap, and the customer is on your review page before they leave the lot.",
      },
      {
        title: "One stand per bay or desk",
        body: "Service desk, waiting room, cashier window. Mix and match faces and sizes — the volume discount looks at the total, not at how many of the same design you bought.",
      },
      {
        title: "Point it anywhere",
        body: "Reviews today, your booking page next quarter, your tyre promotion after that. The stand does not care; we re-point the link.",
      },
    ],
    faqs: [
      {
        q: "Where do most auto shops put the stand?",
        a: "On the service advisor's desk and at the cashier window. Those are the two places a customer stands still with their phone in hand.",
      },
      ...GENERIC_FAQS,
    ],
  },

  "restaurant-food": {
    eyebrow: "RESTAURANTS",
    heading: "NFC Stands for Restaurants, Cafés and Bars",
    cardHeading: "Turn Checkout Into Reviews",
    tagline:
      "Ask happy customers to leave a review before they leave.",
    intro:
      "Menus, reviews, ordering, Wi-Fi, your Instagram — a table only has room for so much printed paper. One stand covers whichever of those matters most tonight, and you can change your mind later.",
    points: [
      {
        title: "Table, counter, or bill folder",
        body: "The Small stand fits a table without crowding it. The Large works on a host stand or a counter where people are already queuing.",
      },
      {
        title: "The menu that is never out of date",
        body: "Point the stand at your digital menu and change the menu, not the stand. No reprints when a price moves.",
      },
      {
        title: "Ask for the review while the meal is still good",
        body: "A review asked for at the table lands far better than one asked for by email the next morning.",
      },
    ],
    faqs: [
      {
        q: "Menu stand or review stand?",
        a: "Most restaurants run both: a menu stand on the table and a review stand at the till where the bill is paid.",
      },
      {
        q: "Will it survive a busy service?",
        a: "The stand is a rigid printed panel on a weighted base. Wipe it down like anything else on the table.",
      },
      ...GENERIC_FAQS,
    ],
  },

  "hotel-travel": {
    eyebrow: "HOTELS",
    heading: "NFC Stands for Hotels, B&Bs and Travel",
    cardHeading: "From Check-In To Five Stars",
    tagline:
      "Answer questions at check-in, collect the review at check-out.",
    intro:
      "Guests arrive with questions and leave with opinions. A stand at reception and one in each room answers the questions on the way in and collects the opinion on the way out.",
    points: [
      {
        title: "Reception and in-room",
        body: "The Large at the front desk where guests check in, the Small on the desk or nightstand in the room.",
      },
      {
        title: "TripAdvisor, Google, or your own form",
        body: "Different properties care about different platforms. Pick the face that matches where your bookings actually come from.",
      },
      {
        title: "House information without the binder",
        body: "Wi-Fi, breakfast times, checkout, local recommendations — point one stand at a page you can edit yourself.",
      },
    ],
    faqs: [
      {
        q: "How many stands does a small hotel need?",
        a: "Reception, plus one per room is the usual pattern. At 10 or more the 25% volume discount applies.",
      },
      ...GENERIC_FAQS,
    ],
  },

  "healthcare-dental": {
    eyebrow: "PRACTICES",
    heading: "NFC Stands for Dental and Medical Practices",
    cardHeading: "Reviews At The Front Desk",
    tagline:
      "Turn a good appointment into a review at the front desk.",
    intro:
      "Patients choose a practice on reputation, and reputation is public now. A stand at the front desk turns a good appointment into a review without anyone having to ask out loud.",
    points: [
      {
        title: "At the desk, at checkout",
        body: "The patient is already standing there settling the bill or booking the next visit. That is the moment.",
      },
      {
        title: "Booking as well as reviews",
        body: "Point a second stand at your booking system so a patient can rebook from their own phone instead of holding up the queue.",
      },
      {
        title: "Discreet by design",
        body: "No shouting, no flyer. A small printed panel that says what it does and nothing else.",
      },
    ],
    faqs: [
      {
        q: "Can we use our own branding?",
        a: "Yes. The Branded + QR finish prints your logo and business name on the panel with a real scannable QR code.",
      },
      ...GENERIC_FAQS,
    ],
  },

  "home-services": {
    eyebrow: "TRADES",
    heading: "NFC Stands for Home Services and Trades",
    cardHeading: "A Counter In Your Van",
    tagline:
      "A counter you can carry, for trades without one.",
    intro:
      "You do not have a counter, so the counter travels with you. Keep a stand in the van and hold it out when the job is signed off and the customer is happy.",
    points: [
      {
        title: "A counter you can carry",
        body: "The Small stand fits in a document folder or on the dash. Hand it over at sign-off, take it back, drive to the next job.",
      },
      {
        title: "Reviews are your advertising",
        body: "For a plumber or an electrician, the review count is the quote. Every completed job is a chance to add one.",
      },
      {
        title: "Or point it at your quote form",
        body: "Some trades would rather collect the next enquiry than the last review. Same stand, different link.",
      },
    ],
    faqs: [
      {
        q: "Is one stand enough?",
        a: "One per van is the usual answer. If you run a crew, three stands crosses the first volume tier at 15% off.",
      },
      ...GENERIC_FAQS,
    ],
  },

  legal: {
    eyebrow: "LAW FIRMS",
    heading: "NFC Stands for Law Firms",
    cardHeading: "Reviews Without Asking Twice",
    tagline:
      "Ask at the moment a client is most grateful.",
    intro:
      "Legal clients research hard before they call, and they read reviews before they read your website. A stand in the meeting room makes the ask at the point where a client is most grateful.",
    points: [
      {
        title: "Reception and meeting rooms",
        body: "The Large at reception, the Small on the meeting room table. Both places where a client is sitting with time to spare.",
      },
      {
        title: "Consistent with how you present",
        body: "Branded + QR puts your firm's mark on the panel. Nothing on it looks like a gadget.",
      },
      {
        title: "Or route to intake",
        body: "Point the stand at your intake form and let a walk-in start their own file while they wait.",
      },
    ],
    faqs: [
      {
        q: "Can the stand collect enquiries rather than reviews?",
        a: "Yes. Any URL works — an intake form, a booking page, a document upload link.",
      },
      ...GENERIC_FAQS,
    ],
  },

  "real-estate": {
    eyebrow: "REAL ESTATE",
    heading: "NFC Stands for Real Estate Agents",
    cardHeading: "Every Open House, One Tap",
    tagline:
      "An open house is a room full of phones already.",
    intro:
      "An open house is a room full of people holding their phones already. Give them something to tap and you leave with the listing details in their pocket and, later, the review on your profile.",
    points: [
      {
        title: "Made for the open house",
        body: "The Large stand on the kitchen island with the listing page behind it. Visitors take the details without you chasing them.",
      },
      {
        title: "Follow-up without a clipboard",
        body: "Point the stand at your enquiry form and let visitors register themselves.",
      },
      {
        title: "Reviews after closing",
        body: "Swap the same stand to your review link for the handover meeting.",
      },
    ],
    faqs: [
      {
        q: "Do I need one stand per listing?",
        a: "No. One stand can be re-pointed between listings — tell us the new link. Agents running several open houses at once usually buy three and take the 15% discount.",
      },
      ...GENERIC_FAQS,
    ],
  },

  "beauty-salon-wellness": {
    eyebrow: "SALONS",
    heading: "NFC Stands for Salons, Spas and Wellness Studios",
    cardHeading: "Ask While They Love The Mirror",
    tagline:
      "They just liked what they saw in the mirror. Ask now.",
    intro:
      "A client who just looked in the mirror and liked what they saw is the best reviewer you will ever get. The stand is at the payment counter, and it takes them four seconds.",
    points: [
      {
        title: "At the mirror or the till",
        body: "The Small stand at each station, the Large at the payment counter. Both moments work; the till converts best.",
      },
      {
        title: "Rebooking in one tap",
        body: "Point a stand at Vagaro, Fresha, Booksy, Square — whatever you already use — and let clients rebook themselves.",
      },
      {
        title: "Grow the follower count too",
        body: "A Follow Us stand at the mirror turns a good result into an Instagram follow.",
      },
    ],
    faqs: [
      {
        q: "Which stand should a salon start with?",
        a: "A review stand at the till. Add a Follow Us stand at the stations once the first one is earning its keep.",
      },
      ...GENERIC_FAQS,
    ],
  },

  "ecommerce-online-brand": {
    eyebrow: "ONLINE BRANDS",
    heading: "NFC Stands for Online Brands and Pop-Ups",
    cardHeading: "From The Stall To Your Store",
    tagline:
      "Carry the visitor from your stall back to your store.",
    intro:
      "When an online brand shows up in a physical room — a market stall, a pop-up, a trade stand — the hard part is carrying the visitor back online. One tap does it.",
    points: [
      {
        title: "Built for the stall",
        body: "The Large stands up on a trestle table and reads from across an aisle. The Small sits next to the card reader.",
      },
      {
        title: "Send them to the exact page",
        body: "Not your homepage — the collection, the discount, the sign-up. Whatever you want measured.",
      },
      {
        title: "Reusable between events",
        body: "New campaign, new link, same stand.",
      },
    ],
    faqs: [
      {
        q: "Can I track how many people tapped?",
        a: "Point the stand at a link you already track — your own short link or a UTM-tagged URL — and it shows up in the analytics you already read.",
      },
      ...GENERIC_FAQS,
    ],
  },

  "retail-local-business": {
    eyebrow: "RETAIL",
    heading: "NFC Stands for Retail and Local Business",
    cardHeading: "Four Seconds At The Counter",
    tagline:
      "Four seconds at the counter, every single customer.",
    intro:
      "Every local business has a counter, and every counter has four seconds of a customer's attention while the card machine thinks. That is what the stand is for.",
    points: [
      {
        title: "The counter is the whole strategy",
        body: "One stand beside the card reader, pointed at whatever you most want more of this quarter.",
      },
      {
        title: "Any destination",
        body: "Reviews, your website, your loyalty sign-up, your social profile. Pick the face that matches.",
      },
      {
        title: "Cheap enough to try",
        body: "$39 for the Small stand, once, with no monthly fee. If it does nothing you have lost the price of a lunch.",
      },
    ],
    faqs: GENERIC_FAQS,
  },
};

/** Stand-type pages: /stands/type/[slug] */
export const TYPE_COPY: Record<string, LandingCopy> = {
  "review-stands": {
    eyebrow: "REVIEWS",
    heading: "NFC Review Stands",
    cardHeading: "Ask Every Customer, Every Time",
    tagline:
      "Ask every customer for an honest review, without the awkwardness.",
    intro:
      "Reviews do not arrive on their own. They arrive when you ask at the right moment, and the right moment is while the customer is still standing in front of you. A review stand makes the ask for you, every time, without anyone feeling awkward about it.",
    points: [
      {
        title: "Pick your platform",
        body: "Google, Yelp, Facebook, TripAdvisor. The stand says which one, so the customer is not guessing.",
      },
      {
        title: "The tap lands on the review form",
        body: "Not your profile, not your homepage. Give us your review link and that is where it goes.",
      },
      {
        title: "No monthly fee",
        body: "You buy the stand once. There is no subscription on a direct stand and nothing to cancel.",
      },
    ],
    faqs: [
      {
        q: "Which review platform should I choose?",
        a: "Whichever one your customers already read before choosing you. For most local businesses that is Google; for restaurants and hotels, Yelp and TripAdvisor still carry weight.",
      },
      {
        q: "Is asking for reviews this way allowed?",
        a: "Asking every customer for an honest review is fine on every major platform. Offering a reward for a positive review is not, and we do not build anything that does that.",
      },
      ...GENERIC_FAQS,
    ],
  },
  "social-media-stands": {
    eyebrow: "SOCIAL",
    heading: "NFC Social Media Stands",
    cardHeading: "Turn Visitors Into Followers",
    tagline:
      "Turn the people in your room into the audience you keep.",
    intro:
      "A follow is worth more than a like — it is permission to show up again next week. A social stand turns the people already in your room into the audience you keep.",
    points: [
      {
        title: "One tap to your profile",
        body: "Instagram, TikTok, Facebook. They land on the profile page with the follow button right there.",
      },
      {
        title: "Put it where people wait",
        body: "The chair, the counter, the table. Waiting is when people open their phone anyway.",
      },
      {
        title: "Change platform whenever",
        body: "If your audience moves, the stand moves with it.",
      },
    ],
    faqs: GENERIC_FAQS,
  },
  "appointment-reservation-stands": {
    eyebrow: "BOOKINGS",
    heading: "NFC Booking and Reservation Stands",
    cardHeading: "Let Them Book Themselves",
    tagline:
      "Let customers book the next visit on their own phone.",
    intro:
      "The cheapest booking you will ever take is the one the customer makes themselves, standing in your shop, on their own phone.",
    points: [
      {
        title: "Works with your booking system",
        body: "Vagaro, Booksy, Fresha, Zocdoc, Calendly, Square, or your own page. If it has a URL, it works.",
      },
      {
        title: "Rebooking without the queue",
        body: "The customer books the next visit while you serve the next person.",
      },
      {
        title: "Also good on the door",
        body: "A Large stand in the window takes a booking from someone who arrived after closing.",
      },
    ],
    faqs: GENERIC_FAQS,
  },
  "menu-info-stands": {
    eyebrow: "MENUS",
    heading: "NFC Menu and Information Stands",
    cardHeading: "A Menu That Is Never Old",
    tagline:
      "Change the menu, not the stand.",
    intro:
      "A printed menu is out of date the day a price changes. A menu stand points at a page you control, so the change costs nothing.",
    points: [
      {
        title: "Update the menu, not the stand",
        body: "Change the page your stand points at and every table is current.",
      },
      {
        title: "Any menu format",
        body: "Your website, a PDF, an ordering platform, a Google Doc. Whatever you already keep updated.",
      },
      {
        title: "Doubles as house information",
        body: "Wi-Fi, allergens, opening hours — anything you get asked twice a day.",
      },
    ],
    faqs: GENERIC_FAQS,
  },
  "website-link-stands": {
    eyebrow: "WEBSITE",
    heading: "NFC Website Stands",
    cardHeading: "Straight To The Right Page",
    tagline:
      "Send people straight to the page that matters.",
    intro:
      "Sometimes the destination is simply your site. A website stand is the plainest version of the product and the most flexible one.",
    points: [
      {
        title: "Straight to the page you choose",
        body: "Homepage, a landing page, a promotion, a sign-up form.",
      },
      {
        title: "No typing, no misspelling",
        body: "Nobody mistypes a tap.",
      },
      {
        title: "Re-point it any time",
        body: "One stand, a different campaign every month.",
      },
    ],
    faqs: GENERIC_FAQS,
  },
  "feedback-survey-stands": {
    eyebrow: "FEEDBACK",
    heading: "NFC Feedback and Survey Stands",
    cardHeading: "Hear It Before The Internet Does",
    tagline:
      "Hear the problem before the internet does.",
    intro:
      "Some feedback belongs to you before it belongs to the internet. A feedback stand sends the customer to your own form.",
    points: [
      {
        title: "Your form, your questions",
        body: "Point the stand at whatever form you already use.",
      },
      {
        title: "Catch problems early",
        body: "A complaint you hear first is a complaint you can still fix.",
      },
      {
        title: "Printed prompt included",
        body: "The panel carries a short line inviting people to rate their experience. You can change the wording.",
      },
    ],
    faqs: GENERIC_FAQS,
  },
  "payment-tip-donation-stands": {
    eyebrow: "PAYMENTS",
    heading: "NFC Payment, Tip and Donation Stands",
    cardHeading: "The Tip Jar, Cashless",
    tagline:
      "Put the tip jar back on a cashless counter.",
    intro:
      "Cash has stopped being the default, and the tip jar went with it. A stand pointed at your payment or donation link puts it back on the counter.",
    points: [
      {
        title: "Any payment link",
        body: "Your existing payment or donation page — we point the stand at it.",
      },
      {
        title: "Visible where it matters",
        body: "Counter, table, or collection point.",
      },
      {
        title: "No hardware to charge",
        body: "The stand has no battery and nothing to break.",
      },
    ],
    faqs: GENERIC_FAQS,
  },
  "loyalty-rewards-stands": {
    eyebrow: "LOYALTY",
    heading: "NFC Loyalty and Rewards Stands",
    cardHeading: "Sign-Ups At The Till",
    tagline:
      "Signing up should take less effort than a plastic card.",
    intro:
      "A loyalty scheme only works if signing up takes less effort than remembering a card. Tapping a stand takes four seconds.",
    points: [
      {
        title: "Sign-ups at the counter",
        body: "The customer joins while they pay.",
      },
      {
        title: "Works with your programme",
        body: "Point it at whatever loyalty platform you already run.",
      },
      {
        title: "One stand per till",
        body: "Three or more crosses the first volume tier.",
      },
    ],
    faqs: GENERIC_FAQS,
  },
};

const NEUTRAL: LandingCopy = {
  eyebrow: "NFC STANDS",
  heading: "NFC Stands",
  cardHeading: "One Tap, One Destination",
  tagline: "One tap sends your customer exactly where you want them.",
  intro:
    "One tap sends your customer exactly where you want them. Choose the stand, give us the link, and it arrives ready to use.",
  points: [
    {
      title: "No app to install",
      body: "Modern iPhones and Android phones read the stand as they are.",
    },
    {
      title: "Printed QR as a backup",
      body: "The Branded + QR finish adds a real scannable code with your logo and business name.",
    },
    {
      title: "Re-point it any time",
      body: "Send us a new link and the same stand goes somewhere else.",
    },
  ],
  faqs: GENERIC_FAQS,
};

export function useCopy(slug: string, name: string): LandingCopy {
  const found = USE_COPY[slug];
  if (found) return found;
  return { ...NEUTRAL, heading: `NFC Stands for ${name}` };
}

export function typeCopy(slug: string, name: string): LandingCopy {
  const found = TYPE_COPY[slug];
  if (found) return found;
  return { ...NEUTRAL, heading: name };
}
