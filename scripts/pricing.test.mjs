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

// ---------------------------------------------------------------- shipping
// Added with Phase 03. Postage is charged on the discounted total, not the
// subtotal, because "free shipping over $49" has to be true of the number the
// customer is watching.

const { shippingCentsFor, SHIPPING_FLAT_CENTS } = loadTs("src/lib/pricing.ts");

test("postage is flat below the threshold and free at or above it", () => {
  assert.equal(shippingCentsFor(0), SHIPPING_FLAT_CENTS);
  assert.equal(shippingCentsFor(3900), SHIPPING_FLAT_CENTS);
  assert.equal(shippingCentsFor(FREE_SHIPPING_CENTS - 1), SHIPPING_FLAT_CENTS);
  assert.equal(shippingCentsFor(FREE_SHIPPING_CENTS), 0);
  assert.equal(shippingCentsFor(20000), 0);
});

test("one Small stand pays postage; adding branding to it does not", () => {
  // This is the whole point of where the threshold sits.
  assert.equal(shippingCentsFor(3900), 495, "a $39 Standard Small pays postage");
  assert.equal(shippingCentsFor(4900), 0, "a $49 branded Small ships free");
});

test("a volume discount can push an order back under the threshold", () => {
  // Three $39 stands are $117, less 15% is $99.45 — still free. But the rule
  // must be applied to the discounted figure, not the subtotal, or a
  // discounted order would be quoted free shipping it did not earn.
  const totals = computeCartTotals([{ priceCents: 3900, quantity: 3 }]);
  assert.equal(totals.discountPercent, 15);
  assert.equal(totals.totalCents, 9945);
  assert.equal(shippingCentsFor(totals.totalCents), 0);

  // Two $19 hypothetical stands: $38, no tier, under the threshold.
  const small = computeCartTotals([{ priceCents: 1900, quantity: 2 }]);
  assert.equal(small.discountPercent, 0);
  assert.equal(shippingCentsFor(small.totalCents), SHIPPING_FLAT_CENTS);
});
