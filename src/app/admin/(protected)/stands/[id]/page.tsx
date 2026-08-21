import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  getStandForEdit,
  saveStand,
  ensureVariants,
  deleteStand,
} from "@/lib/stands-admin";
import { centsToInput } from "@/lib/money";
import { AdminMediaField } from "@/components/admin/AdminMediaField";

export const dynamic = "force-dynamic";

const OPTION_LABEL: Record<string, string> = {
  standard_direct: "Standard Direct",
  branded_qr_direct: "Branded + QR",
  hosted_multilink: "Hosted Multi-Link",
};

export default async function EditStandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getStandForEdit(Number(id));
  if (!data) notFound();
  const { stand, types, uses, selectedUseIds, variants } = data;

  async function action(formData: FormData) {
    "use server";
    await saveStand(formData);
    redirect("/admin/stands");
  }

  async function addMissingVariants() {
    "use server";
    await ensureVariants(stand.id);
    redirect(`/admin/stands/${stand.id}`);
  }

  async function removeStand() {
    "use server";
    await deleteStand(stand.id);
    redirect("/admin/stands");
  }

  return (
    <>
    <form action={action} className="max-w-3xl space-y-6">
      <input type="hidden" name="id" value={stand.id} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{stand.name}</h1>
          <p className="text-sm text-zinc-500">/{stand.slug}</p>
        </div>
        <Link href="/admin/stands" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← All stands
        </Link>
      </div>

      <Section title="Basics">
        <Grid>
          <Field label="Name">
            <input name="name" defaultValue={stand.name} className={input} required />
          </Field>
          <Field label="Stand type (one only)">
            <select name="standTypeId" defaultValue={stand.standTypeId} className={input}>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>
        </Grid>
        <Grid>
          <Field label="Badge" hint="Shown on the card and product page">
            <input name="badge" defaultValue={stand.badge} className={input} />
          </Field>
          <Field label="Destination label" hint="e.g. Google review, booking, menu">
            <input
              name="destinationLabel"
              defaultValue={stand.destinationLabel}
              className={input}
            />
          </Field>
        </Grid>
        <Grid>
          <Field
            label="Destination kind"
            hint="Multi-link adds the hosted landing page and its monthly fee"
          >
            <select
              name="destinationKind"
              defaultValue={stand.destinationKind}
              className={input}
            >
              <option value="direct">Direct — one link, no monthly fee</option>
              <option value="multilink">
                Hosted multi-link — landing page, $9.99/mo
              </option>
            </select>
          </Field>
          <Field label="URL" hint="Fixed after creation so live links keep working">
            <input
              value={`/stands/${stand.slug}`}
              readOnly
              className={`${input} cursor-not-allowed bg-zinc-50 text-zinc-500`}
            />
          </Field>
        </Grid>
        <Field label="Printed headline" hint="The line printed on the stand">
          <input
            name="printedHeadline"
            defaultValue={stand.printedHeadline}
            className={input}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            name="headlineEditable"
            defaultChecked={stand.headlineEditable}
          />
          Customer can change the printed headline (multi-link stands)
        </label>
        <Field label="Description">
          <textarea
            name="description"
            rows={3}
            defaultValue={stand.description}
            className={input}
          />
        </Field>
      </Section>

      <Section title="Business uses" hint="Tagged, never duplicated — a stand appears under each use you tick">
        <div className="grid grid-cols-2 gap-2">
          {uses.map((u) => (
            <label key={u.id} className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                name="businessUseIds"
                value={u.id}
                defaultChecked={selectedUseIds.includes(u.id)}
              />
              {u.name}
            </label>
          ))}
        </div>
      </Section>

      <Section title="Pricing" hint="Entered in dollars, stored in cents">
        <div className="space-y-2">
          {variants.map((v) => (
            <div
              key={v.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 p-3"
            >
              <input type="hidden" name="variantIds" value={v.id} />
              <span className="w-16 text-sm font-bold uppercase text-zinc-900">{v.size}</span>
              <span className="w-40 text-sm text-zinc-600">
                {OPTION_LABEL[v.optionCode] ?? v.optionCode}
              </span>
              <label className="flex items-center gap-1.5 text-sm text-zinc-600">
                $
                <input
                  name={`price_${v.id}`}
                  defaultValue={centsToInput(v.priceCents)}
                  className="w-24 rounded border border-zinc-300 px-2 py-1"
                  step="0.01"
                  type="number"
                />
              </label>
              {v.optionCode === "hosted_multilink" && (
                <label className="flex items-center gap-1.5 text-sm text-zinc-600">
                  + $
                  <input
                    name={`monthly_${v.id}`}
                    defaultValue={centsToInput(v.monthlyCents)}
                    className="w-20 rounded border border-zinc-300 px-2 py-1"
                    step="0.01"
                    type="number"
                  />
                  /mo
                </label>
              )}
              <label className="ml-auto flex items-center gap-2 text-sm text-zinc-600">
                <input type="checkbox" name={`active_${v.id}`} defaultChecked={v.active} />
                Sellable
              </label>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Media"
        hint="Upload a file or paste a path. Square images look best — the product page shows them in a square frame."
      >
        <AdminMediaField
          name="mainImageUrl"
          label="Main image"
          hint="The standard stand. Used on the shop card and as the default view on the product page."
          defaultValue={stand.mainImageUrl ?? ""}
        />
        <AdminMediaField
          name="brandedImageUrl"
          label="Branded + QR image"
          hint="The same stand with a logo, business name and QR printed on it. Shown when a customer picks Branded + QR; leave empty and the product page shows the main image only."
          defaultValue={stand.brandedImageUrl ?? ""}
        />
        <AdminMediaField
          name="frontTemplateUrl"
          label="Branded front template"
          hint="The flat front panel, straight on. This is what the setup flow will print the customer's logo and QR onto for their proof."
          defaultValue={stand.frontTemplateUrl ?? ""}
        />
      </Section>

      <Section title="SEO" hint="Leave blank to auto-generate from the stand">
        <Field label="SEO title override">
          <input name="seoTitle" defaultValue={stand.seoTitle ?? ""} className={input} />
        </Field>
        <Field label="SEO description override">
          <textarea
            name="seoDescription"
            rows={2}
            defaultValue={stand.seoDescription ?? ""}
            className={input}
          />
        </Field>
      </Section>

      <Section title="Publishing">
        <Grid>
          <Field label="Status">
            <select name="status" defaultValue={stand.status} className={input}>
              <option value="draft">Draft — hidden from the shop</option>
              <option value="active">Active — visible in the shop</option>
            </select>
          </Field>
          <Field label="Sort order">
            <input
              name="sortOrder"
              type="number"
              defaultValue={stand.sortOrder}
              className={input}
            />
          </Field>
        </Grid>
      </Section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-700"
        >
          Save changes
        </button>
        <Link
          href="/admin/stands"
          className="rounded-lg border border-zinc-300 px-6 py-2.5 font-semibold text-zinc-700"
        >
          Cancel
        </Link>
        <Link
          href={`/stands/${stand.slug}`}
          target="_blank"
          className="text-sm font-semibold text-zinc-500 hover:text-zinc-800"
        >
          View live page ↗
        </Link>
      </div>
    </form>

    {/* Outside the editor form: nesting forms is invalid HTML, and these two
        actions must not carry the unsaved edits above. */}
    <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-6">
      <form action={addMissingVariants}>
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:border-zinc-400"
        >
          Add missing size/option rows
        </button>
      </form>
      <form action={removeStand}>
        <button
          type="submit"
          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
        >
          Delete this stand
        </button>
      </form>
      <p className="text-xs text-zinc-500">
        Deleting removes the stand, its prices and its tags for good. To take it off the
        shop and keep it, set the status to draft instead. Both buttons save nothing else
        on this page.
      </p>
    </div>
    </>
  );
}

const input =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none";

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
      <div>
        <h2 className="font-semibold text-zinc-900">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-zinc-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}
