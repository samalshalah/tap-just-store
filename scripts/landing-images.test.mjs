/**
 * Tests for the card/hero filename pairing.
 *
 * Run: node --experimental-strip-types --no-warnings scripts/landing-images.test.mjs
 *
 * The cache-busting stamp is the reason for most of these: swapping a photo
 * keeps the filename, so the stored URL carries `?v=...`, and the derived hero
 * name has to keep that stamp or the two shapes would cache independently.
 */
import test from "node:test";
import assert from "node:assert/strict";

const { wideVariant } = await import("../src/lib/landing-images.ts");

test("the hero name is the card name with -hero before the extension", () => {
  assert.equal(
    wideVariant("/images/landing/legal.jpg"),
    "/images/landing/legal-hero.jpg"
  );
  assert.equal(
    wideVariant("/images/landing/restaurant-food.webp"),
    "/images/landing/restaurant-food-hero.webp"
  );
});

test("a cache-busting stamp survives the derivation", () => {
  assert.equal(
    wideVariant("/images/landing/automotive.jpg?v=1783712017"),
    "/images/landing/automotive-hero.jpg?v=1783712017"
  );
});

test("nothing set means nothing derived, rather than a broken path", () => {
  assert.equal(wideVariant(null), null);
  assert.equal(wideVariant(undefined), null);
  assert.equal(wideVariant(""), null);
});

test("a path with no extension is returned untouched", () => {
  assert.equal(wideVariant("/images/landing/legal"), "/images/landing/legal");
});

test("a dot in a folder name is not mistaken for an extension", () => {
  assert.equal(
    wideVariant("/images/v1.2/legal"),
    "/images/v1.2/legal"
  );
});

test("an absolute URL works the same way", () => {
  assert.equal(
    wideVariant("https://cdn.example.com/landing/spa.jpg"),
    "https://cdn.example.com/landing/spa-hero.jpg"
  );
});
