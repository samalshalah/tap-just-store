"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/components/CartContext";

/**
 * The mobile bar pinned to the bottom of the screen.
 *
 * This used to be Call and Directions, which belonged to a walk-in shop. Tap
 * Rater sells online, so the two things worth a permanent thumb-reach slot are
 * getting to the catalogue and getting to the cart.
 *
 * It hides itself on the pages where it would be in the way — the cart and
 * checkout already have their own primary action.
 */
const HIDDEN_ON = ["/cart", "/checkout", "/order"];

export function MobileStickyActions() {
  const pathname = usePathname();
  const { totalItems } = useCart();

  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_32px_rgba(16,24,40,0.12)] backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-2 gap-3">
        <Link
          href="/cart"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-bold text-foreground transition-colors active:scale-[0.99] active:border-accent"
        >
          <ShoppingBag className="h-4 w-4 text-accent" aria-hidden="true" />
          Cart{totalItems > 0 ? ` (${totalItems})` : ""}
        </Link>
        <Link
          href="/shop"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-bold text-white shadow-lg shadow-accent/20 transition-opacity active:scale-[0.99]"
        >
          Shop stands
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
