"use client";

import { useState } from "react";
import { Upload, Loader2, X } from "lucide-react";
import { useAdminUpload, adminImageSrc } from "@/lib/use-admin-upload";

/**
 * An image slot inside a server-action form.
 *
 * The uploader is a client component but the form is a plain server action, so
 * the chosen path is carried in a hidden input. That is what makes it work
 * without turning the whole editor into a client component.
 *
 * A path box sits underneath: the file that ships in the repo (say
 * /images/stands/google-review-stand.webp) is not an upload, and there has to
 * be a way to point at one without re-uploading it.
 */
export function AdminMediaField({
  name,
  label,
  hint,
  defaultValue,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const { upload, uploading, error } = useAdminUpload();

  async function onFile(file: File) {
    const path = await upload(file);
    if (path) setValue(path);
  }

  return (
    <div className="rounded-lg border border-zinc-200 p-4">
      <input type="hidden" name={name} value={value} />

      <div className="mb-3">
        <span className="block text-sm font-medium text-zinc-700">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-zinc-500">{hint}</span>}
      </div>

      <div className="flex items-start gap-4">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-white">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={adminImageSrc(value)}
              alt=""
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[11px] text-zinc-400">
              No image
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            {/* Blue, not zinc: globals.css rewrites dark zinc backgrounds to
                light inside the admin shell, which left white text on a white
                button. */}
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700">
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {uploading ? "Uploading…" : value ? "Replace" : "Upload"}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onFile(file);
                  e.target.value = "";
                }}
              />
            </label>
            {value && (
              <button
                type="button"
                onClick={() => setValue("")}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-red-600 hover:border-red-300 hover:bg-red-50"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
          </div>

          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="/images/stands/example.webp"
            className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 font-mono text-xs text-zinc-700 focus:border-blue-500 focus:outline-none"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
