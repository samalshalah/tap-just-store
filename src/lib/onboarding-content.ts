import type { SiteSettings } from "./types";

export interface OnboardingBusinessInput {
  name: string;
  tagline: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  website: string;
  instagram: string;
  domain: string;
}

export interface OnboardingSettingsDraft {
  store: NonNullable<SiteSettings["store"]>;
  location: NonNullable<SiteSettings["location"]>;
  contact: NonNullable<SiteSettings["contact"]>;
  homepage_sections: NonNullable<SiteSettings["homepage_sections"]>;
  about: NonNullable<SiteSettings["about"]>;
  location_page: NonNullable<SiteSettings["location_page"]>;
  contact_page: NonNullable<SiteSettings["contact_page"]>;
  faqs: NonNullable<SiteSettings["faqs"]>;
  seo: NonNullable<SiteSettings["seo"]>;
  shop_config: NonNullable<SiteSettings["shop_config"]>;
}

function clean(value: string | undefined): string {
  return (value ?? "").trim();
}

function normalizeDomain(value: string): string {
  return clean(value)
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/g, "");
}

function joinLocation(city: string, state: string): string {
  const parts = [clean(city), clean(state)].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "your area";
}

function joinAddress(input: OnboardingBusinessInput): string {
  const cityStateZip = [clean(input.city), clean(input.state), clean(input.zip)]
    .filter(Boolean)
    .join(" ");
  return [clean(input.address), cityStateZip].filter(Boolean).join(", ");
}

function fallbackBusiness(input: OnboardingBusinessInput) {
  const name = clean(input.name) || "Your Store";
  const city = clean(input.city) || "your city";
  const state = clean(input.state);
  const market = joinLocation(city, state);
  const tagline =
    clean(input.tagline) ||
    `Quality products, local pickup, and friendly service in ${market}.`;

  return { name, city, state, market, tagline };
}

export function buildInitialOnboardingBusiness(
  settings: SiteSettings
): OnboardingBusinessInput {
  return {
    name: settings.store?.name ?? "",
    tagline: settings.store?.tagline ?? "",
    address: settings.location?.address ?? settings.store?.address ?? "",
    city: settings.location?.city ?? settings.seo?.city ?? "",
    state: settings.location?.state ?? "",
    zip: settings.location?.zip ?? "",
    phone:
      settings.location?.phone ??
      settings.contact?.phone ??
      settings.store?.phone ??
      "",
    email:
      settings.contact?.email ??
      settings.store?.order_confirmation_email ??
      "",
    website: settings.store?.website ?? "",
    instagram: settings.contact?.instagram ?? settings.store?.instagram ?? "",
    domain: settings.seo?.canonical_domain ?? settings.store?.custom_domain ?? "",
  };
}

