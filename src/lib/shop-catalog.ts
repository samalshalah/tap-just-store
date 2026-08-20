import "server-only";
import {
  getActiveStands,
  getStandTypes,
  getBusinessUses,
  getStandsByBusinessUse,
  getBusinessUseCounts,
  getUseNamesByStandId,
  catalogLoadFailed,
} from "./stands-data";
import { applyShopFilters, type ShopQuery, type ShopResult } from "./shop-filter";

export interface CatalogFacet {
  slug: string;
  name: string;
  count: number;
}

export interface CatalogView {
  results: ShopResult[];
  typeOptions: CatalogFacet[];
  useOptions: CatalogFacet[];
  typeName: string | null;
  useName: string | null;
  /** True when a read failed, so the page can say so instead of showing nothing. */
  loadFailed: boolean;
}

/**
 * One place that turns a shop query into a grid.
 *
 * The catalog page and every landing page go through this, so a stand can
 * never appear on one and not the other because of a filter written twice.
 */
export async function getCatalogView(query: ShopQuery): Promise<CatalogView> {
  const [allStands, standTypes, businessUses, useCounts, useNames] =
    await Promise.all([
      getActiveStands(),
      getStandTypes(),
      getBusinessUses(),
      getBusinessUseCounts(),
      getUseNamesByStandId(),
    ]);

  // Counts come from the tagged relationships — a stand is never duplicated.
  const typeOptions = standTypes
    .map((t) => ({
      slug: t.slug,
      name: t.name,
      count: allStands.filter((s) => s.standType?.slug === t.slug).length,
    }))
    .filter((t) => t.count > 0);

  const useOptions = businessUses
    .map((u) => ({ slug: u.slug, name: u.name, count: useCounts[u.slug] ?? 0 }))
    .filter((u) => u.count > 0);

  let scoped = allStands;
  if (query.use) {
    scoped = await getStandsByBusinessUse(query.use);
  } else if (query.type) {
    scoped = scoped.filter((s) => s.standType?.slug === query.type);
  }

  return {
    results: applyShopFilters(scoped, query, useNames),
    typeOptions,
    useOptions,
    typeName: standTypes.find((t) => t.slug === query.type)?.name ?? null,
    useName: businessUses.find((u) => u.slug === query.use)?.name ?? null,
    loadFailed: catalogLoadFailed(),
  };
}
