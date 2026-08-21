import { getSiteSettings } from "@/lib/settings";
import {
  getActiveStands,
  getBusinessUseCounts,
  getBusinessUses,
  getStandTypes,
} from "@/lib/stands-data";
import { buildSeoHealthReport } from "@/lib/seo-health";
import { SeoForm } from "./SeoForm";
import { SeoHealthPanel } from "./SeoHealthPanel";

export const dynamic = "force-dynamic";

export default async function AdminStoreSeoPage() {
  const [settings, stands, types, uses, useCounts] = await Promise.all([
    getSiteSettings(),
    getActiveStands(),
    getStandTypes(),
    getBusinessUses(),
    getBusinessUseCounts(),
  ]);
  const report = buildSeoHealthReport({ settings, stands, types, uses, useCounts });
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">SEO</h1>
      <p className="text-zinc-400 mb-6">
        Search metadata, structured data, indexing, and owner-friendly launch checks.
      </p>
      <SeoHealthPanel report={report} />
      <SeoForm initial={settings.seo ?? {}} />
    </div>
  );
}
