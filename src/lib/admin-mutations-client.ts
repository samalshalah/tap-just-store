/**
 * Client for /api/admin/mutations.
 *
 * Only the blog is left. Orders moved to Server Actions in orders-admin.ts,
 * where the state machine can be enforced; product, category, brand,
 * bulk-edit and CSV-import calls went with the screens that made them.
 */

export interface BlogPostInput {
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

async function call<T>(action: string, payload: unknown): Promise<T> {
  const res = await fetch("/api/admin/mutations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json as T;
}

export function upsertBlogPost(input: BlogPostInput) {
  return call<{ ok: true; id: number }>("upsertBlogPost", input);
}

export function deleteBlogPost(id: number) {
  return call<{ ok: true }>("deleteBlogPost", id);
}
