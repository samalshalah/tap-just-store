"use client";

import { useState } from "react";

/**
 * Uploading a file from the admin.
 *
 * Two steps: ask the server for a signed target, then PUT the bytes straight
 * to R2 so the file never travels through a server action. Returns the object
 * path to store in the database.
 *
 * Extracted so the dark uploader on the store-settings pages and the light one
 * on the stand editor share exactly one implementation — an upload that works
 * in one place and not the other is a bug waiting to happen.
 */
export function useAdminUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File): Promise<string | null> {
    setError(null);
    setUploading(true);
    try {
      const tokenRes = await fetch("/api/admin/upload-url", { method: "POST" });
      if (!tokenRes.ok) {
        const body = await tokenRes.json().catch(() => ({}));
        throw new Error(body.error || "Could not get an upload URL");
      }
      const { uploadUrl, objectPath } = await tokenRes.json();

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error(`Upload failed (HTTP ${putRes.status})`);

      return objectPath as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      return null;
    } finally {
      setUploading(false);
    }
  }

  return { upload, uploading, error };
}

/** Turns a stored object path into something an <img> can load. */
export function adminImageSrc(value: string): string {
  if (
    value.startsWith("/images/") ||
    value.startsWith("/api/storage/") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }
  return `/api/storage${value}`;
}
