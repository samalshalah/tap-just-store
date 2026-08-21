import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const cache = new Map();

function loadTs(path) {
  if (cache.has(path)) return cache.get(path);
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  const mod = { exports: {} };
  cache.set(path, mod.exports);
  const req = (id) => {
    if (id === "./money") return loadTs("src/lib/money.ts");
    return require(id);
  };
  Function("module", "exports", "require", js)(mod, mod.exports, req);
  cache.set(path, mod.exports);
  return mod.exports;
}

const { formatMoney, dollarsToCents, centsToInput } = loadTs("src/lib/money.ts");
const { computeBestDeal } = loadTs("src/lib/deal-engine.ts");

test("formatMoney renders cents as dollars with two decimals", () => {
  assert.equal(formatMoney(3999), "$39.99");
  assert.equal(formatMoney(4000), "$40.00");
  assert.equal(formatMoney(0), "$0.00");
  assert.equal(formatMoney(null), "$0.00");
  assert.equal(formatMoney(5), "$0.05");
});

test("dollarsToCents parses admin input without floating point drift", () => {
  assert.equal(dollarsToCents("39.99"), 3999);
  assert.equal(dollarsToCents(39.99), 3999);
  assert.equal(dollarsToCents("$1,000"), 100000);
  assert.equal(dollarsToCents(""), 0);
  assert.equal(dollarsToCents("0.10"), 10);
  assert.equal(dollarsToCents("abc"), 0);
});

test("centsToInput round-trips through dollarsToCents", () => {
  for (const cents of [1, 5, 99, 100, 3999, 15999, 100000]) {
    assert.equal(dollarsToCents(centsToInput(cents)), cents);
  }
});

test("deal thresholds authored in dollars apply against a cents subtotal", () => {
  const deals = [
    {
      id: "d1",
      type: "spend_threshold",
      enabled: true,
      name: "$10 off $100+",
      discountType: "flat",
      discountValue: 10,
      threshold: 100,
    },
  ];
  const items = [{ productId: 1, price: 5000, quantity: 2 }]; // $100.00
  const hit = computeBestDeal(deals, items, 10000);
  assert.ok(hit, "deal should apply at exactly the threshold");
  assert.equal(hit.discountAmount, 1000); // $10.00 in cents

  const miss = computeBestDeal(deals, [{ productId: 1, price: 5000, quantity: 1 }], 5000);
  assert.equal(miss, null, "deal should not apply below the threshold");
});
