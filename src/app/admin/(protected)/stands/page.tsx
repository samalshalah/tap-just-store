import Link from "next/link";
import { listStandsForAdmin } from "@/lib/stands-admin";

export const dynamic = "force-dynamic";

export default async function AdminStandsPage() {
  const stands = await listStandsForAdmin();
  const active = stands.filter((s) => s.status === "active").length;

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Stands</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {stands.length} total · {active} active · {stands.length - active} draft
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="p-3 font-semibold">Stand</th>
              <th className="p-3 font-semibold">Stand type</th>
              <th className="p-3 font-semibold">Uses</th>
              <th className="p-3 font-semibold">Variants</th>
              <th className="p-3 font-semibold">Media</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {stands.map((s) => (
              <tr key={s.id} className="border-b border-zinc-100 last:border-0">
                <td className="p-3">
                  <span className="font-semibold text-zinc-900">{s.name}</span>
                  <span className="block text-xs text-zinc-400">
                    /{s.slug}
                    {s.destinationKind === "multilink" && (
                      <span className="ml-2 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">
                        MULTI-LINK
                      </span>
                    )}
                  </span>
                </td>
                <td className="p-3 text-zinc-600">{s.standTypeName ?? "—"}</td>
                <td className="p-3 text-zinc-600">{s.useCount}</td>
                <td className="p-3 text-zinc-600">{s.variantCount}</td>
                <td className="p-3">
                  {s.hasMedia ? (
                    <span className="text-emerald-600">✓</span>
                  ) : (
                    <span className="text-amber-600">missing</span>
                  )}
                </td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      s.status === "active"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-zinc-200 text-zinc-600"
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <Link
                    href={`/admin/stands/${s.id}`}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:border-zinc-400"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-zinc-500">
        Draft stands never appear in the shop and their pages return 404. A stand needs a
        stand type, at least one business use, priced variants and a main image before it
        should go active.
      </p>
    </div>
  );
}
