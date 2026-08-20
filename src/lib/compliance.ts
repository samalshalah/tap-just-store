import { DEFAULTS } from "./defaults";
import type { SiteSettings } from "./types";

export function compliancePlace(settings: SiteSettings): string {
  const city = settings.location?.city || settings.seo?.city || DEFAULTS.city;
  const state = settings.location?.state || DEFAULTS.state;
  if (city === DEFAULTS.city && state === DEFAULTS.state) return "local";
  return state ? `${city}, ${state}` : city;
}

export function complianceModelName(settings: SiteSettings): string {
  return `${compliancePlace(settings)} consumer protection and sales regulations`;
}

export function complianceFooterText(settings: SiteSettings): string {
  return `Compliant with ${complianceModelName(settings)}`;
}

export function checkoutTermsText(settings: SiteSettings): string {
  const storeName = settings.store?.name || DEFAULTS.storeName;
  return `I agree to the ${storeName} terms of sale, fulfillment timelines, and return policy.`;
}
