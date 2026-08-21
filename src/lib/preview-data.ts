import "server-only";
import type { SiteSettings } from "./types";

/**
 * The in-memory store behind LOCAL_PREVIEW_MODE.
 *
 * It used to hold a fake catalogue as well, so the white-label template could
 * be demoed with no database at all. The catalogue is real now and lives in
 * Postgres, so all that is left is settings: preview mode lets someone open the
 * admin and click through the settings screens without a connection string.
 * Nothing here survives a restart, which is the point.
 */
type PreviewStore = {
  settings: SiteSettings;
};

declare global {
  var __jc_previewStore: PreviewStore | undefined;
}

function store(): PreviewStore {
  if (!globalThis.__jc_previewStore) {
    globalThis.__jc_previewStore = { settings: {} };
  }
  return globalThis.__jc_previewStore;
}

export function getPreviewSettings(): SiteSettings {
  return store().settings;
}

export function setPreviewSettingSlice<K extends keyof SiteSettings>(
  key: K,
  value: SiteSettings[K]
): void {
  const s = store();
  s.settings = { ...s.settings, [key]: value };
}
