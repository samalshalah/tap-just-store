import type { ReactNode } from "react";
import { MapPin, Phone } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";
import {
  getActiveStands,
  getStandTypes,
  getBusinessUses,
  getBusinessUseCounts,
} from "@/lib/stands-data";
import { SettingsProvider } from "@/components/SettingsProvider";
import { CartProvider } from "@/components/CartContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StoreJsonLd } from "@/components/StoreJsonLd";
import { ToasterProvider } from "@/components/ToasterProvider";
import { MobileStickyActions } from "@/components/MobileStickyActions";
import { DEFAULTS } from "@/lib/defaults";
import type { ShopNavData } from "@/components/Navbar";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Storefront layout — wraps every public page (home, shop, product, about,
 * etc.). Loads site settings server-side and pipes them down to all
 * client components via SettingsProvider, so no client component ever
 * needs to fetch them again.
 *
 * Maintenance mode is enforced here: if the admin has flipped the switch,
 * we render only the launch page and never load the storefront.
 */
export default async function StorefrontLayout({
  children,
}: {
  children: ReactNode;
}) {
  const settings = await getSiteSettings();
  const storeName = settings.store?.name || DEFAULTS.storeName;
  const storefrontPhone =
    settings.location?.phone ||
    settings.contact?.phone ||
    settings.store?.phone;
  const storefrontAddress = settings.location?.address || settings.store?.address;
  const showStickyActions = Boolean(storefrontPhone || storefrontAddress);

  if (settings.maintenance_mode) {
    return (
      <ComingSoonLanding
        storeName={storeName}
        message={settings.maintenance_message}
        logoPath={settings.store?.logo_light || settings.store?.logo_dark}
        address={settings.store?.address || settings.location?.address}
        phone={settings.store?.phone || settings.location?.phone}
      />
    );
  }

  const [stands, standTypes, businessUses, useCounts] = await Promise.all([
    getActiveStands(),
    getStandTypes(),
    getBusinessUses(),
    getBusinessUseCounts(),
  ]);

  // The nav is built from tagged relationships, so a stand is never listed twice.
  const shopNav: ShopNavData = {
    standTypes: standTypes
      .map((type) => ({
        name: type.name,
        href: `/stands/type/${type.slug}`,
        count: stands.filter((s) => s.standType?.slug === type.slug).length,
      }))
      .filter((item) => item.count > 0),
    businessUses: businessUses
      .map((use) => ({
        name: use.name,
        href: `/for/${use.slug}`,
        count: useCounts[use.slug] ?? 0,
      }))
      .filter((item) => item.count > 0),
    popular: stands.slice(0, 6).map((s) => ({
      name: s.stand.name,
      href: `/stands/${s.stand.slug}`,
    })),
  };

  return (
    <SettingsProvider settings={settings}>
      <CartProvider>
        <StoreJsonLd />
        <div
          className={`min-h-screen flex flex-col bg-background selection:bg-accent selection:text-accent-foreground ${
            showStickyActions ? "pb-24 md:pb-0" : ""
          }`}
        >
          <Navbar shopNav={shopNav} />
          <main className="flex-grow pt-[88px] md:pt-[104px]">{children}</main>
          <Footer />
          {showStickyActions && (
            <MobileStickyActions
              storeName={storeName}
              phone={storefrontPhone}
              address={storefrontAddress}
              city={settings.location?.city}
              state={settings.location?.state}
              zip={settings.location?.zip}
              placeId={settings.integrations?.google_business_profile_place_id}
            />
          )}
          <ToasterProvider />
        </div>
      </CartProvider>
    </SettingsProvider>
  );
}

function ComingSoonLanding({
  storeName,
  message,
  logoPath,
  address,
  phone,
}: {
  storeName: string;
  message?: string;
  logoPath?: string;
  address?: string;
  phone?: string;
}) {
  const displayMessage =
    message?.trim() ||
    "Our site is currently under maintenance. Please check back soon.";
  const logoUrl = logoPath ? `/api/storage${logoPath}` : null;
  const mapsUrl = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : null;

  return (
    <main className="min-h-screen bg-[#07120d] text-white">
      <div className="min-h-screen bg-[linear-gradient(135deg,#07120d_0%,#0f2118_52%,#09100d_100%)]">
        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-5 sm:px-8">
          <header className="flex items-center justify-between gap-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${storeName} logo`}
                  className="h-11 w-11 rounded-lg bg-white object-contain p-1.5"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#d8b95a]/40 bg-[#d8b95a]/10 text-sm font-semibold text-[#f1d77d]">
                  JC
                </div>
              )}
              <span className="truncate text-lg font-semibold tracking-wide">
                {storeName}
              </span>
            </div>
          </header>

          <section className="flex flex-1 flex-col items-center justify-center py-14 text-center">
            <div className="max-w-3xl">
              <p className="mb-5 text-sm font-semibold uppercase tracking-[0.24em] text-[#d8b95a]">
                Site under maintenance
              </p>
              <h1 className="max-w-4xl text-4xl font-bold leading-[1.03] text-white sm:text-6xl lg:text-7xl">
                We will be back soon.
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/72 sm:text-xl">
                {displayMessage}
              </p>
            </div>

            <div className="mt-10 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
              {mapsUrl && address ? (
                <a
                  href={mapsUrl}
                  className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] p-5 text-white transition-colors hover:border-[#d8b95a]/70"
                >
                  <MapPin className="mb-3 h-5 w-5 text-[#d8b95a]" aria-hidden="true" />
                  <span className="text-sm font-semibold">Google Maps</span>
                  <span className="mt-2 text-sm leading-6 text-white/68">{address}</span>
                </a>
              ) : null}
              {phone ? (
                <a
                  href={`tel:${phone}`}
                  className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] p-5 text-white transition-colors hover:border-[#d8b95a]/70"
                >
                  <Phone className="mb-3 h-5 w-5 text-[#d8b95a]" aria-hidden="true" />
                  <span className="text-sm font-semibold">Phone</span>
                  <span className="mt-2 text-sm leading-6 text-white/68">{phone}</span>
                </a>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
