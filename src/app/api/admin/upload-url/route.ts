/**
 * /api/admin/upload-url — issue a signed URL the admin can PUT a file to.
 *
 * Gated by the same session cookie as the rest of /admin. Returns
 * { uploadUrl, objectPath }. The objectPath is what gets saved to the DB.
 */

import { NextResponse } from "next/server";
import { getUploadTarget, putUploadedObject, MAX_UPLOAD_BYTES } from "@/lib/storage";
import { isAdminSession } from "@/lib/admin-auth";


export async function POST() {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  try {
    const { uploadUrl, objectPath } = getUploadTarget();
    return NextResponse.json({ uploadUrl, objectPath });
  } catch (err) {
    console.error("[upload-url] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload URL failed" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  try {
    const url = new URL(req.url);
    const objectPath = url.searchParams.get("objectPath");
    if (!objectPath) {
      return NextResponse.json({ error: "Missing objectPath" }, { status: 400 });
    }
    // Refuse an oversized body before reading it into memory.
    const declared = Number(req.headers.get("content-length") ?? 0);
    if (declared > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `That file is too large. The limit is ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.` },
        { status: 413 }
      );
    }

    const body = await req.arrayBuffer();
    if (body.byteLength === 0) {
      return NextResponse.json({ error: "Missing upload body" }, { status: 400 });
    }

    // The type is decided from the bytes inside putUploadedObject; the
    // browser's Content-Type header is deliberately not passed on.
    await putUploadedObject({ objectPath, body });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("[upload] error:", message);
    // These messages are written for the person uploading, so they come back.
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
