import { DEFAULTS } from "./defaults";
import { complianceModelName } from "./compliance";
import type { SiteSettings } from "./types";

interface FaqItem {
  question: string;
  answer: string;
}

export function buildCategoryFaqs(
  settings: SiteSettings,
  category: string
): FaqItem[] {
  const storeName = settings.store?.name || DEFAULTS.storeName;
  const city = settings.location?.city || settings.seo?.city || DEFAULTS.city;
  const pickupEnabled = settings.ordering?.pickup_enabled ?? true;
  const deliveryEnabled = settings.ordering?.delivery_enabled ?? false;
  const minOrder = settings.checkout_config?.min_order_amount;
  const legalModelName = complianceModelName(settings);

  const orderMethod = deliveryEnabled
    ? "pickup or delivery"
    : pickupEnabled
    ? "pickup"
    : "local ordering";

  return [
    {
      question: `Where can I buy ${category.toLowerCase()} in ${city}?`,
      answer: `${storeName} keeps a live ${category.toLowerCase()} catalog for customers in ${city}. Product availability, pricing, and stock status update from the store inventory.`,
    },
    {
      question: `Can I order ${category.toLowerCase()} online from ${storeName}?`,
      answer: `Yes. Browse the ${category.toLowerCase()} catalog, add products to your bag, and complete a ${orderMethod} order in line with ${legalModelName}.`,
    },
    {
      question: "How do I get my order?",
      answer: `${storeName} confirms fulfillment details at checkout, including ${orderMethod} options and estimated timing. Delivery and pickup settings can be adjusted from store settings.`,
    },
    ...(minOrder && minOrder > 0
      ? [
          {
            question: "Is there a minimum order amount?",
            answer: `${storeName} currently has a minimum order amount of $${minOrder}. This can be changed anytime in checkout settings.`,
          },
        ]
      : []),
  ];
}
