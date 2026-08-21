"use server";

import { revalidatePath } from "next/cache";
import type { SiteSettings } from "@/lib/types";
import { isLocalPreviewMode } from "@/lib/preview";
import { setPreviewSettingSlice } from "@/lib/preview-data";
import { assertAdmin } from "@/lib/admin-auth";


function invalidateLocalSettingsCache() {
  (
    globalThis as typeof globalThis & { __jc_settingsCache?: unknown }
  ).__jc_settingsCache = undefined;
}

export async function saveSettingSlice<K extends keyof SiteSettings>(
  key: K,
  value: SiteSettings[K]
): Promise<{ ok: true }> {
  await assertAdmin();

  if (isLocalPreviewMode()) {
    setPreviewSettingSlice(key, value);
    invalidateLocalSettingsCache();
    revalidatePath("/", "layout");
    return { ok: true };
  }

  const [
    { db, siteSettingsTable },
    { invalidateSettings },
  ] = await Promise.all([import("@/lib/db"), import("@/lib/settings")]);

  const json = JSON.stringify(value);
  await db
    .insert(siteSettingsTable)
    .values({ key: key as string, value: json })
    .onConflictDoUpdate({
      target: siteSettingsTable.key,
      set: { value: json, updatedAt: new Date() },
    });

  invalidateSettings();
  revalidatePath("/", "layout");
  return { ok: true };
}
