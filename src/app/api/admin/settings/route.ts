import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { isLocalPreviewMode } from "@/lib/preview";
import { setPreviewSettingSlice } from "@/lib/preview-data";
import type { SiteSettings } from "@/lib/types";
import { isAdminSession } from "@/lib/admin-auth";


const ALLOWED_KEYS = new Set([
  "store",
  "location",
  "contact",
  "theme_config",
  "seo",
  "store_hours",
  "checkout_config",
  "ordering",
  "faqs",
  "maintenance_mode",
  "maintenance_message",
  "integrations",
  "taxes",
  "about",
  "contact_page",
  "deals",
  "homepage_sections",
  "homepage_section_order",
  "location_page",
  "pdp_config",
  "shop_config",
]);

function invalidateLocalSettingsCache() {
  (
    globalThis as typeof globalThis & { __jc_settingsCache?: unknown }
  ).__jc_settingsCache = undefined;
}

function getErrorDetail(err: unknown): string {
  if (!(err instanceof Error)) return "Unknown error";

  const cause = (err as Error & { cause?: unknown }).cause;
  if (cause instanceof Error && cause.message) {
    return cause.message.slice(0, 500);
  }

  return err.message.slice(0, 500);
}

export async function POST(req: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  try {
    const body = (await req.json().catch(() => null)) as {
      key?: keyof SiteSettings;
      value?: SiteSettings[keyof SiteSettings];
    } | null;

    if (!body?.key || !ALLOWED_KEYS.has(String(body.key))) {
      return NextResponse.json({ error: "Invalid setting key" }, { status: 400 });
    }

    if (isLocalPreviewMode()) {
      setPreviewSettingSlice(body.key, body.value);
      invalidateLocalSettingsCache();
      revalidatePath("/", "layout");
      return NextResponse.json({ ok: true });
    }

    const [{ db, siteSettingsTable }, { invalidateSettings }] = await Promise.all([
      import("@/lib/db"),
      import("@/lib/settings"),
    ]);

    const json = JSON.stringify(body.value);
    const key = body.key as string;

    const existing = await db
      .select({ key: siteSettingsTable.key })
      .from(siteSettingsTable)
      .where(eq(siteSettingsTable.key, key))
      .limit(1);

    if (existing.length > 0) {
      await db.execute(sql`
        UPDATE site_settings
        SET value = ${json}
        WHERE key = ${key}
      `);
    } else {
      await db.execute(sql`
        INSERT INTO site_settings (key, value)
        VALUES (${key}, ${json})
      `);
    }

    invalidateSettings();
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (err) {
    const detail = getErrorDetail(err);
    console.error("[admin/settings] save failed:", detail);
    return NextResponse.json({ error: "Settings save failed" }, { status: 500 });
  }
}
