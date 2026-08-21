"use client";

import { Upload, X, Loader2 } from "lucide-react";
import { useAdminUpload, adminImageSrc } from "@/lib/use-admin-upload";

interface Props {
  value: string;
  onChange: (newPath: string) => void;
}

export function AdminImageUploader({ value, onChange }: Props) {
  const { upload, uploading, error } = useAdminUpload();

  const handleFile = async (file: File) => {
    const path = await upload(file);
    if (path) onChange(path);
  };

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      {value ? (
        <div className="flex items-start gap-3">
          <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-white border border-zinc-200">
            <img
              src={adminImageSrc(value)}
              alt="preview"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-zinc-400 break-all max-w-[300px]">
              {value}
            </p>
            <div className="flex gap-2">
              <label className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm cursor-pointer transition-colors">
                Replace
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={onInput}
                  disabled={uploading}
                />
              </label>
              <button
                type="button"
                onClick={() => onChange("")}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-400 hover:bg-red-950/40 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <label className="block w-full border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center cursor-pointer hover:border-zinc-600 hover:bg-zinc-900/50 transition-colors">
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={onInput}
            disabled={uploading}
          />
          {uploading ? (
            <Loader2 className="w-6 h-6 mx-auto text-zinc-400 animate-spin" />
          ) : (
            <Upload className="w-6 h-6 mx-auto text-zinc-500" />
          )}
          <p className="text-sm text-zinc-400 mt-2">
            {uploading ? "Uploading..." : "Click to upload an image"}
          </p>
        </label>
      )}
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  );
}
