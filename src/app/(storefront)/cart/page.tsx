import type { Metadata } from "next";
import { getVolumeTiers } from "@/lib/stands-data";
import { CartView } from "@/components/stands/CartView";

export const metadata: Metadata = {
  title: "Your cart",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const tiers = await getVolumeTiers();
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="font-display text-3xl font-bold text-foreground">Your cart</h1>
      <CartView tiers={tiers} />
    </div>
  );
}
