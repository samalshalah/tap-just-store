/**
 * Tests for the shop filter rules.
 *
 * Run: node --experimental-strip-types --no-warnings scripts/shop-filter.test.mjs
 *
 * The module under test is imported directly as TypeScript using Node's
 * built-in type stripping, so the tests exercise the exact shipped code.
 */
import test from "node:test";
import assert from "node:assert/strict";

const mod = await import("../src/lib/shop-filter.ts");

const {
  parseShopQuery,
  isFiltered,
  priceFor,
  matchesSearch,
  searchHaystack,
  applyShopFilters,
} = mod;

function stand(id, name, slug, sortOrder, typeName, variants) {
  return {
    stand: {
      id,
      name,
      slug,
      sortOrder,
      badge: "",
      destinationLabel: "",
      printedHeadline: "",
    },
    standType: typeName ? { name: typeName } : null,
    variants,
    fromCents: Math.min(...variants.map((v) => v.priceCents)),
  };
}

const v = (size, optionCode, priceCents, monthlyCents = 0, active = true) => ({
  size,
  optionCode,
  priceCents,
  monthlyCents,
  active,
});

const google = stand(1, "Google Review Stand", "google-review-stand", 1, "Review Stands", [
  v("a5", "standard_direct", 3900),
  v("a5", "branded_qr_direct", 4900),
  v("a4", "standard_direct", 4900),
  v("a4", "branded_qr_direct", 6500),
]);

const menu = stand(2, "View Menu Stand", "view-menu-stand", 2, "Menu & Info Stands", [
  v("a5", "standard_direct", 3900),
  v("a4", "standard_direct", 4900),
]);

const multi = stand(3, "Rate Your Experience Stand", "rate-your-experience-stand", 3, "Feedback Stands", [
  v("a5", "hosted_multilink", 4900, 999),
]);

test("unknown query values are ignored, not honoured", () => {
  const q = parseShopQuery({ size: "a3", option: "free", sort: "random", type: "review-stands" });
  assert.equal(q.size, null);
  assert.equal(q.option, null);
  assert.equal(q.sort, "featured");
  assert.equal(q.type, "review-stands");
  assert.equal(isFiltered(q), true);
});

test("an empty query is not treated as filtered", () => {
  assert.equal(isFiltered(parseShopQuery({})), false);
  assert.equal(isFiltered(parseShopQuery({ sort: "name" })), false);
});

test("the price shown follows the chosen size and finish", () => {
  assert.equal(priceFor(google, null, null), 3900);
  assert.equal(priceFor(google, "a4", null), 4900);
  assert.equal(priceFor(google, "a5", "branded_qr_direct"), 4900);
  assert.equal(priceFor(google, "a4", "branded_qr_direct"), 6500);
});

test("a stand with no matching variant drops out instead of showing zero", () => {
  assert.equal(priceFor(menu, "a5", "branded_qr_direct"), null);
  const out = applyShopFilters(
    [google, menu],
    { ...parseShopQuery({}), option: "branded_qr_direct" }
  );
  assert.deepEqual(out.map((r) => r.item.stand.id), [1]);
});

test("search matches business use names, not just the product name", () => {
  const hay = searchHaystack(menu, ["Restaurant / Food"]);
  assert.equal(matchesSearch(hay, "restaurant"), true);
  assert.equal(matchesSearch(hay, "menu"), true);
  assert.equal(matchesSearch(hay, "google"), false);
});

test("every search term must match, so two words narrow the result", () => {
  const hay = searchHaystack(google, ["Retail / Local Business"]);
  assert.equal(matchesSearch(hay, "google review"), true);
  assert.equal(matchesSearch(hay, "google menu"), false);
  assert.equal(matchesSearch(hay, ""), true);
});

test("sorting by price uses the filtered price, not the base price", () => {
  const q = { ...parseShopQuery({}), size: "a4", sort: "price-desc" };
  const out = applyShopFilters([google, menu], q);
  assert.deepEqual(out.map((r) => r.fromCents), [4900, 4900]);

  const q2 = { ...parseShopQuery({}), size: "a4", option: "branded_qr_direct", sort: "price-desc" };
  const out2 = applyShopFilters([google, menu], q2);
  assert.deepEqual(out2.map((r) => r.fromCents), [6500]);
});

test("featured order is the admin sort order", () => {
  const out = applyShopFilters([multi, menu, google], parseShopQuery({}));
  assert.deepEqual(out.map((r) => r.item.stand.id), [1, 2, 3]);
});

test("A to Z sorting is alphabetical", () => {
  const out = applyShopFilters([google, menu, multi], { ...parseShopQuery({}), sort: "name" });
  assert.deepEqual(
    out.map((r) => r.item.stand.name),
    ["Google Review Stand", "Rate Your Experience Stand", "View Menu Stand"]
  );
});

test("a multi-link stand carries its monthly cost through the grid", () => {
  const out = applyShopFilters([multi], parseShopQuery({}));
  assert.equal(out[0].fromCents, 4900);
  assert.equal(out[0].monthlyCents, 999);
});

test("inactive variants never set the displayed price", () => {
  const withDisabled = stand(9, "Test", "test", 9, null, [
    v("a5", "standard_direct", 100, 0, false),
    v("a5", "branded_qr_direct", 4900),
  ]);
  assert.equal(priceFor(withDisabled, null, null), 4900);
});
