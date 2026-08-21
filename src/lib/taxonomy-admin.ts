"use server";

import { db } from "@/lib/db";
import { assertAdmin } from "@/lib/admin-auth";
import { standTypesTable } from "@/lib/schema/standTypes";
import { businessUsesTable } from "@/lib/schema/businessUses";
import { standsTable, standBusinessUsesTable } from "@/lib/schema/stands";
import { asc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface TaxonomyRow {
  id: number;
  slug: string;
  name: string;
  description: string;
  heroImageUrl: string;
  sortOrder: number;
  /** Active stands under this row — an empty category 404s its landing page. */
  standCount: number;
  landingPath: string;
}

/**
 * The two taxonomies behind the shop, in one place.
 *
 * They had no admin at all: the landing hero photo lives on these rows, so
 * changing the picture on /for/legal meant running SQL by hand.
 */
export async function listTaxonomy(): Promise<{
  types: TaxonomyRow[];
  uses: TaxonomyRow[];
}> {
  await assertAdmin();
  const [types, uses, stands, links] = await Promise.all([
    db.select().from(standTypesTable).orderBy(asc(standTypesTable.sortOrder)),
    db.select().from(businessUsesTable).orderBy(asc(businessUsesTable.sortOrder)),
    db.select().from(standsTable).where(eq(standsTable.status, "active")),
    db.select().from(standBusinessUsesTable),
  ]);

  const activeIds = new Set(stands.map((s) => s.id));

  return {
    types: types.map((t) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      description: t.description,
      heroImageUrl: t.heroImageUrl,
      sortOrder: t.sortOrder,
      standCount: stands.filter((s) => s.standTypeId === t.id).length,
      landingPath: `/stands/type/${t.slug}`,
    })),
    uses: uses.map((u) => ({
      id: u.id,
      slug: u.slug,
      name: u.name,
      description: u.description,
      heroImageUrl: u.heroImageUrl,
      sortOrder: u.sortOrder,
      standCount: links.filter(
        (l) => l.businessUseId === u.id && activeIds.has(l.standId)
      ).length,
      landingPath: `/for/${u.slug}`,
    })),
  };
}

/**
 * Save one row of either taxonomy.
 *
 * The hero image is stored exactly as typed, including any ?v= stamp. Swapping
 * a picture at the same path without bumping that stamp leaves the old one in
 * the CDN for an hour, which is why the field says so.
 */
export async function saveTaxonomyRow(formData: FormData) {
  await assertAdmin();
  const kind = String(formData.get("kind"));
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) throw new Error("Bad id");

  const values = {
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    heroImageUrl: String(formData.get("heroImageUrl") ?? "").trim(),
    sortOrder: Number(formData.get("sortOrder") || 0),
  };
  if (!values.name) throw new Error("A name is required");

  if (kind === "type") {
    await db.update(standTypesTable).set(values).where(eq(standTypesTable.id, id));
  } else if (kind === "use") {
    await db.update(businessUsesTable).set(values).where(eq(businessUsesTable.id, id));
  } else {
    throw new Error("Unknown taxonomy");
  }

  revalidatePath("/admin/shop-categories");
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath(kind === "type" ? "/stands/type/[slug]" : "/for/[slug]", "page");
}

/** Used by the editor's use-picker so it never falls out of step. */
export async function listBusinessUseIds(standId: number): Promise<number[]> {
  await assertAdmin();
  const rows = await db
    .select()
    .from(standBusinessUsesTable)
    .where(inArray(standBusinessUsesTable.standId, [standId]));
  return rows.map((r) => r.businessUseId);
}
