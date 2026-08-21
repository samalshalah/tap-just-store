/**
 * storage.ts - Cloudflare R2-backed media storage.
 *
 * The app keeps its existing URL conventions:
 *   - /objects/<entity>     - admin-uploaded images
 *   - /public/<filename>    - public media assets
 *
 * Both are proxied through `/api/storage/[...path]/route.ts`, which accepts
 * the legacy paths above with `/api/storage` prefixed.
 */

import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { randomUUID } from "crypto";
import { isLocalPreviewMode } from "@/lib/preview";

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
  }
}

/**
 * Whether to write to the on-disk stand-in instead of R2.
 *
 * It used to be LOCAL_PREVIEW_MODE alone, which meant `next dev` without that
 * flag tried to reach an R2 binding that does not exist there and every upload
 * threw. Falling back whenever the binding is genuinely absent makes the
 * upload paths testable locally, and in production the binding is always
 * present so nothing changes.
 */
function useLocalStorage(): boolean {
  if (isLocalPreviewMode()) return true;
  try {
    const env = getCloudflareContext().env as CloudflareEnv;
    return !env?.MEDIA_BUCKET;
  } catch {
    return true;
  }
}

function mediaBucket(): R2Bucket {
  const env = getCloudflareContext().env as CloudflareEnv;
  if (!env.MEDIA_BUCKET) {
    throw new Error("MEDIA_BUCKET R2 binding is not configured.");
  }
  return env.MEDIA_BUCKET;
}

function normalizeKey(path: string): string {
  return path.replace(/^\/+/, "");
}

