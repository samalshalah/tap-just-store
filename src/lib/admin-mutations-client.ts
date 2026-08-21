/**
 * Client for /api/admin/mutations.
 *
 * What is left after the legacy catalogue went: orders and blog. Product,
 * category, brand, bulk-edit and CSV-import calls were removed along with the
 * screens that made them.
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

export function setOrderStatus(
  id: number,
  status: "pending" | "ready" | "completed" | "cancelled"
) {
  return call<{ ok: true }>("setOrderStatus", { id, status });
}

export function upsertBlogPost(input: BlogPostInput) {
  return call<{ ok: true; id: number }>("upsertBlogPost", input);
}

export function deleteBlogPost(id: number) {
  return call<{ ok: true }>("deleteBlogPost", id);
}
