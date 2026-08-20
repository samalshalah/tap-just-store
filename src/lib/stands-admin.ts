"use server";

import { db } from "@/lib/db";
import { standsTable, standBusinessUsesTable } from "@/lib/schema/stands";
import { standTypesTable } from "@/lib/schema/standTypes";
import { businessUsesTable } from "@/lib/schema/businessUses";
import { standVariantsTable } from "@/lib/schema/standVariants";
import { eq, asc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
  hasMedia: boolean;
}

export async function listStandsForAdmin(): Promise<AdminStandRow[]> {
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
    hasMedia: Boolean(stand.mainImageUrl),
  }));
}

export async function getStandForEdit(id: number) {
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
    if (cents > 0) {
      await db
        .update(standVariantsTable)
        .set({
          priceCents: cents,
          monthlyCents,
          active: formData.get(`active_${vid}`) === "on",
        })
        .where(eq(standVariantsTable.id, vid));
    }
  }

  revalidatePath("/admin/stands");
  revalidatePath("/shop");
  revalidatePath("/");
}