function contentTypeFromKey(key: string): string {
  const lower = key.toLowerCase();
  if (lower.endsWith(".avif")) return "image/avif";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

async function localObjectPath(key: string) {
  const [{ default: path }] = await Promise.all([import("path")]);
  const base = path.resolve(process.cwd(), ".local-r2", "media");
  const target = path.resolve(base, normalizeKey(key));
  if (!target.startsWith(base + path.sep)) {
    throw new Error("Invalid local storage path.");
  }
  return { base, target, metaTarget: `${target}.meta.json` };
}

async function getLocalObject(key: string): Promise<R2ObjectBody | null> {
  const [{ readFile, stat }] = await Promise.all([import("fs/promises")]);
  const paths = await localObjectPath(key);
  try {
    const [bytes, info] = await Promise.all([
      readFile(paths.target),
      stat(paths.target),
    ]);
    let contentType = contentTypeFromKey(key);
    try {
      const meta = JSON.parse(await readFile(paths.metaTarget, "utf8")) as {
        contentType?: string;
      };
      contentType = meta.contentType || contentType;
    } catch {
      // Metadata is optional for local preview files.
    }
    return {
      body: new Response(bytes).body!,
      httpMetadata: { contentType },
      size: info.size,
    };
  } catch {
    return null;
  }
}

async function putLocalObject({
  key,
  body,
  contentType,
}: {
  key: string;
  body: ReadableStream | ArrayBuffer;
  contentType?: string | null;
}): Promise<void> {
  const [{ mkdir, writeFile }, { default: path }] = await Promise.all([
    import("fs/promises"),
    import("path"),
  ]);
  const paths = await localObjectPath(key);
  await mkdir(path.dirname(paths.target), { recursive: true });
  const bytes =
    body instanceof ArrayBuffer ? body : await new Response(body).arrayBuffer();
  await writeFile(paths.target, Buffer.from(bytes));
  await writeFile(
    paths.metaTarget,
    JSON.stringify({ contentType: contentType || contentTypeFromKey(key) })
  );
}

export async function getEntityObject(entityPath: string): Promise<R2ObjectBody> {
  const norm = entityPath.startsWith("/") ? entityPath : `/${entityPath}`;
  if (!norm.startsWith("/objects/")) throw new ObjectNotFoundError();
  if (useLocalStorage()) {
    const object = await getLocalObject(normalizeKey(norm));
    if (!object) throw new ObjectNotFoundError();
    return object;
  }
  const object = await mediaBucket().get(normalizeKey(norm));
  if (!object) throw new ObjectNotFoundError();
  return object;
}

export async function findPublicObject(filename: string): Promise<R2ObjectBody | null> {
  if (useLocalStorage()) {
    return getLocalObject(`public/${normalizeKey(filename)}`);
  }
  return mediaBucket().get(`public/${normalizeKey(filename)}`);
}

export function streamObject(
  object: R2ObjectBody,
  { isPublic, cacheTtlSec = 3600 }: { isPublic?: boolean; cacheTtlSec?: number } = {},
): Response {
  const headers: Record<string, string> = {
    "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
    // Belt and braces alongside the magic-byte check on the way in: even if
    // something non-image reached the bucket, the browser will not sniff it
    // into something executable, and it cannot be framed.
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; sandbox",
    "Cache-Control": isPublic
      ? `public, max-age=${cacheTtlSec}, stale-while-revalidate=86400`
      : `private, max-age=${cacheTtlSec}`,
  };
  if (object.size) headers["Content-Length"] = String(object.size);
  return new Response(object.body, { headers });
}

export function getUploadTarget(): { uploadUrl: string; objectPath: string } {
  const objectId = randomUUID();
  const objectPath = `/objects/uploads/${objectId}`;
  return {
    uploadUrl: `/api/admin/upload-url?objectPath=${encodeURIComponent(objectPath)}`,
    objectPath,
  };
}

/** 8 MB. Well past a product photo, well short of anything worth abusing. */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/**
 * Image types we will store, and the magic bytes that prove it.
 *
 * The browser's Content-Type is a claim, not a fact. Uploads are served back
 * from our own origin, so an HTML or SVG file accepted here and echoed with
 * its declared type would execute as same-origin script — session cookie and
 * all. The type is decided by looking at the bytes, and SVG is not on the list
 * precisely because it can carry script.
 */
const MAGIC: { type: string; ext: string; test: (b: Uint8Array) => boolean }[] = [
  {
    type: "image/jpeg",
    ext: "jpg",
    test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    type: "image/png",
    ext: "png",
    test: (b) =>
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    type: "image/gif",
    ext: "gif",
    test: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46,
  },
  {
    type: "image/webp",
    ext: "webp",
    test: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
  {
    type: "image/avif",
    ext: "avif",
    test: (b) =>
      b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70 &&
      b[8] === 0x61 && b[9] === 0x76 && b[10] === 0x69 && b[11] === 0x66,
  },
];

/** Returns the real image type, or null when the bytes are not an image. */
export function sniffImageType(bytes: ArrayBuffer): string | null {
  const head = new Uint8Array(bytes.slice(0, 16));
  if (head.length < 12) return null;
  return MAGIC.find((m) => m.test(head))?.type ?? null;
}

/**
 * Logos uploaded by customers configuring a branded stand.
 *
 * Deliberately narrower than the admin path, because this endpoint has no
 * session behind it — anyone on the internet can reach it:
 *
 *  - 5 MB rather than 8. A logo is a logo.
 *  - PNG and JPEG only. GIF, WebP and AVIF are all fine to *serve*, but this
 *    file has to come out of a UV printer, and narrowing the input narrows
 *    what production has to cope with.
 *  - The type still comes from the bytes. SVG is refused here for the same
 *    reason as everywhere else: it can carry script, and we serve these back
 *    from our own origin.
 */
export const MAX_LOGO_BYTES = 5 * 1024 * 1024;

const LOGO_TYPES = new Set(["image/png", "image/jpeg"]);

export async function putCustomerLogo(
  body: ArrayBuffer | null
): Promise<{ objectPath: string; contentType: string }> {
  if (!body || body.byteLength === 0) throw new Error("No file was uploaded.");

  if (body.byteLength > MAX_LOGO_BYTES) {
    throw new Error(
      `That file is ${(body.byteLength / 1024 / 1024).toFixed(1)} MB. The limit is ${
        MAX_LOGO_BYTES / 1024 / 1024
      } MB.`
    );
  }

  const contentType = sniffImageType(body);
  if (!contentType || !LOGO_TYPES.has(contentType)) {
    throw new Error("Please upload a PNG or JPG image.");
  }

  const objectPath = `/objects/uploads/setup-logos/${randomUUID()}`;
  const key = normalizeKey(objectPath);

  if (useLocalStorage()) {
    await putLocalObject({ key, body, contentType });
  } else {
    await mediaBucket().put(key, body, { httpMetadata: { contentType } });
  }

  return { objectPath, contentType };
}

export async function putUploadedObject({
  objectPath,
  body,
}: {
  objectPath: string;
  body: ArrayBuffer | null;
}): Promise<void> {
  if (!body) throw new Error("Missing upload body.");

  if (body.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error(
      `That file is ${(body.byteLength / 1024 / 1024).toFixed(1)} MB. The limit is ${
        MAX_UPLOAD_BYTES / 1024 / 1024
      } MB.`
    );
  }

  // The stored type comes from the bytes, never from the request header.
  const contentType = sniffImageType(body);
  if (!contentType) {
    throw new Error(
      "That is not a JPEG, PNG, GIF, WebP or AVIF image. SVG is not accepted."
    );
  }

  const norm = objectPath.startsWith("/") ? objectPath : `/${objectPath}`;
  if (!norm.startsWith("/objects/uploads/")) {
    throw new Error("Invalid upload object path.");
  }
  const key = normalizeKey(norm);
  if (useLocalStorage()) {
    await putLocalObject({ key, body, contentType });
    return;
  }
  await mediaBucket().put(key, body, {
    httpMetadata: { contentType },
  });
}
