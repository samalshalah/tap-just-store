import Link from "next/link";
import { listOrders } from "@/lib/orders-admin";
import { ORDER_STATUSES, STATUS_LABELS } from "@/lib/order-status";
import { OrdersTable } from "./OrdersTable";

export const dynamic = "force-dynamic";

/**
 * The orders screen.
 *
 * Filtering lives in the URL rather than in component state, so a filtered
 * view can be bookmarked, shared, and survives the page revalidating after a
 * status change. It also means the query runs on the server against an
 * indexed column instead of shipping every order to the browser to filter it
 * there — the previous version selected every order and every line item.
 */
export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; payment?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const result = await listOrders({
    q: params.q,
    status: params.status,
    paymentStatus: params.payment,
    page,
  });

  const build = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = {
      q: params.q,
      status: params.status,
      payment: params.payment,
      ...patch,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v) next.set(k, v);
    }
    const qs = next.toString();
    return `/admin/orders${qs ? `?${qs}` : ""}`;
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="mt-1 text-zinc-400">
            {result.total} {result.total === 1 ? "order" : "orders"}
            {result.openCount > 0 && (
              <>
                {" · "}
                <Link
                  href={build({ status: "new", page: undefined })}
                  className="font-semibold text-amber-600 hover:underline"
                >
                  {result.openCount} still to make
                </Link>
              </>
            )}
          </p>
        </div>

        <form method="get" action="/admin/orders" className="flex gap-2">
          {params.status && <input type="hidden" name="status" value={params.status} />}
          {params.payment && <input type="hidden" name="payment" value={params.payment} />}
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Code, name, email or tracking"
            className="w-64 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Search
          </button>
        </form>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-1.5">
        <Chip href={build({ status: undefined, page: undefined })} active={!params.status}>
          All
        </Chip>
        {ORDER_STATUSES.map((s) => (
          <Chip
            key={s}
            href={build({ status: s, page: undefined })}
            active={params.status === s}
          >
            {STATUS_LABELS[s]}
          </Chip>
        ))}
        <span className="mx-2 h-4 w-px bg-zinc-300" />
        <Chip
          href={build({ payment: params.payment === "unpaid" ? undefined : "unpaid", page: undefined })}
          active={params.payment === "unpaid"}
        >
          Unpaid
        </Chip>
        <Chip
          href={build({ payment: params.payment === "refunded" ? undefined : "refunded", page: undefined })}
          active={params.payment === "refunded"}
        >
          Refunded
        </Chip>
        {(params.q || params.status || params.payment) && (
          <Link href="/admin/orders" className="ml-2 text-sm text-zinc-500 hover:text-zinc-900">
            Clear
          </Link>
        )}
      </div>

      <OrdersTable orders={result.orders} />

      {result.pageCount > 1 && (
        <nav className="mt-6 flex items-center justify-between text-sm">
          <span className="text-zinc-500">
            Page {result.page} of {result.pageCount}
          </span>
          <div className="flex gap-2">
            {result.page > 1 && (
              <Link
                href={build({ page: String(result.page - 1) })}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100"
              >
                Previous
              </Link>
            )}
            {result.page < result.pageCount && (
              <Link
                href={build({ page: String(result.page + 1) })}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100"
              >
                Next
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
        active
          ? "border-blue-600 bg-blue-50 font-semibold text-blue-700"
          : "border-zinc-300 text-zinc-600 hover:border-zinc-400"
      }`}
    >
      {children}
    </Link>
  );
}
