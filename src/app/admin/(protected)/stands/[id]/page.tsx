import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getStandForEdit, saveStand } from "@/lib/stands-admin";
import { centsToInput } from "@/lib/money";

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

  return (
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

      <Section title="Media" hint="Three slots: main, branded angle, and the front template used for proofs">
        <Field label="Main image URL">
          <input name="mainImageUrl" defaultValue={stand.mainImageUrl ?? ""} className={input} />
        </Field>
        <Field label="Branded + QR image URL">
          <input
            name="brandedImageUrl"
            defaultValue={stand.brandedImageUrl ?? ""}
            className={input}
          />
        </Field>
        <Field label="Branded front template URL">
          <input
            name="frontTemplateUrl"
            defaultValue={stand.frontTemplateUrl ?? ""}
            className={input}
          />
        </Field>
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

      <div className="flex gap-3">
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
      </div>
    </form>
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
