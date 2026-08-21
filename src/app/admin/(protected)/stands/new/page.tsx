import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { standTypesTable } from "@/lib/schema/standTypes";
import { asc } from "drizzle-orm";
import { createStand } from "@/lib/stands-admin";

export const dynamic = "force-dynamic";

/**
 * Creating a stand.
 *
 * Deliberately short: name, type, and what the stand points at. Everything
 * else — prices, pictures, business uses, SEO — is on the editor, and the
 * stand is created as a draft with a full price grid so it opens ready to
 * finish rather than empty.
 */
export default async function NewStandPage() {
  const types = await db
    .select()
    .from(standTypesTable)
    .orderBy(asc(standTypesTable.sortOrder));

  async function action(formData: FormData) {
    "use server";
    const id = await createStand(formData);
    redirect(`/admin/stands/${id}`);
  }

  return (
    <form action={action} className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">New stand</h1>
          <p className="text-sm text-zinc-500">
            Created as a draft with the standard price grid. Nothing reaches the shop
            until you set it active.
          </p>
        </div>
        <Link href="/admin/stands" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← All stands
        </Link>
      </div>

      <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700">Name</span>
          <input name="name" required placeholder="Trustpilot Review Stand" className={input} />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-700">
              URL
            </span>
            <input name="slug" placeholder="left blank = built from the name" className={input} />
            <span className="mt-1 block text-xs text-zinc-500">
              Becomes /stands/&lt;url&gt; and cannot be changed later.
            </span>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-700">
              Stand type
            </span>
            <select name="standTypeId" className={input} required>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-700">Badge</span>
            <input name="badge" placeholder="TRUSTPILOT REVIEW" className={input} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-700">
              Destination label
            </span>
            <input name="destinationLabel" placeholder="Trustpilot review" className={input} />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700">
            Printed headline
          </span>
          <input name="printedHeadline" placeholder="Review us on Trustpilot" className={input} />
          <span className="mt-1 block text-xs text-zinc-500">
            The line printed on the stand itself.
          </span>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700">
            Destination kind
          </span>
          <select name="destinationKind" className={input}>
            <option value="direct">Direct — one link, no monthly fee</option>
            <option value="multilink">
              Hosted multi-link — landing page, $9.99/mo
            </option>
          </select>
          <span className="mt-1 block text-xs text-zinc-500">
            Multi-link also creates the hosted Small (A5) and Large (A4) rows.
          </span>
        </label>
      </section>

      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-700"
        >
          Create and continue
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
