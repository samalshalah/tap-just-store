import { NextRequest } from "next/server";
import { putCustomerLogo, MAX_LOGO_BYTES } from "@/lib/storage";
import { clientKey, rateLimit, tooManyRequests } from "@/lib/rate-limit";

/**
 * Logo upload for a customer configuring a branded stand.
 *
 * This is the only unauthenticated write endpoint on the site, so it is worth
 * being explicit about what stops it becoming free file hosting:
 *
 *  - Rate limited per IP, twice. A short burst limit stops a script hammering
 *    it, and an hourly limit stops a slow drip filling the bucket.
 *  - Capped at 5 MB, checked against Content-Length before the body is read
 *    so an oversized upload is refused rather than buffered.
 *  - The stored type is decided by the file's magic bytes, never the declared
 *    Content-Type, and only PNG and JPEG pass. SVG is refused: these are
 *    served back from our own origin, and an SVG can carry script.
 *  - The stored path is a random UUID, so one customer cannot guess another's.
 *
 * What it deliberately does not do is tie the upload to an order. At this
 * point in the flow there is no order and no account — the customer is still
 * deciding. The path is a claim check; the order carries it at checkout.
 */
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const key = clientKey(req);

  const burst = rateLimit(`setup-logo:burst:${key}`, 6, 60_000);
  if (!burst.ok) {
    return tooManyRequests(burst.retryAfter, "Too many uploads. Wait a moment and try again.");
  }
  const hourly = rateLimit(`setup-logo:hour:${key}`, 40, 60 * 60_000);
  if (!hourly.ok) {
    return tooManyRequests(hourly.retryAfter, "Upload limit reached. Try again later.");
  }

  // Refuse on the declared length before reading, so a large body is never
  // buffered just to be thrown away.
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_LOGO_BYTES) {
    return Response.json(
      { error: `That file is too large. The limit is ${MAX_LOGO_BYTES / 1024 / 1024} MB.` },
      { status: 413 }
    );
  }

  let body: ArrayBuffer;
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return Response.json({ error: "No file was uploaded." }, { status: 400 });
    }
    body = await file.arrayBuffer();
  } catch {
    return Response.json({ error: "That upload could not be read." }, { status: 400 });
  }

  try {
    const { objectPath } = await putCustomerLogo(body);
    return Response.json({ logoPath: objectPath, url: `/api/storage${objectPath}` });
  } catch (err) {
    // putCustomerLogo's messages are written for a shop owner, so they are
    // safe and useful to return as-is.
    const message =
      err instanceof Error ? err.message : "That file could not be saved.";
    console.error("[setup/logo] upload failed:", err);
    return Response.json({ error: message }, { status: 400 });
  }
}
