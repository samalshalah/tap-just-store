#!/usr/bin/env python3
"""
Import landing-page photography.

Reads images named after a stand-type or business-use slug, crops them to the
hero card's 2:1 shape, writes an optimised JPG and WebP into
public/images/landing/, and emits the SQL that points the page at the file.

    python3 scripts/import-landing-photos.py ~/photos
    python3 scripts/import-landing-photos.py ~/photos --apply

Cropping: a 2:1 slice is taken from a taller photo, positioned by --anchor
(0 = top of the frame, 1 = bottom, default 0.4). Two things pull the right
answer around: the stand usually sits low in the frame, but people's heads sit
high and the top of the hero fades into the white card. 0.4 keeps faces intact
on a typical counter shot; drop it for a tall portrait-ish photo where heads
are being clipped.

Slugs that do not match a real page are reported and skipped, so a typo in a
filename never silently produces a page nobody can reach.
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is required:  pip install Pillow --break-system-packages")

REPO = Path(__file__).resolve().parent.parent
OUT_DIR = REPO / "public" / "images" / "landing"
WEB_DIR = "/images/landing"

TARGET_WIDTH = 1300
TARGET_RATIO = 1300 / 651  # matches the aspect box in LandingHero and UseCard
DEFAULT_ANCHOR = 0.4
SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}

USE_SLUGS = {
    "automotive",
    "restaurant-food",
    "hotel-travel",
    "healthcare-dental",
    "home-services",
    "legal",
    "real-estate",
    "beauty-salon-wellness",
    "ecommerce-online-brand",
    "retail-local-business",
}

TYPE_SLUGS = {
    "review-stands",
    "social-media-stands",
    "appointment-reservation-stands",
    "feedback-survey-stands",
    "menu-info-stands",
    "website-link-stands",
    "payment-tip-donation-stands",
    "loyalty-rewards-stands",
    "custom-stands",
}


def crop_to_ratio(im: Image.Image, anchor: float = DEFAULT_ANCHOR) -> Image.Image:
    """Centre horizontally; position the 2:1 slice vertically by anchor."""
    w, h = im.size
    want_h = round(w / TARGET_RATIO)

    if want_h <= h:
        top = round((h - want_h) * min(max(anchor, 0.0), 1.0))
        return im.crop((0, top, w, top + want_h))

    # Too wide for the ratio: narrow it instead, centred.
    want_w = round(h * TARGET_RATIO)
    left = (w - want_w) // 2
    return im.crop((left, 0, left + want_w, h))


def process(path: Path, anchor: float = DEFAULT_ANCHOR) -> tuple[str, str] | None:
    slug = path.stem.lower().strip()

    if slug in USE_SLUGS:
        table = "business_uses"
    elif slug in TYPE_SLUGS:
        table = "stand_types"
    else:
        print(f"  ! {path.name}: '{slug}' is not a page slug — skipped")
        return None

    im = Image.open(path).convert("RGB")
    if im.width < TARGET_WIDTH:
        print(f"  ! {path.name}: only {im.width}px wide, will look soft on a big screen")

    out = crop_to_ratio(im, anchor)
    height = round(TARGET_WIDTH / TARGET_RATIO)
    out = out.resize((TARGET_WIDTH, height), Image.LANCZOS)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    jpg = OUT_DIR / f"{slug}.jpg"
    webp = OUT_DIR / f"{slug}.webp"
    out.save(jpg, quality=88, optimize=True, progressive=True)
    out.save(webp, quality=84, method=6)

    kb = jpg.stat().st_size // 1024
    print(f"  ✓ {slug}  {im.size[0]}x{im.size[1]} → {TARGET_WIDTH}x{height}  ({kb} KB)")
    return table, slug


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("source", help="folder holding the photos")
    ap.add_argument(
        "--anchor",
        type=float,
        default=DEFAULT_ANCHOR,
        help="vertical crop position: 0 = top of frame, 1 = bottom (default 0.4)",
    )
    ap.add_argument(
        "--apply",
        action="store_true",
        help="run the SQL against DATABASE_URL instead of only printing it",
    )
    args = ap.parse_args()

    src = Path(os.path.expanduser(args.source))
    if not src.is_dir():
        sys.exit(f"Not a folder: {src}")

    files = sorted(p for p in src.iterdir() if p.suffix.lower() in SUFFIXES)
    if not files:
        sys.exit(f"No images in {src}")

    print(f"Reading {len(files)} image(s) from {src}\n")
    done = [r for r in (process(p, args.anchor) for p in files) if r]
    if not done:
        sys.exit("\nNothing imported.")

    statements = [
        f"UPDATE {table} SET hero_image_url = '{WEB_DIR}/{slug}.jpg' WHERE slug = '{slug}';"
        for table, slug in done
    ]
    sql = "\n".join(statements) + "\n"

    print(f"\n{len(done)} image(s) written to public/images/landing/\n")
    print(sql)

    if args.apply:
        url = os.environ.get("DATABASE_URL")
        if not url:
            sys.exit("DATABASE_URL is not set, so --apply has nothing to connect to.")
        subprocess.run(["psql", url, "-v", "ON_ERROR_STOP=1", "-c", sql], check=True)
        print("Applied.")
    else:
        print("Re-run with --apply to write these to the database.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
