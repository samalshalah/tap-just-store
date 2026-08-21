/**
 * CartContext — the client-side cart, keyed to stand variants.
 *
 * It used to be keyed to `productId` from the white-label catalogue, which no
 * longer exists. What a customer buys now is a specific row of the size x
 * finish grid — a stand variant — together with the setup they configured for
 * it: where a tap should send people, and for a branded stand the business
 * name and logo that get printed on the face.
 *
 * Two consequences worth stating, because they drove the shape of this file:
 *
 * 1. **A variant alone does not identify a line.** Two Small Google-review
 *    stands pointing at two different listings are two different products —
 *    one is going to be printed and programmed differently from the other. So
 *    lines merge only when the variant *and* the whole setup match. A shop
 *    ordering five identical stands still gets one line of five; a franchise
 *    ordering one per location gets a line each, which is what has to happen
 *    for the print queue to be right.
 *
 * 2. **Prices here are for display only.** They are in localStorage, so the
 *    customer can edit them. The server recomputes every price from the
 *    variant id before charging. Nothing downstream may trust priceCents.
 */
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/** What the customer configured before adding the stand to the cart. */
export interface CartSetup {
  /** Where a tap sends people. Required on every stand. */
  destinationUrl: string;
  /** Branded only: the business name printed on the face. */
  businessName?: string;
  /**
   * Branded only: the stored path of the uploaded logo.
   *
   * Null or absent means a text-only branded stand — the business name set in
   * type, no logo. Plenty of small businesses have no logo file at all, and
   * refusing them the upgrade would be leaving money on the table.
   */
  logoPath?: string | null;
}

export interface CartItem {
  /** Identity of this line. Stable across quantity changes and reloads. */
  lineId: string;
  standVariantId: number;
  standSlug: string;
  standName: string;
  /** "a5" | "a4" — rendered through sizes.ts, never shown raw. */
  size: string;
  optionCode: string;
  /** Display only. The server recomputes from standVariantId. */
  priceCents: number;
  /** Recurring fee for a hosted multi-link stand. Zero for direct stands. */
  monthlyCents: number;
  imageUrl: string | null;
  quantity: number;
  setup: CartSetup;
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  /** Display subtotal in cents, before volume discount. */
  totalPrice: number;
  /** Sum of recurring fees, so the cart can say "plus $9.99/mo". */
  monthlyTotal: number;
  /** Adds, or increments an existing line with an identical setup. */
  addItem: (line: Omit<CartItem, "lineId" | "quantity">, quantity?: number) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
  hydrated: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

/**
 * Bumped from "white_label_cart".
 *
 * Any cart still in a browser from before this change holds legacy product
 * ids that point at rows we deleted. Reading one would produce a cart of
 * items that cannot be priced or shipped. A new key means those carts are
 * simply not found, which is the safe failure.
 */
const STORAGE_KEY = "tap_rater_cart_v1";

/** Two lines merge only if they would produce an identical printed stand. */
function sameSetup(a: CartSetup, b: CartSetup): boolean {
  return (
    a.destinationUrl === b.destinationUrl &&
    (a.businessName ?? "") === (b.businessName ?? "") &&
    (a.logoPath ?? null) === (b.logoPath ?? null)
  );
}

function newLineId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `line-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

/** Reject anything that is not a well-formed line, rather than half-loading it. */
function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.lineId === "string" &&
    typeof v.standVariantId === "number" &&
    typeof v.quantity === "number" &&
    v.quantity > 0 &&
    typeof v.priceCents === "number" &&
    typeof v.setup === "object" &&
    v.setup !== null &&
    typeof (v.setup as Record<string, unknown>).destinationUrl === "string"
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate on mount only — keeps the SSR and client HTML identical.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed.filter(isCartItem));
      }
    } catch {
      // Corrupt storage — start empty rather than throwing on every render.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Quota or private mode. The cart still works for this page view.
    }
  }, [items, hydrated]);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.priceCents * i.quantity, 0);
  const monthlyTotal = items.reduce((s, i) => s + i.monthlyCents * i.quantity, 0);

  const addItem: CartContextValue["addItem"] = (line, quantity = 1) => {
    setItems((prev) => {
      const match = prev.find(
        (i) =>
          i.standVariantId === line.standVariantId && sameSetup(i.setup, line.setup)
      );
      if (match) {
        return prev.map((i) =>
          i.lineId === match.lineId ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { ...line, lineId: newLineId(), quantity }];
    });
  };

  const removeItem: CartContextValue["removeItem"] = (lineId) => {
    setItems((prev) => prev.filter((i) => i.lineId !== lineId));
  };

  const updateQuantity: CartContextValue["updateQuantity"] = (lineId, quantity) => {
    if (quantity <= 0) {
      removeItem(lineId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.lineId === lineId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => setItems([]);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        monthlyTotal,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        hydrated,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
