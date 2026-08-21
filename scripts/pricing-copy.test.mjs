/**
 * The prices quoted in prose must match the prices actually charged.
 *
 * This exists because they diverged: the variant grid charged $65 for a
 * branded Large against a $49 standard — a $16 uplift — while the homepage,
 * the terms page and the landing FAQ all said "$15 more". The pricing table
 * computes its uplift from the real numbers, so the site openly contradicted
 * itself on two pages a customer reads before paying.
 *
 * Prose cannot be generated here without making the copy unreadable, so it is
 * guarded instead: change a price in the grid without changing the sentence
 * and this fails.
 */
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import ts from "typescript";

function loadTs(path) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  Function("module", "exports", "require", js)(mod, mod.exports, () => ({}));
  return mod.exports;
}

const { DEFAULT_VARIANT_GRID } = loadTs("src/lib/stand-variant-grid.ts");

function cents(size, option) {
  const row = DEFAULT_VARIANT_GRID.find(
    (r) => r.size === size && r.optionCode === option
  );
  assert.ok(row, `no ${size}/${option} row in the variant grid`);
  return row.priceCents;
}

const SMALL_STANDARD = cents("a5", "standard_direct");
const SMALL_BRANDED = cents("a5", "branded_qr_direct");
const LARGE_STANDARD = cents("a4", "standard_direct");
const LARGE_BRANDED = cents("a4", "branded_qr_direct");

const smallUplift = SMALL_BRANDED - SMALL_STANDARD;
const largeUplift = LARGE_BRANDED - LARGE_STANDARD;

const dollars = (c) => `$${c / 100}`;

test("the branded uplift is a whole number of dollars", () => {
  assert.equal(smallUplift % 100, 0, "Small uplift has stray cents");
  assert.equal(largeUplift % 100, 0, "Large uplift has stray cents");
});

test("the landing FAQ quotes the uplift the grid actually charges", () => {
  const copy = readFileSync(new URL("../src/lib/landing-copy.ts", import.meta.url), "utf8");
  const faq = copy.match(/is \$\d+ more on the Small and \$\d+ more on the Large/);
  assert.ok(faq, "the pricing FAQ sentence has been reworded — update this test");
  assert.equal(
    faq[0],
    `is ${dollars(smallUplift)} more on the Small and ${dollars(largeUplift)} more on the Large`
  );
});

test("the landing FAQ quotes the standard prices the grid actually charges", () => {
  const copy = readFileSync(new URL("../src/lib/landing-copy.ts", import.meta.url), "utf8");
  assert.ok(
    copy.includes(`is ${dollars(SMALL_STANDARD)} and the Large`),
    `the FAQ no longer says the Small is ${dollars(SMALL_STANDARD)}`
  );
  assert.ok(
    copy.includes(`is ${dollars(LARGE_STANDARD)} for the Standard finish`),
    `the FAQ no longer says the Large is ${dollars(LARGE_STANDARD)}`
  );
});

test("the terms page quotes the same four numbers", () => {
  const terms = readFileSync(
    new URL("../src/app/(storefront)/terms/page.tsx", import.meta.url),
    "utf8"
  );
  for (const [label, value] of [
    ["Small standard", SMALL_STANDARD],
    ["Large standard", LARGE_STANDARD],
    ["Small uplift", smallUplift],
    ["Large uplift", largeUplift],
  ]) {
    assert.ok(
      terms.includes(`formatMoney(${value})`),
      `terms page never shows the ${label} (${dollars(value)})`
    );
  }
});
