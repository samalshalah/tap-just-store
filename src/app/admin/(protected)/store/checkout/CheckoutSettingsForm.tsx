"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { saveSettingSlice } from "@/lib/admin-settings-client";
import { Field, Input, Checkbox } from "@/components/AdminFormControls";
import type { SiteSettings } from "@/lib/types";

/**
 * Checkout settings.
 *
 * Nine controls, seven of which saved values nothing read: tipping and tip
 * presets, minimum order, guest checkout, a terms checkbox, and a pickup prep
 * time left over from a shop customers walked into. They are gone.
 *
 * Tipping in particular had no business here — this is a physical product that
 * arrives in the post, not a counter service.
 *
 * Acceptance of the terms is not a tick box any more. The terms page says that
 * placing an order means accepting them, and checkout links to it directly
 * above the pay button, which is both the honest arrangement and the one that
 * does not add a step between a customer and their card.
 */
type CO = NonNullable<SiteSettings["checkout_config"]>;
type OR = NonNullable<SiteSettings["ordering"]>;
type ST = NonNullable<SiteSettings["store"]>;

export function CheckoutSettingsForm({
  checkout: initCO,
  ordering: initOR,
  store: initStore,
}: {
  checkout: CO;
  ordering: OR;
  store: ST;
}) {
  const [co, setCO] = useState<CO>(initCO);
  const [or, setOR] = useState<OR>(initOR);
  const [store, setStore] = useState<ST>(initStore);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await saveSettingSlice("checkout_config", co);
        await saveSettingSlice("ordering", or);
        await saveSettingSlice("store", store);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  };

  return (
    <div className="space-y-5">
      <section className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="font-bold text-zinc-100">Taking orders</h2>

        <Checkbox
          label="Pause all orders"
          checked={or.pause_all_orders ?? false}
          onChange={(e) => setOR({ ...or, pause_all_orders: e.target.checked })}
        />
        <p className="-mt-2 text-sm text-zinc-500">
          Stops checkout immediately and tells customers their cart is saved.
          Use it if you run out of blanks or a printer goes down.
        </p>

        <Checkbox
          label="Ask for order notes"
          checked={co.order_notes ?? true}
          onChange={(e) => setCO({ ...co, order_notes: e.target.checked })}
        />
        <p className="-mt-2 text-sm text-zinc-500">
          An optional box on the checkout page. Notes show on the order in the
          admin.
        </p>
      </section>

      <section className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="font-bold text-zinc-100">Order emails</h2>

        <Checkbox
          label="Send order emails"
          checked={store.order_confirmation_enabled ?? false}
          onChange={(e) =>
            setStore({ ...store, order_confirmation_enabled: e.target.checked })
          }
        />
        <p className="-mt-2 text-sm text-zinc-500">
          Sends the customer a receipt when their payment clears, and you a copy
          of every new order. Needs <code>RESEND_API_KEY</code> set in
          Cloudflare — without it nothing is sent and the failure is logged.
        </p>

        <Field
          label="Send your copy to"
          hint="Leave blank to use the contact email from Business Info."
        >
          <Input
            type="email"
            value={store.order_confirmation_email ?? ""}
            onChange={(e) =>
              setStore({ ...store, order_confirmation_email: e.target.value })
            }
            placeholder="orders@taprater.com"
          />
        </Field>
      </section>

      <div className="sticky bottom-0 -mx-6 -mb-6 mt-6 flex items-center gap-3 border-t border-zinc-800 bg-zinc-950/95 px-6 py-4 backdrop-blur">
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 font-semibold text-white hover:bg-amber-500 disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </button>
        {saved && <span className="text-sm text-emerald-400">Saved ✓</span>}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </div>
  );
}
