"use server";

import { db } from "@/lib/db";
import { assertAdmin } from "@/lib/admin-auth";
import { standsTable, standBusinessUsesTable } from "@/lib/schema/stands";
import { standTypesTable } from "@/lib/schema/standTypes";
import { businessUsesTable } from "@/lib/schema/businessUses";
import { standVariantsTable } from "@/lib/schema/standVariants";
import { eq, asc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  DEFAULT_VARIANT_GRID,
  MULTILINK_VARIANT_GRID,
  slugifyStand,
} from "@/lib/stand-variant-grid";

export interface AdminStandRow {
  id: number;
  slug: string;
  name: string;
  status: string;
  badge: string;
  destinationKind: string;
  standTypeName: string | null;
  useCount: number;
  variantCount: number;
  hasMain: boolean;
  hasBranded: boolean;
  hasTemplate: boolean;
}

export async function listStandsForAdmin(): Promise<AdminStandRow[]> {
  await assertAdmin();
  const rows = await db
    .select({
      stand: standsTable,
      typeName: standTypesTable.name,
    })
    .from(standsTable)
    .leftJoin(standTypesTable, eq(standTypesTable.id, standsTable.standTypeId))
    .orderBy(asc(standsTable.sortOrder), asc(standsTable.id));

  const ids = rows.map((r) => r.stand.id);
  const uses = ids.length
    ? await db
        .select()
        .from(standBusinessUsesTable)
        .where(inArray(standBusinessUsesTable.standId, ids))
    : [];
  const variants = ids.length
    ? await db.select().from(standVariantsTable).where(inArray(standVariantsTable.standId, ids))
    : [];

  return rows.map(({ stand, typeName }) => ({
    id: stand.id,
    slug: stand.slug,
    name: stand.name,
    status: stand.status,
    badge: stand.badge,
    destinationKind: stand.destinationKind,
    standTypeName: typeName,
    useCount: uses.filter((u) => u.standId === stand.id).length,
    variantCount: variants.filter((v) => v.standId === stand.id).length,
    hasMain: Boolean(stand.mainImageUrl),
    hasBranded: Boolean(stand.brandedImageUrl),
    hasTemplate: Boolean(stand.frontTemplateUrl),
  }));
}

export async function getStandForEdit(id: number) {
  await assertAdmin();
  const [stand] = await db.select().from(standsTable).where(eq(standsTable.id, id)).limit(1);
  if (!stand) return null;
  const [types, uses, selected, variants] = await Promise.all([
    db.select().from(standTypesTable).orderBy(asc(standTypesTable.sortOrder)),
    db.select().from(businessUsesTable).orderBy(asc(businessUsesTable.sortOrder)),
    db
      .select()
      .from(standBusinessUsesTable)
      .where(eq(standBusinessUsesTable.standId, id)),
    db
      .select()
      .from(standVariantsTable)
      .where(eq(standVariantsTable.standId, id))
      .orderBy(asc(standVariantsTable.size), asc(standVariantsTable.optionCode)),
  ]);
  return {
    stand,
    types,
    uses,
    selectedUseIds: selected.map((s) => s.businessUseId),
    variants,
  };
}

export async function saveStand(formData: FormData) {
  await assertAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) throw new Error("Bad stand id");

  const str = (k: string) => String(formData.get(k) ?? "").trim();

  await db
    .update(standsTable)
    .set({
      name: str("name"),
      badge: str("badge"),
      destinationLabel: str("destinationLabel") || "direct link",
      printedHeadline: str("printedHeadline"),
      description: str("description"),
      standTypeId: Number(formData.get("standTypeId")),
      destinationKind:
        formData.get("destinationKind") === "multilink" ? "multilink" : "direct",
      status: formData.get("status") === "active" ? "active" : "draft",
      headlineEditable: formData.get("headlineEditable") === "on",
      mainImageUrl: str("mainImageUrl") || null,
      brandedImageUrl: str("brandedImageUrl") || null,
      frontTemplateUrl: str("frontTemplateUrl") || null,
      seoTitle: str("seoTitle") || null,
      seoDescription: str("seoDescription") || null,
      sortOrder: Number(formData.get("sortOrder") || 0),
      updatedAt: new Date(),
    })
    .where(eq(standsTable.id, id));

  // business uses: replace the tag set
  const useIds = formData
    .getAll("businessUseIds")
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));
  await db.delete(standBusinessUsesTable).where(eq(standBusinessUsesTable.standId, id));
  if (useIds.length) {
    await db
      .insert(standBusinessUsesTable)
      .values(useIds.map((businessUseId) => ({ standId: id, businessUseId })));
  }

  // variant prices, entered in dollars
  const variantIds = formData.getAll("variantIds").map((v) => Number(v));
  for (const vid of variantIds) {
    const dollars = String(formData.get(`price_${vid}`) ?? "");
    const monthly = String(formData.get(`monthly_${vid}`) ?? "");
    const cents = Math.round((parseFloat(dollars) || 0) * 100);
    const monthlyCents = Math.round((parseFloat(monthly) || 0) * 100);

    // Stock: blank means "do not count this one", which is a different thing
    // from zero. Zero is "none left, stop selling"; blank is "I do not track
    // it". Coercing blank to 0 would take every untracked variant off sale.
    const stockRaw = String(formData.get(`stock_${vid}`) ?? "").trim();
    const stockQuantity =
      stockRaw === "" ? null : Math.max(0, Math.floor(Number(stockRaw) || 0));

    const lowRaw = String(formData.get(`low_${vid}`) ?? "").trim();
    const lowStockThreshold =
      lowRaw === "" ? 5 : Math.max(0, Math.floor(Number(lowRaw) || 0));

    // Sellable is saved whatever the price is. It used to be inside a
    // `if (cents > 0)` guard, so un-ticking a row with a blank price silently
    // did nothing and the variant stayed on sale.
    await db
      .update(standVariantsTable)
      .set({
        ...(cents > 0 ? { priceCents: cents } : {}),
        monthlyCents,
        stockQuantity,
        lowStockThreshold,
        active: formData.get(`active_${vid}`) === "on",
      })
      .where(eq(standVariantsTable.id, vid));
  }

  revalidateStandPaths();
}

