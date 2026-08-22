import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/settings";
import { getVolumeTiers } from "@/lib/stands-data";
import { isStripeConfigured } from "@/lib/stripe";
import { CheckoutClient } from "@/components/CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your order.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/checkout" },
};

export default async function CheckoutPage() {
  const [settings, tiers] = await Promise.all([getSiteSettings(), getVolumeTiers()]);
  const cc = settings.checkout_config ?? {};

  return (
    <CheckoutClient
      config={{
        ordersPaused: settings.ordering?.pause_all_orders ?? false,
        showNotes: cc.order_notes ?? true,
        // Whether payments are switched on at all. Better to say so plainly
        // than to let someone fill in an address and fail at the last step.
        paymentsReady: isStripeConfigured(),
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
      }}
      tiers={tiers}
    />
  );
}
