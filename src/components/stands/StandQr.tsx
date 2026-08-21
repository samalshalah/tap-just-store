"use client";

import { useMemo } from "react";
import qrcode from "qrcode-generator";

/**
 * A real QR code for a real URL.
 *
 * Never a placeholder. The proof a customer approves has to be the thing that
 * gets printed, and a stand-in square that later becomes a different code is
 * exactly how a box of unscannable acrylic happens. The customer can point a
 * phone at the screen right now and land on their own page — which is also the
 * best possible check that they pasted the right link.
 *
 * Error correction is M (~15%). Level L makes a sparser, prettier code, but
 * these get printed at small sizes onto a surface that will be wiped down
 * daily; M survives a scuff across a corner. H would be more robust still and
 * noticeably denser, which hurts on the small stand.
 *
 * The 4-module quiet zone is not decoration. The QR spec requires it, and a
 * code drawn flush to its own edge is measurably harder to acquire — the first
 * version of this had no margin and a camera could not read it at all. It is
 * built into the viewBox so it survives every size the code is rendered at,
 * including the print file.
 */
export function StandQr({
  url,
  className,
  title,
}: {
  url: string;
  className?: string;
  title?: string;
}) {
  const svg = useMemo(() => {
    if (!url) return null;
    try {
      // Type number 0 lets the library pick the smallest version that fits.
      const qr = qrcode(0, "M");
      qr.addData(url);
      qr.make();
      const count = qr.getModuleCount();
      const quiet = 4;

      // Drawn as one path of rectangles in a viewBox sized to the module grid,
      // so it scales to any size without resampling and stays crisp in print.
      let path = "";
      for (let row = 0; row < count; row++) {
        for (let col = 0; col < count; col++) {
          if (qr.isDark(row, col)) {
            path += `M${col + quiet} ${row + quiet}h1v1h-1z`;
          }
        }
      }
      return { path, size: count + quiet * 2 };
    } catch {
      // Only happens if the URL exceeds even the largest QR version.
      return null;
    }
  }, [url]);

  if (!svg) return null;

  return (
    <svg
      viewBox={`0 0 ${svg.size} ${svg.size}`}
      className={className}
      role="img"
      aria-label={title ?? `QR code linking to ${url}`}
      shapeRendering="crispEdges"
    >
      <rect width={svg.size} height={svg.size} fill="#ffffff" />
      <path d={svg.path} fill="#000000" />
    </svg>
  );
}