function revalidateStandPaths() {
  revalidatePath("/admin/stands");
  revalidatePath("/shop");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
}

/**
 * Create a stand, and give it the variant grid straight away.
 *
 * A stand with no variants has no price, so it can never be sold and the shop
 * would show it as $0.00 — creating the rows here means a new stand is
 * complete enough to be priced the moment it exists.
 */
export async function createStand(formData: FormData): Promise<number> {
  await assertAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("A stand needs a name");

  const slug = slugifyStand(String(formData.get("slug") ?? "") || name);
  if (!slug) throw new Error("Could not build a URL from that name");

  const standTypeId = Number(formData.get("standTypeId"));
  if (!Number.isFinite(standTypeId) || standTypeId <= 0) {
    throw new Error("Pick a stand type");
  }

  const [existing] = await db
    .select({ id: standsTable.id })
    .from(standsTable)
    .where(eq(standsTable.slug, slug))
    .limit(1);
  if (existing) throw new Error(`The URL /stands/${slug} is already taken`);

  const destinationKind =
    formData.get("destinationKind") === "multilink" ? "multilink" : "direct";

  const [created] = await db
    .insert(standsTable)
    .values({
      slug,
      name,
      standTypeId,
      badge: String(formData.get("badge") ?? "").trim(),
      destinationLabel:
        String(formData.get("destinationLabel") ?? "").trim() || "direct link",
      destinationKind,
      printedHeadline: String(formData.get("printedHeadline") ?? "").trim(),
      headlineEditable: destinationKind === "multilink",
      // New stands start as drafts. Nothing reaches the shop until someone has
      // looked at the prices and the picture.
      status: "draft",
      sortOrder: Number(formData.get("sortOrder") || 99),
    })
    .returning({ id: standsTable.id });

  const grid =
    destinationKind === "multilink"
      ? [...DEFAULT_VARIANT_GRID, ...MULTILINK_VARIANT_GRID]
      : [...DEFAULT_VARIANT_GRID];

  await db
    .insert(standVariantsTable)
    .values(grid.map((v) => ({ ...v, standId: created.id, active: true })));

  revalidateStandPaths();
  return created.id;
}

/**
 * Add whatever size/option rows this stand is missing.
 *
 * Useful after switching a stand to multi-link, and as a repair for anything
 * imported without a full grid. Existing rows and their prices are untouched.
 */
export async function ensureVariants(standId: number): Promise<number> {
  await assertAdmin();
  const [stand] = await db
    .select()
    .from(standsTable)
    .where(eq(standsTable.id, standId))
    .limit(1);
  if (!stand) throw new Error("No such stand");

  const existing = await db
    .select()
    .from(standVariantsTable)
    .where(eq(standVariantsTable.standId, standId));

  const wanted =
    stand.destinationKind === "multilink"
      ? [...DEFAULT_VARIANT_GRID, ...MULTILINK_VARIANT_GRID]
      : [...DEFAULT_VARIANT_GRID];

  const missing = wanted.filter(
    (w) => !existing.some((e) => e.size === w.size && e.optionCode === w.optionCode)
  );
  if (missing.length) {
    await db
      .insert(standVariantsTable)
      .values(missing.map((v) => ({ ...v, standId, active: true })));
  }

  revalidateStandPaths();
  return missing.length;
}

/**
 * Delete a stand and everything hanging off it.
 *
 * Only ever reached from the editor behind a confirmation. Setting a stand to
 * draft is the reversible way to take it off the shop; this is for something
 * created by mistake.
 */
export async function deleteStand(standId: number): Promise<void> {
  await assertAdmin();
  await db.delete(standVariantsTable).where(eq(standVariantsTable.standId, standId));
  await db
    .delete(standBusinessUsesTable)
    .where(eq(standBusinessUsesTable.standId, standId));
  await db.delete(standsTable).where(eq(standsTable.id, standId));
  revalidateStandPaths();
}
