import Link from "next/link";
import { sql, count, gte } from "drizzle-orm";
import { db, ordersTable } from "@/lib/db";
import { isLocalPreviewMode } from "@/lib/preview";
import { getActiveStands, catalogLoadFailed } from "@/lib/stands-data";
import { formatMoney } from "@/lib/money";

/**
 * The dashboard counted the legacy products table and, when it found nothing,
 * redirected to a setup wizard that no longer exists — so a fresh admin login
 * landed on a 404. It now counts the thing the shop actually sells.
 */
async function getDashboardStats() {
  if (isLocalPreviewMode()) {
    return { standCount: 0, pendingOrders: 0, todayOrders: 0, todayRevenue: 0 };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stands = await getActiveStands();

  try {
    const [pendingOrders] = await db
      .select({ n: count() })
      .from(ordersTable)
      // "Still to make" is the number that matters on a morning: paid orders
      // that have not shipped. `pending` was the pickup vocabulary.
      .where(sql`${ordersTable.status} IN ('new','in_production')`);
    const [todayOrders] = await db
      .select({ n: count() })
      .from(ordersTable)
      .where(gte(ordersTable.createdAt, today));
    const [revenue] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${ordersTable.totalPrice}), 0)::int`,
      })
      .from(ordersTable)
      .where(gte(ordersTable.createdAt, today));

    return {
      standCount: stands.length,
      pendingOrders: pendingOrders.n,
      todayOrders: todayOrders.n,
      todayRevenue: revenue.total ?? 0,
    };
  } catch (err) {
    console.error("[admin/dashboard] order stats failed:", err);
    return {
      standCount: stands.length,
      pendingOrders: 0,
      todayOrders: 0,
      todayRevenue: 0,
    };
  }
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats();
  const catalogBroken = catalogLoadFailed();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-zinc-400 mb-8">
        Stands, orders, website content, and SEO.
      </p>

      {catalogBroken ? (
        <div className="mb-8 rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-200">
          <p className="font-semibold">The catalogue could not be read.</p>
          <p className="mt-1 text-red-300/90">
            The shop is showing as empty to customers. This is a database
            problem, not an empty catalogue — check the connection and run any
            outstanding files in <code>drizzle/</code>.
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <Card label="Today's Orders" value={stats.todayOrders} />
        <Card label="Today's Revenue" value={formatMoney(stats.todayRevenue)} />
        <Card label="Still to make" value={stats.pendingOrders} />
        <Card label="Live Stands" value={stats.standCount} />
      </div>

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-8">
        <div className="mb-5">
          <h2 className="text-xl font-bold">Where to start</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Each decision has one place, so you are not hunting through the backend.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <QuickLink
            href="/admin/orders?status=new"
            title="Orders"
            desc="What needs printing, tracking numbers, and order history."
          />
          <QuickLink
            href="/admin/stands"
            title="Stands"
            desc="The products themselves: photos, copy, sizes, and prices."
          />
          <QuickLink
            href="/admin/shop-categories"
            title="Shop categories"
            desc="Stand types and business uses, plus the hero photo on each landing page."
          />
          <QuickLink
            href="/admin/store/info"
            title="Business Info"
            desc="Name, logos, address, phone, email, socials."
          />
          <QuickLink
            href="/admin/store/pages"
            title="Website Pages"
            desc="Homepage, shop page, and page copy."
          />
          <QuickLink
            href="/admin/store/seo"
            title="SEO Checklist"
            desc="Search titles, descriptions, city, schema, indexing."
          />
          <QuickLink
            href="/admin/store/theme"
            title="Design"
            desc="Colors, typography, and site-wide visual style."
          />
          <QuickLink
            href="/admin/store/checkout"
            title="Checkout"
            desc="Ordering rules, terms, and emergency order pause."
          />
          <QuickLink
            href="/admin/blog"
            title="Blog"
            desc="Articles, categories, and featured images."
          />
        </div>
      </section>
    </div>
  );
}

function Card({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <p className="text-xs uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="text-3xl font-bold text-amber-500 mt-1">{value}</p>
    </div>
  );
}

function QuickLink({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="block bg-zinc-950 border border-zinc-800 rounded-xl p-4 hover:border-amber-700 transition-colors"
    >
      <p className="font-medium">{title}</p>
      <p className="text-sm text-zinc-500 mt-1 leading-relaxed">{desc}</p>
      <p className="text-xs text-amber-500 mt-3">Open</p>
    </Link>
  );
}