export function generateOnboardingSettingsDraft(
  input: OnboardingBusinessInput,
  existing: SiteSettings = {}
): OnboardingSettingsDraft {
  const { name, city, state, market, tagline } = fallbackBusiness(input);
  const address = joinAddress(input);
  const domain = normalizeDomain(input.domain || input.website);
  const phone = clean(input.phone);
  const email = clean(input.email);
  const instagram = clean(input.instagram);

  const metaDescription =
    `${name} is an online store in ${market} with a live product catalog, curated brands, local pickup, and clear product information for every order.`
      .replace(/\s+/g, " ")
      .trim();

  return {
    store: {
      ...(existing.store ?? {}),
      name,
      tagline,
      address,
      phone,
      website: clean(input.website),
      instagram,
      custom_domain: domain,
      footer_text:
        existing.store?.footer_text ||
        `${name} serves ${market} with a curated product catalog, friendly support, and a smooth shipping and pickup experience.`,
      age_gate_message:
        existing.store?.age_gate_message ||
        `Welcome to ${name}. Browse the catalog, check availability, and order online for shipping or local pickup.`,
      display_age_gate: existing.store?.display_age_gate ?? true,
    },
    location: {
      ...(existing.location ?? {}),
      title: `${name} Location`,
      subtitle: `Visit ${name} in ${market}.`,
      address,
      city,
      state,
      zip: clean(input.zip),
      phone,
    },
    contact: {
      ...(existing.contact ?? {}),
      title: `Contact ${name}`,
      subtitle: `Questions about products, shipping, or availability? Reach out to ${name}.`,
      email,
      phone,
      instagram,
    },
    homepage_sections: {
      ...(existing.homepage_sections ?? {}),
      hero: {
        ...(existing.homepage_sections?.hero ?? {}),
        visible: true,
        badge: `${market} Online Store`,
        headline: name,
        subheadline: tagline,
        cta_primary: "Shop Products",
        cta_primary_link: "/shop",
        cta_secondary: "Visit Us",
        cta_secondary_link: "/location",
      },
      categories: {
        ...(existing.homepage_sections?.categories ?? {}),
        visible: true,
        label: "Shop The Catalog",
        title: "Shop by category, brand, or product type.",
        subtitle: `Explore the ${name} catalog with simple filters for the way customers actually shop.`,
        columns: existing.homepage_sections?.categories?.columns ?? 4,
        mobile_columns: existing.homepage_sections?.categories?.mobile_columns ?? 2,
        card_size: existing.homepage_sections?.categories?.card_size ?? "sm",
        show_quick_links: true,
      },
      featured: {
        ...(existing.homepage_sections?.featured ?? {}),
        visible: true,
        label: "Featured Products",
        title: "Popular picks from the current catalog.",
        subtitle: `Browse current ${name} inventory and discover new products, brands, and bundles.`,
      },
      why_us: {
        ...(existing.homepage_sections?.why_us ?? {}),
        visible: true,
        label: "Why Shop With Us",
        title: `A better online shopping experience in ${market}.`,
        subtitle: `${name} focuses on clear product details, local service, and a simple online ordering flow.`,
      },
      newsletter: {
        ...(existing.homepage_sections?.newsletter ?? {}),
        visible: true,
        label: "Stay Updated",
        title: `Get ${name} product updates.`,
        subtitle:
          "Stay close to new arrivals, limited drops, and store updates from the team.",
      },
    },
    about: {
      ...(existing.about ?? {}),
      title: `About ${name}`,
      subtitle: `${name} is built around a clear, local, customer-first shopping experience.`,
      headline: `Serving ${market} with curated products.`,
      content:
        `${name} helps customers shop with confidence. The catalog is organized around real product information, current availability, and simple shipping and pickup planning.\n\n` +
        `Our goal is to make every order easier: customers can browse products, compare categories, review specifications and brands, and check out in a few steps.`,
      mission:
        "Make online shopping simple, transparent, and locally useful for every customer.",
      vision:
        "Become the easiest local product catalog for customers to discover, compare, and order from.",
      highlights: [
        "Live catalog organized by category, brand, product type, and price",
        "SEO-ready product, category, and brand pages",
        "Simple pickup flow with clear store information",
      ],
      show_story: true,
      show_mission: true,
      show_vision: true,
      show_highlights: true,
      show_stats: existing.about?.show_stats ?? true,
    },
    location_page: {
      ...(existing.location_page ?? {}),
      h1: `${name} in ${market}`,
      subtitle: `Find ${name}, review store details, and plan your pickup.`,
      intro:
        address.length > 0
          ? `${name} is located at ${address}. Browse the catalog before visiting so your pickup is quick and simple.`
          : `Browse the ${name} catalog before visiting so your pickup is quick and simple.`,
      show_hours: existing.location_page?.show_hours ?? true,
      show_map: existing.location_page?.show_map ?? true,
      cta_text: "Shop Products",
    },
    contact_page: {
      ...(existing.contact_page ?? {}),
      h1: `Contact ${name}`,
      subtitle: "Questions about products, orders, or store details?",
      intro:
        `${name} is here to help customers understand the catalog, product availability, and the shipping and pickup process.`
          .replace(/\s+/g, " ")
          .trim(),
      success_message:
        existing.contact_page?.success_message ||
        `Thanks for contacting ${name}. The team will review your message as soon as possible.`,
      show_form: existing.contact_page?.show_form ?? true,
    },
    faqs: {
      ...(existing.faqs ?? {}),
      title: `${name} FAQs`,
      subtitle: "Helpful answers for new and returning customers.",
      items: [
        {
          id: "onboarding-shipping",
          question: `Does ${name} ship orders or offer local pickup?`,
          answer:
            "Both options are supported. Choose shipping or local pickup at checkout, and the store team will confirm your order details.",
          category: "Store",
          published: true,
        },
        {
          id: "onboarding-ordering",
          question: "How do I place an online order?",
          answer:
            "Browse the catalog, add products to your cart, and submit your order. Availability may change as inventory updates.",
          category: "Ordering",
          published: true,
        },
        {
          id: "onboarding-products",
          question: "Can I shop by category, brand, or price?",
          answer:
            "Yes. The catalog can be filtered by category, brand, product type, and price so customers can find products faster.",
          category: "Products",
          published: true,
        },
        {
          id: "onboarding-location",
          question: `Where is ${name} located?`,
          answer:
            address.length > 0
              ? `${name} is located at ${address}. Check the location page for current details before visiting.`
              : `Check the location page for current ${name} store details before visiting.`,
          category: "Location",
          published: true,
        },
        {
          id: "onboarding-pricing",
          question: "Are catalog prices and products always current?",
          answer:
            "The website is designed to show live inventory, but product availability and pricing can change. The store team confirms final details when your order is processed.",
          category: "Products",
          published: true,
        },
      ],
    },
    seo: {
      ...(existing.seo ?? {}),
      title_template: `{page} | ${name} | ${city}`,
      meta_description: metaDescription,
      canonical_domain: domain,
      city,
      robots_noindex: false,
      auto_structured_data: true,
      page_home: {
        ...(existing.seo?.page_home ?? {}),
        title: `${name} | Online Store in ${market}`,
        description: metaDescription,
        h1: name,
      },
      page_shop: {
        ...(existing.seo?.page_shop ?? {}),
        title: `Shop Products in ${market} | ${name}`,
        description: `Browse the ${name} catalog by product category, brand, product type, and price. Order online for shipping or local pickup in ${market}.`,
        h1: `Shop Products in ${market}`,
      },
      page_product: {
        ...(existing.seo?.page_product ?? {}),
        title: `{product} | ${name}`,
        description: `View product details, brand, specifications, category, and availability from the ${name} catalog in ${market}.`,
      },
      page_category: {
        ...(existing.seo?.page_category ?? {}),
        title: `{category} Products | ${name}`,
        description: `Shop {category} products from the ${name} catalog in ${market}.`,
      },
      page_brand: {
        ...(existing.seo?.page_brand ?? {}),
        title: `{brand} Products | ${name}`,
        description: `Browse {brand} products currently available at ${name} in ${market}.`,
      },
      page_blog: {
        ...(existing.seo?.page_blog ?? {}),
        title: `${name} Blog | Buying Guides and Store Updates`,
        description: `Read ${name} updates, product buying guides, setup tips, and new arrival news for ${market}.`,
      },
    },
    shop_config: {
      ...(existing.shop_config ?? {}),
      h1: `Shop Products in ${market}`,
      subtitle: `Browse the ${name} catalog by category, brand, product type, and price.`,
      layout: existing.shop_config?.layout ?? "hybrid",
      sidebar_show_category: existing.shop_config?.sidebar_show_category ?? true,
      sidebar_show_strain: existing.shop_config?.sidebar_show_strain ?? true,
      sidebar_show_feel: existing.shop_config?.sidebar_show_feel ?? true,
      sidebar_show_brand: existing.shop_config?.sidebar_show_brand ?? true,
      sidebar_show_price: existing.shop_config?.sidebar_show_price ?? true,
      sidebar_show_in_stock_toggle:
        existing.shop_config?.sidebar_show_in_stock_toggle ?? true,
      desktop_columns: existing.shop_config?.desktop_columns ?? 4,
      mobile_columns: existing.shop_config?.mobile_columns ?? 2,
      page_size: existing.shop_config?.page_size ?? 24,
      show_oos: existing.shop_config?.show_oos ?? false,
      show_search_box: existing.shop_config?.show_search_box ?? true,
      default_sort: existing.shop_config?.default_sort ?? "featured",
      sort_options: {
        featured: true,
        price_asc: true,
        price_desc: true,
        name_asc: true,
        name_desc: true,
        ...(existing.shop_config?.sort_options ?? {}),
      },
    },
  };
}
