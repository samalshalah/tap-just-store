/**
 * destination.ts — validating the one thing a stand cannot get wrong.
 *
 * Everything else about a stand is recoverable. The destination is not: it is
 * burned into the NFC chip and printed as a QR code onto acrylic. A typo here
 * is a box of scrap and a refund, so this file is deliberately strict, and the
 * cart shows the result back to the customer one more time before checkout.
 *
 * Pure, so it can be unit tested and so the same rules run in the browser (for
 * instant feedback) and on the server (which is the one that counts — a client
 * check is a convenience, never a control).
 */

/** Hosts that would produce a stand nobody else can use. */
const UNREACHABLE_HOSTS = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "example.com",
  "example.org",
];

/** A private address is reachable for the person testing and for nobody else. */
function isPrivateHost(host: string): boolean {
  if (UNREACHABLE_HOSTS.includes(host)) return true;
  if (host.endsWith(".local") || host.endsWith(".internal")) return true;
  // 10.x, 192.168.x, 172.16-31.x, 169.254.x
  return /^(10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);
}

export interface DestinationResult {
  ok: boolean;
  /** The URL to burn into the chip and encode as a QR. Absent when !ok. */
  url?: string;
  /** Why it was rejected. Written for a shop owner, not a developer. */
  error?: string;
  /**
   * Not an error — the link works, but it does not look like the platform this
   * stand is for. Shown as a "check this" note, never as a block: a business
   * may legitimately use a shortener or a redirect, and refusing that would be
   * refusing a sale over a guess.
   */
  warning?: string;
}

/**
 * Hosts we expect per destination label, lowercased and matched as suffixes.
 * Only used to produce a warning.
 */
const EXPECTED_HOSTS: Record<string, string[]> = {
  "google review": ["google.com", "g.page", "goo.gl", "maps.app.goo.gl"],
  "yelp review": ["yelp.com", "yelp.to"],
  "facebook review": ["facebook.com", "fb.com", "fb.me"],
  "tripadvisor review": ["tripadvisor.com", "tripadvisor.co.uk", "ta.pw"],
  "trustpilot review": ["trustpilot.com"],
  "better business bureau review": ["bbb.org"],
  "nextdoor review": ["nextdoor.com"],
  "yellow pages review": ["yellowpages.com", "yp.com"],
  "apple maps review": ["apple.com", "maps.apple.com"],
  "bing places review": ["bing.com"],
  "opentable review": ["opentable.com"],
  "toast review": ["toasttab.com", "toast.com"],
};

/**
 * Normalise and check a destination.
 *
 * `expectedFor` is the stand's destination label ("Google review", "menu"),
 * used only to decide whether to warn.
 */
export function validateDestination(
  raw: string,
  expectedFor?: string
): DestinationResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "Add the link this stand should open." };
  }

  // A shop owner pastes "g.page/r/abc" or types their domain without a scheme.
  // Assuming https is right far more often than it is wrong, and the parse
  // below still rejects anything that is not actually a link.
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    return { ok: false, error: "That does not look like a web address." };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return {
      ok: false,
      error: "The link has to be a web address starting with https://",
    };
  }

  const host = parsed.hostname.toLowerCase();

  if (!host.includes(".")) {
    return { ok: false, error: "That address is missing a domain, like .com." };
  }

  if (isPrivateHost(host)) {
    return {
      ok: false,
      error:
        "That address only works on your own network, so the stand would not work for your customers.",
    };
  }

  // http downgrades silently to https. Every platform we point at serves https,
  // and printing an http link onto acrylic would age badly.
  if (parsed.protocol === "http:") parsed.protocol = "https:";

  // Tracking junk pasted from an address bar makes the QR denser for no gain.
  for (const key of [...parsed.searchParams.keys()]) {
    if (/^(utm_|fbclid$|gclid$|mc_[ce]id$)/i.test(key)) {
      parsed.searchParams.delete(key);
    }
  }

  const url = parsed.toString();

  const expected = expectedFor ? EXPECTED_HOSTS[expectedFor.toLowerCase()] : undefined;
  if (expected && !expected.some((h) => host === h || host.endsWith(`.${h}`))) {
    return {
      ok: true,
      url,
      warning: `This is not a ${expectedFor} link. Double-check it before you order — we print exactly what you give us.`,
    };
  }

  return { ok: true, url };
}

/**
 * NTAG213 holds 144 bytes of user memory, and the NDEF record wrapping the URL
 * costs a few of them. This is the practical ceiling for a URL we can write to
 * the chip; a longer one has to go through a hosted redirect instead.
 */
export const MAX_DIRECT_URL_BYTES = 132;

export function urlFitsOnChip(url: string): boolean {
  return new TextEncoder().encode(url).length <= MAX_DIRECT_URL_BYTES;
}
