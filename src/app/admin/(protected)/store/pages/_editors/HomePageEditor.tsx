"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import type { SiteSettings } from "@/lib/types";
import { saveSettingSlice } from "@/lib/admin-settings-client";
import { Field, Input, Textarea } from "@/components/AdminFormControls";

/**
 * The homepage editor.
 *
 * It used to have six tabs — section order, hero, categories, featured
 * carousel, why-us, testimonials and newsletter — and the homepage read
 * exactly one of them. Reordering sections, hiding the carousel, retitling
 * "Why Us": every one of those controls saved a value nothing ever loaded.
 * A control that does nothing is worse than a missing one, because someone
 * spends an afternoon wondering why their change had no effect.
 *
 * What is left is the seven hero fields the homepage genuinely renders. The
 * rest of the page — the stand-type grid, the business-use cards, the featured
 * stands — is driven by the catalogue itself, which is the right place for it:
 * add a stand and it appears, with no second switch to remember.
 */
type Sections = NonNullable<SiteSettings["homepage_sections"]>;

export function HomePageEditor({ settings }: { settings: SiteSettings }) {
  const [hero, setHero] = useState<NonNullable<Sections["hero"]>>(
    settings.homepage_sections?.hero ?? {}
  );
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (patch: Partial<NonNullable<Sections["hero"]>>) =>
    setHero((h) => ({ ...h, ...patch }));

  const onSave = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        // Merged rather than replaced, so any other slice that gets added
        // later is not wiped by saving the hero.
        await saveSettingSlice("homepage_sections", {
          ...(settings.homepage_sections ?? {}),
          hero,
        });
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
        <div>
          <h2 className="font-bold text-zinc-100">Homepage hero</h2>
          <p className="mt-1 text-sm text-zinc-500">
            The band at the top of the homepage. Everything below it — stand
            types, business cards, featured stands — comes from the catalogue,
            so adding a stand is all it takes to change them.
          </p>
        </div>

        <Field label="Eyebrow" hint="Small text above the headline. Leave blank for “NFC STANDS”.">
          <Input
            value={hero.badge ?? ""}
            onChange={(e) => update({ badge: e.target.value })}
            placeholder="NFC STANDS"
          />
        </Field>

        <Field label="Headline">
          <Input
            value={hero.headline ?? ""}
            onChange={(e) => update({ headline: e.target.value })}
            placeholder="One tap. That is the whole thing."
          />
        </Field>

        <Field label="Subheadline">
          <Textarea
            rows={2}
            value={hero.subheadline ?? ""}
            onChange={(e) => update({ subheadline: e.target.value })}
            placeholder="Put a stand on your counter and your customers go straight where you need them."
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Main button">
            <Input
              value={hero.cta_primary ?? ""}
              onChange={(e) => update({ cta_primary: e.target.value })}
              placeholder="Shop stands"
            />
          </Field>
          <Field label="Main button link">
            <Input
              value={hero.cta_primary_link ?? ""}
              onChange={(e) => update({ cta_primary_link: e.target.value })}
              placeholder="/shop"
            />
          </Field>
          <Field label="Second button">
            <Input
              value={hero.cta_secondary ?? ""}
              onChange={(e) => update({ cta_secondary: e.target.value })}
              placeholder="How it works"
            />
          </Field>
          <Field label="Second button link">
            <Input
              value={hero.cta_secondary_link ?? ""}
              onChange={(e) => update({ cta_secondary_link: e.target.value })}
              placeholder="/how-it-works"
            />
          </Field>
        </div>
      </section>

      <SaveBar pending={pending} saved={saved} error={error} onSave={onSave} />
    </div>
  );
}

function SaveBar({
  pending,
  saved,
  error,
  onSave,
}: {
  pending: boolean;
  saved: boolean;
  error: string | null;
  onSave: () => void;
}) {
  return (
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
  );
}
