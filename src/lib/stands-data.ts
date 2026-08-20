/**
 * stands-data.ts — read side of the Tap Rater catalog.
 *
 * Rules enforced here rather than in the UI:
 *  - draft stands never leave this module for public callers
 *  - a stand is tagged into categories, never duplicated per category
 *  - copy comes from the stand's own destination, never a Google fallback
 */

import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { cache } from "react";
import { db } from "./db";
import {
  standsTable,
  standTypesTable,
  businessUsesTable,
  standBusinessUsesTable,
  standVariantsTable,
  volumeTiersTable,
} from "./schema";
import type { Stand, StandType, BusinessUse, StandVariant } from "./schema";
import { DEFAULT_VOLUME_TIERS, type VolumeTierRule } from "./pricing";

export interface StandListItem {
  stand: Stand;
  standType: StandType | null;
  variants: StandVariant[];
  /** Lowest active price across all variants — powers "from $39". */
  fromCents: number;
}

export interface StandDetail extends StandListItem {
  businessUses: BusinessUse[];
}

function lowestPrice(variants: StandVariant[]): number {
  const active = variants.filter((v) => v.active);
  if (active.length === 0) return 0;
  return Math.min(...active.map((v) => v.priceCents));
}

export const getStandTypes = cache(async (): Promise<StandType[]> => {
  try {
    return await db.select().from(standTypesTable).orderBy(asc(standTypesTable.sortOrder));
  } catch (err) {
    console.error("[stands] getStandTypes failed:", err);
    return [];
  }
});

export const getBusinessUses = cache(async (): Promise<BusinessUse[]> => {
  try {
    return await db.select().from(businessUsesTable).orderBy(asc(businessUsesTable.sortOrder));
  } catch (err) {
    console.error("[stands] getBusinessUses failed:", err);
    return [];
  }
});

export const getVolumeTiers = cache(async (): Promise<VolumeTierRule[]> => {
  try {
    const rows = await db.select().from(volumeTiersTable).orderBy(asc(volumeTiersTable.minQuantity));
    if (rows.length === 0) return DEFAULT_VOLUME_TIERS;
    return rows.map((r) => ({
      minQuantity: r.minQuantity,
      discountPercent: r.discountPercent,
      label: r.label,
    }));
  } catch (err) {
    console.error("[stands] getVolumeTiers failed:", err);
    return DEFAULT_VOLUME_TIERS;
  }
});

/** Every active stand, with its type and variants. Draft stands are excluded. */
export const getActiveStands = cache(async (): Promise<StandListItem[]> => {
  try {
    const rows = await db
      .select({ stand: standsTable, standType: standTypesTable })
      .from(standsTable)
      .leftJoin(standTypesTable, eq(standTypesTable.id, standsTable.standTypeId))
      .where(eq(standsTable.status, "active"))
      .orderBy(asc(standsTable.sortOrder));

    if (rows.length === 0) return [];

    const ids = rows.map((r) => r.stand.id);
    const variants = await db
      .select()
      .from(standVariantsTable)
      .where(inArray(standVariantsTable.standId, ids));

    return rows.map(({ stand, standType }) => {
      const mine = variants.filter((v) => v.standId === stand.id);
      return { stand, standType, variants: mine, fromCents: lowestPrice(mine) };
    });
  } catch (err) {
    console.error("[stands] getActiveStands failed:", err);
    return [];
  }
});

/** Active stands in one stand type. Tagging, not duplication. */
export async function getStandsByType(typeSlug: string): Promise<StandListItem[]> {
  const all = await getActiveStands();
  return all.filter((s) => s.standType?.slug === typeSlug);
}

/** Active stands tagged with one business use. */
export async function getStandsByBusinessUse(useSlug: string): Promise<StandListItem[]> {
  try {
    const [use] = await db
      .select()
      .from(businessUsesTable)
      .where(eq(businessUsesTable.slug, useSlug))
      .limit(1);
    if (!use) return [];

    const links = await db
      .select({ standId: standBusinessUsesTable.standId })
      .from(standBusinessUsesTable)
      .where(eq(standBusinessUsesTable.businessUseId, use.id));

    const ids = new Set(links.map((l) => l.standId));
    const all = await getActiveStands();
    return all.filter((s) => ids.has(s.stand.id));
  } catch (err) {
    console.error("[stands] getStandsByBusinessUse failed:", err);
    return [];
  }
}

/**
 * One stand by slug. Returns draft stands only when includeDraft is set,
 * so a public route can never leak one by forgetting to filter.
 */
export async function getStandBySlug(
  slug: string,
  { includeDraft = false }: { includeDraft?: boolean } = {}
): Promise<StandDetail | null> {
  try {
    const where = includeDraft
      ? eq(standsTable.slug, slug)
      : and(eq(standsTable.slug, slug), eq(standsTable.status, "active"));

    const [row] = await db
      .select({ stand: standsTable, standType: standTypesTable })
      .from(standsTable)
      .leftJoin(standTypesTable, eq(standTypesTable.id, standsTable.standTypeId))
      .where(where)
      .limit(1);

    if (!row) return null;

    const variants = await db
      .select()
      .from(standVariantsTable)
      .where(eq(standVariantsTable.standId, row.stand.id));

    const uses = await db
      .select({ use: businessUsesTable })
      .from(standBusinessUsesTable)
      .innerJoin(businessUsesTable, eq(businessUsesTable.id, standBusinessUsesTable.businessUseId))
      .where(eq(standBusinessUsesTable.standId, row.stand.id))
      .orderBy(asc(businessUsesTable.sortOrder));

    return {
      stand: row.stand,
      standType: row.standType,
      variants,
      fromCents: lowestPrice(variants),
      businessUses: uses.map((u) => u.use),
    };
  } catch (err) {
    console.error("[stands] getStandBySlug failed:", err);
    return null;
  }
}
