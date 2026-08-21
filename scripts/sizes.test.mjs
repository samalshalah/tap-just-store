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

const { STAND_SIZES, sizeLabel, sizeLabelWithDims, standSize, isSizeKey } =
  loadTs("src/lib/sizes.ts");

test("the paper standards convert to the right inches", () => {
  // A5 is 148 x 210 mm; A4 is 210 x 297 mm.
  assert.equal(STAND_SIZES.a5.inches, '5.8" × 8.3"');
  assert.equal(STAND_SIZES.a4.inches, '8.3" × 11.7"');
  const round = (mm) => Math.round((mm / 25.4) * 10) / 10;
  assert.equal(round(148), 5.8);
  assert.equal(round(210), 8.3);
  assert.equal(round(297), 11.7);
});

test("centimetres are rounded the way a person would say them", () => {
  assert.equal(STAND_SIZES.a5.centimetres, "15 × 21 cm");
  assert.equal(STAND_SIZES.a4.centimetres, "21 × 30 cm");
});

test("a database key maps to a plain-English label", () => {
  assert.equal(sizeLabel("a5"), "Small");
  assert.equal(sizeLabel("a4"), "Large");
});

test("an unknown size degrades to the raw key rather than throwing", () => {
  assert.equal(sizeLabel("a3"), "A3");
  assert.equal(standSize("a3"), null);
  assert.equal(isSizeKey("a3"), false);
});

test("the long form carries the dimension for order lines", () => {
  assert.equal(sizeLabelWithDims("a5"), 'Small (5.8" × 8.3")');
  assert.equal(sizeLabelWithDims("a4"), 'Large (8.3" × 11.7")');
});

test("every size keeps its paper name for the print templates", () => {
  assert.equal(STAND_SIZES.a5.paperName, "A5");
  assert.equal(STAND_SIZES.a4.paperName, "A4");
});

test("every size the shop can filter on has a label", () => {
  // shop-filter.ts owns the keys; sizes.ts owns how they read. If a size is
  // ever added to one and not the other, the filter chip would render "A3".
  const { SIZES } = loadTs("src/lib/shop-filter.ts");
  for (const key of SIZES) {
    assert.ok(standSize(key), `shop-filter offers "${key}" but sizes.ts has no entry`);
  }
  assert.deepEqual([...SIZES].sort(), Object.keys(STAND_SIZES).sort());
});
