/**
 * Resolve a product's display image URL. Product uploads win; if a product
 * does not have its own image yet, show its brand logo instead of bundled demo
 * product photos. A neutral placeholder is used only when the brand has no
 * uploaded logo.
 */

const PRODUCT_IMAGE_PLACEHOLDER = "/images/product-placeholder.svg";

type ProductImageInput = {
  imageUrl?: string | null;
  imageType?: string | null;
  brandLogoUrl?: string | null;
};

function storageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (
    path.startsWith("/images/") ||
    path.startsWith("/api/storage/") ||
    path.startsWith("http://") ||
    path.startsWith("https://")
  ) {
    return path;
  }
  return `/api/storage${path}`;
}

export function productImageUrl(product: ProductImageInput): string {
  return (
    storageUrl(product.imageUrl) ??
    storageUrl(product.brandLogoUrl) ??
    PRODUCT_IMAGE_PLACEHOLDER
  );
}

export function isProductLogoFallback(product: ProductImageInput): boolean {
  return !product.imageUrl && Boolean(product.brandLogoUrl);
}

export function productImageFitClass(
  product: ProductImageInput,
  logoPadding = "p-5"
): string {
  return isProductLogoFallback(product)
    ? `object-contain ${logoPadding}`
    : "object-cover object-center";
}

/**
 * Map from lowercase category name keywords to a bundled default image.
 * The images live in /public/images/categories/ and are served statically.
 * Replace these with real category photography when available.
 */
const CATEGORY_DEFAULTS: Array<[string[], string]> = [
  [["stand", "stands", "display", "displays"], "/images/categories/default.webp"],
  [["card", "cards", "tag", "tags", "keychain"], "/images/categories/default.webp"],
  [["accessory", "accessories", "mount", "mounts", "bracket", "brackets", "plate", "plates"], "/images/categories/default.webp"],
  [["kit", "kits", "bundle", "bundles", "pack", "packs"], "/images/categories/default.webp"],
];

function defaultCategoryImage(name: string): string | null {
  const lower = name.toLowerCase().trim();
  for (const [keywords, url] of CATEGORY_DEFAULTS) {
    if (keywords.some((kw) => lower.includes(kw))) return url;
  }
  return null;
}

export function categoryImageUrl(
  imageUrl: string | null,
  categoryName?: string
): string | null {
  const uploadedUrl = storageUrl(imageUrl);
  if (uploadedUrl) return uploadedUrl;
  if (categoryName) return defaultCategoryImage(categoryName);
  return null;
}

export function logoUrl(path: string | null | undefined): string | null {
  return storageUrl(path);
}

export function isStorageImageUrl(url: string | null | undefined): boolean {
  return typeof url === "string" && url.startsWith("/api/storage/");
}
