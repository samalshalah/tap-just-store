import Link from "next/link";
import { revalidatePath } from "next/cache";
import { listTaxonomy, saveTaxonomyRow, type TaxonomyRow } from "@/lib/taxonomy-admin";
import { AdminMediaField } from "@/components/admin/AdminMediaField";

export const dynamic = "force-dynamic";

/**
 * Stand types and business uses — the two doors into the shop.
 *
 * Each row owns its landing page: the name is the H1's subject, and the hero
 * photo is the picture on /for/<slug> or /stands/type/<slug> as well as the
 * card on the homepage. There was no screen for any of it before.
 */
export default async function TaxonomyPage() {
  const { types, uses } = await listTaxonomy();

  async function save(formData: FormData) {
    "use server";
    await saveTaxonomyRow(formData);
    revalidatePath("/admin/shop-categories");
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold text-zinc-900">Shop categories</h1>
      <p className="mt-1 max-w-2xl text-sm text-zinc-500">
        Two ways into the shop. Stand type is what the stand does; business use is who
        it suits. A stand is tagged into these, never duplicated. Each row has its own
        landing page, and the photo here is what that page and the homepage card show.
      </p>

      <Group
        title="Business uses"
        hint="Shown as the photo cards on the homepage and at /for/…"
        rows={uses}
        kind="use"
        save={save}
      />
      <Group
        title="Stand types"
        hint="Shown in the Shop menu and at /stands/type/…"
        rows={types}
        kind="type"
        save={save}
      />
    </div>
  );
}

function Group({
  title,
  hint,
  rows,
  kind,
  save,
}: {
  title: string;
  hint: string;
  rows: TaxonomyRow[];
  kind: "type" | "use";
  save: (formData: FormData) => Promise<void>;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-zinc-900">{title}</h2>
      <p className="mb-3 text-xs text-zinc-500">{hint}</p>

      <div className="space-y-3">
        {rows.map((row) => (
          <details
            key={`${kind}-${row.id}`}
            className="rounded-xl border border-zinc-200 bg-white"
          >
            <summary className="flex cursor-pointer flex-wrap items-center gap-3 p-4">
              <span className="font-semibold text-zinc-900">{row.name}</span>
              <span className="font-mono text-xs text-zinc-400">{row.landingPath}</span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                  row.standCount > 0
                    ? "bg-zinc-100 text-zinc-600"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {row.standCount} {row.standCount === 1 ? "stand" : "stands"}
              </span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                  row.heroImageUrl
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-zinc-100 text-zinc-400"
                }`}
              >
                Photo
              </span>
              {row.standCount === 0 && (
                <span className="text-xs text-amber-700">
                  empty — its landing page returns 404
                </span>
              )}
              <Link
                href={row.landingPath}
                target="_blank"
                className="ml-auto text-xs font-semibold text-zinc-500 hover:text-zinc-800"
              >
                View ↗
              </Link>
            </summary>

            <form action={save} className="space-y-4 border-t border-zinc-100 p-4">
              <input type="hidden" name="kind" value={kind} />
              <input type="hidden" name="id" value={row.id} />

              <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-zinc-700">
                    Name
                  </span>
                  <input name="name" defaultValue={row.name} className={input} required />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-zinc-700">
                    Sort order
                  </span>
                  <input
                    name="sortOrder"
                    type="number"
                    defaultValue={row.sortOrder}
                    className={input}
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-zinc-700">
                  Description
                </span>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={row.description}
                  className={input}
                />
              </label>

              <AdminMediaField
                name="heroImageUrl"
                label="Landing photo"
                hint="Landscape. The page also loads a 3:2 twin of this file with -hero before the extension. If you replace a picture at the same path, add or bump ?v=2 or the old one stays cached."
                defaultValue={row.heroImageUrl}
              />

              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Save {row.name}
              </button>
            </form>
          </details>
        ))}
      </div>
    </section>
  );
}

const input =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-blue-500 focus:outline-none";
