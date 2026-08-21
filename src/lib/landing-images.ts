/**
 * landing-images.ts — the two shapes every landing photo is stored in.
 *
 * A page keeps one value in the database, `hero_image_url`, pointing at the
 * 2:1 file used by the shop-by-use card. The two-column hero needs a taller
 * frame, so the import script writes a 3:2 twin alongside it with a `-hero`
 * suffix and this derives the name.
 *
 * They are written together and never separately, which is what makes deriving
 * the name safe. If you ever point a page at a hand-placed file, put the twin
 * next to it or the hero will 404 its image.
 */

/** `/images/landing/legal.jpg` → `/images/landing/legal-hero.jpg` */
export function wideVariant(url: string | null | undefined): string | null {
  if (!url) return null;
  const dot = url.lastIndexOf(".");
  if (dot <= url.lastIndexOf("/")) return url; // no extension — leave it alone
  return `${url.slice(0, dot)}-hero${url.slice(dot)}`;
}
