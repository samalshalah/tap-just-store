/**
 * /api/admin/mutations — the admin's write endpoint.
 *
 * Was 833 lines and twenty-two actions, twenty of which drove the legacy
 * cannabis catalogue: products, categories, brands, bulk edits, CSV import and
 * strain-aware SEO generation. Those screens are gone, so are their handlers.
 * What remains is what the admin still has screens for.
 *
 * Stand editing does not come through here — it uses Server Actions in
 * stands-admin.ts, each of which authorises itself.
 */

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ordersTable } from "@/lib/schema/orders";
import { blogPostsTable } from "@/lib/schema/blogPosts";
import { isAdminSession } from "@/lib/admin-auth";

const ORDER_STATUSES = ["pending", "ready", "completed", "cancelled"] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

async function setOrderStatus(payload: { id: number; status: string }) {
  const { id, status } = payload;
  if (!Number.isFinite(id)) throw new Error("Bad order id");
  if (!ORDER_STATUSES.includes(status as OrderStatus)) {
    throw new Error(`Unknown status: ${status}`);
  }
  await db
    .update(ordersTable)
    .set({ status })
    .where(eq(ordersTable.id, id));
  revalidatePath("/admin/orders");
  return { ok: true as const };
}

interface BlogPostPayload {
  id?: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  category?: string | null;
  tags?: string[] | string | null;
  content: string;
  featuredImageUrl?: string | null;
  published?: boolean;
  publishedAt?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

async function upsertBlogPost(payload: BlogPostPayload) {
  if (!payload.title?.trim()) throw new Error("A post needs a title");
  if (!payload.slug?.trim()) throw new Error("A post needs a URL");

  // Every not-null column gets a real value; the schema has no nullable text
  // defaults, so passing null here is a runtime failure, not a blank field.
  const values = {
    title: payload.title.trim(),
    slug: payload.slug.trim(),
    excerpt: payload.excerpt ?? "",
    category: payload.category?.trim() || "General",
    tags: JSON.stringify(
      Array.isArray(payload.tags)
        ? payload.tags
        : typeof payload.tags === "string" && payload.tags.trim()
          ? payload.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : []
    ),
    content: payload.content ?? "",
    featuredImageUrl: payload.featuredImageUrl ?? null,
    published: payload.published ?? false,
    publishedAt: payload.publishedAt ? new Date(payload.publishedAt) : null,
    seoTitle: payload.seoTitle ?? null,
    seoDescription: payload.seoDescription ?? null,
    updatedAt: new Date(),
  };

  if (payload.id) {
    await db.update(blogPostsTable).set(values).where(eq(blogPostsTable.id, payload.id));
    revalidatePath("/admin/blog");
    return { ok: true as const, id: payload.id };
  }

  const [created] = await db
    .insert(blogPostsTable)
    .values(values)
    .returning({ id: blogPostsTable.id });
  revalidatePath("/admin/blog");
  return { ok: true as const, id: created.id };
}

async function deleteBlogPost(id: number) {
  if (!Number.isFinite(id)) throw new Error("Bad post id");
  await db.delete(blogPostsTable).where(eq(blogPostsTable.id, id));
  revalidatePath("/admin/blog");
  return { ok: true as const };
}

export async function POST(req: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  let body: { action?: string; payload?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    switch (body.action) {
      case "setOrderStatus":
        return NextResponse.json(
          await setOrderStatus(body.payload as { id: number; status: string })
        );
      case "upsertBlogPost":
        return NextResponse.json(
          await upsertBlogPost(body.payload as BlogPostPayload)
        );
      case "deleteBlogPost":
        return NextResponse.json(await deleteBlogPost(body.payload as number));
      default:
        return NextResponse.json(
          { error: `Unknown action: ${body.action}` },
          { status: 400 }
        );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
    console.error("[mutations]", body.action, message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
