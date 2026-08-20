/**
 * stand-copy.ts — product copy derived from the stand's own destination.
 *
 * The rule that matters: an unknown stand falls back to "direct link",
 * never to Google. A Follow Us stand must never read like a review stand.
 */

import type { Stand } from "./schema";

export interface StandCopy {
  badge: string;
  destination: string;
  /** e.g. "your Google review page" */
  destinationPhrase: string;
  /** Placeholder for the destination URL field. */
  urlPlaceholder: string;
  /** Label above the URL field. */
  urlLabel: string;
  /** One-line explanation under the URL field. */
  urlHelp: string;
}

const FALLBACK: StandCopy = {
  badge: "DIRECT LINK",
  destination: "destination link",
  destinationPhrase: "your destination link",
  urlLabel: "Destination link",
  urlPlaceholder: "https://",
  urlHelp: "Paste the link this stand should open when someone taps it.",
};

const BY_SLUG: Record<string, Partial<StandCopy>> = {
  "google-review-stand": {
    badge: "GOOGLE REVIEW",
    destination: "Google review",
    destinationPhrase: "your Google review page",
    urlLabel: "Your Google review link",
    urlPlaceholder: "https://g.page/r/...",
    urlHelp: "Paste the review link from your Google Business Profile.",
  },
  "yelp-review-stand": {
    badge: "YELP REVIEW",
    destination: "Yelp review",
    destinationPhrase: "your Yelp review page",
    urlLabel: "Your Yelp review link",
    urlPlaceholder: "https://www.yelp.com/writeareview/...",
    urlHelp: "Paste the write-a-review link from your Yelp business page.",
  },
  "facebook-review-stand": {
    badge: "FACEBOOK REVIEW",
    destination: "Facebook review",
    destinationPhrase: "your Facebook page",
    urlLabel: "Your Facebook review link",
    urlPlaceholder: "https://www.facebook.com/.../reviews",
    urlHelp: "Paste the reviews link from your Facebook business page.",
  },
  "tripadvisor-review-stand": {
    badge: "TRIPADVISOR REVIEW",
    destination: "TripAdvisor review",
    destinationPhrase: "your TripAdvisor listing",
    urlLabel: "Your TripAdvisor review link",
    urlPlaceholder: "https://www.tripadvisor.com/...",
    urlHelp: "Paste the review link from your TripAdvisor listing.",
  },
  "view-menu-stand": {
    badge: "MENU",
    destination: "menu",
    destinationPhrase: "your menu",
    urlLabel: "Your menu link",
    urlPlaceholder: "https://",
    urlHelp: "Any menu URL works — your website, a PDF, Toast, or an ordering page.",
  },
  "book-appointment-stand": {
    badge: "BOOKING",
    destination: "booking",
    destinationPhrase: "your booking page",
    urlLabel: "Your booking link",
    urlPlaceholder: "https://",
    urlHelp: "Works with Vagaro, Booksy, Fresha, Zocdoc, Calendly, or any booking URL.",
  },
  "follow-us-stand": {
    badge: "SOCIAL MEDIA",
    destination: "social media",
    destinationPhrase: "your social profile",
    urlLabel: "Your social profile link",
    urlPlaceholder: "https://instagram.com/",
    urlHelp: "Instagram, TikTok, Facebook — whichever profile you want followed.",
  },
  "rate-your-experience-stand": {
    badge: "FEEDBACK",
    destination: "feedback",
    destinationPhrase: "your feedback page",
    urlLabel: "Your feedback form link",
    urlPlaceholder: "https://",
    urlHelp: "Link to your feedback or experience form.",
  },
  "visit-website-stand": {
    badge: "WEBSITE",
    destination: "website",
    destinationPhrase: "your website",
    urlLabel: "Your website link",
    urlPlaceholder: "https://",
    urlHelp: "Paste the page you want people to land on.",
  },
};

export function standCopy(stand: Pick<Stand, "slug" | "badge" | "destinationLabel">): StandCopy {
  const preset = BY_SLUG[stand.slug] ?? {};
  // Values stored on the stand row win, so an admin can override without a deploy.
  return {
    ...FALLBACK,
    ...preset,
    badge: stand.badge || preset.badge || FALLBACK.badge,
    destination: stand.destinationLabel || preset.destination || FALLBACK.destination,
  };
}

/** SEO title: "Google Review Stand | NFC Review Stand from $39" */
export function standSeoTitle(
  stand: Pick<Stand, "name" | "seoTitle" | "slug" | "badge" | "destinationLabel">,
  standTypeName: string | null,
  fromCents: number
): string {
  if (stand.seoTitle) return stand.seoTitle;
  const type = standTypeName ? standTypeName.replace(/ Stands$/, "") : "NFC";
  const from = `$${Math.round(fromCents / 100)}`;
  return `${stand.name} | NFC ${type} Stand from ${from}`;
}

export function standSeoDescription(
  stand: Pick<Stand, "name" | "seoDescription" | "slug" | "badge" | "destinationLabel">,
  fromCents: number
): string {
  if (stand.seoDescription) return stand.seoDescription;
  const copy = standCopy(stand);
  const from = `$${Math.round(fromCents / 100)}`;
  return `One tap opens ${copy.destinationPhrase}. Choose Standard Direct or add your logo, business name and a printed QR with Branded + QR. Starts at ${from}.`;
}
