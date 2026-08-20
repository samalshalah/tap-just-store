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

const {
  computeCartTotals, tierForQuantity, nextTier,
  FREE_SHIPPING_CENTS, CUSTOM_QUOTE_QUANTITY,
} = loadTs("src/lib/pricing.ts");

const A5_STD = 3900, A5_BQR = 4900, A4_STD = 4900, A4_BQR = 6500;

test("no discount below three stands", () => {
  const t = computeCartTotals([{ priceCents: A5_STD, quantity: 2 }]);
  assert.equal(t.quantity, 2);
  assert.equal(t.subtotalCents, 7800);
  assert.equal(t.discountPercent, 0);
  assert.equal(t.totalCents, 7800);
  assert.equal(t.nextTier.minQuantity, 3);
});

test("mix-and-match: three different stands still qualify", () => {
  const t = computeCartTotals([
    { priceCents: A5_STD, quantity: 1 },
    { priceCents: A5_STD, quantity: 1 },
    { priceCents: A5_STD, quantity: 1 },
  ]);
  assert.equal(t.quantity, 3);
  assert.equal(t.discountPercent, 15);
  assert.equal(t.subtotalCents, 11700);
  assert.equal(t.totalCents, 9945); // $99.45
});

test("tiers escalate at 5 and 10 and do not stack", () => {
  assert.equal(tierForQuantity(4).discountPercent, 15);
  assert.equal(tierForQuantity(5).discountPercent, 20);
  assert.equal(tierForQuantity(9).discountPercent, 20);
  assert.equal(tierForQuantity(10).discountPercent, 25);
  assert.equal(tierForQuantity(50).discountPercent, 25);
  assert.equal(tierForQuantity(2), null);
});

test("mixed sizes and options price correctly at a tier", () => {
  const t = computeCartTotals([
    { priceCents: A4_BQR, quantity: 1 },
    { priceCents: A5_BQR, quantity: 2 },
    { priceCents: A5_STD, quantity: 2 },
  ]);
  assert.equal(t.quantity, 5);
  assert.equal(t.subtotalCents, 6500 + 9800 + 7800);
  assert.equal(t.discountPercent, 20);
  assert.equal(t.discountCents, Math.round(24100 * 0.2));
  assert.equal(t.totalCents, 24100 - Math.round(24100 * 0.2));
});

test("free shipping starts exactly at the branded A5 price", () => {
  assert.equal(computeCartTotals([{ priceCents: A5_STD, quantity: 1 }]).freeShipping, false);
  assert.equal(computeCartTotals([{ priceCents: A5_BQR, quantity: 1 }]).freeShipping, true);
  assert.equal(FREE_SHIPPING_CENTS, A5_BQR);
});

test("large orders are flagged for a quote", () => {
  assert.equal(computeCartTotals([{ priceCents: A5_STD, quantity: 24 }]).needsQuote, false);
  assert.equal(computeCartTotals([{ priceCents: A5_STD, quantity: CUSTOM_QUOTE_QUANTITY }]).needsQuote, true);
});

test("several multi-link stands share one subscription", () => {
  const t = computeCartTotals([
    { priceCents: A5_BQR, quantity: 3, monthlyCents: 999 },
    { priceCents: A4_BQR, quantity: 1, monthlyCents: 999 },
  ]);
  assert.equal(t.monthlyCents, 999, "one hosted page, one monthly charge");
});

test("nextTier stops once the top tier is reached", () => {
  assert.equal(nextTier(3).minQuantity, 5);
  assert.equal(nextTier(10), null);
});
