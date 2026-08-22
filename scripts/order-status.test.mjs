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
  ORDER_STATUSES, canTransition, nextStatuses, transitionError,
  trackingUrl, isOrderStatus, isOpen, OPEN_STATUSES,
  STATUS_LABELS, STATUS_HELP, STATUS_COLORS,
} = loadTs("src/lib/order-status.ts");

const ok = { hasTracking: true };
const noTracking = { hasTracking: false };

test("a normal order walks new -> production -> shipped -> delivered", () => {
  assert.ok(canTransition("new", "in_production"));
  assert.ok(canTransition("in_production", "shipped"));
  assert.ok(canTransition("shipped", "delivered"));
});

test("delivered is terminal — the record cannot be reopened", () => {
  assert.deepEqual(nextStatuses("delivered"), []);
  for (const s of ORDER_STATUSES) {
    if (s === "delivered") continue;
    assert.equal(canTransition("delivered", s), false, `delivered -> ${s}`);
  }
  assert.match(
    transitionError("delivered", "in_production", ok),
    /already delivered/
  );
});

test("cancelled is terminal", () => {
  assert.deepEqual(nextStatuses("cancelled"), []);
  assert.match(transitionError("cancelled", "new", ok), /cannot be reopened/);
});

test("a shipped order cannot be cancelled — that is a refund", () => {
  assert.equal(canTransition("shipped", "cancelled"), false);
  assert.match(transitionError("shipped", "cancelled", ok), /Refund it instead/);
});

test("an order cannot be marked shipped without a tracking number", () => {
  // Otherwise the shipped email has nothing to link to and the customer
  // emails within a day asking where it is.
  assert.match(
    transitionError("in_production", "shipped", noTracking),
    /Add a tracking number/
  );
  assert.equal(transitionError("in_production", "shipped", ok), null);
});

test("shipped can be walked back to production, because mis-clicks happen", () => {
  // Deliberate: if the only escape from a wrong click is living with it,
  // people stop using the statuses honestly.
  assert.ok(canTransition("shipped", "in_production"));
});

test("an order cannot skip production and go straight to shipped", () => {
  assert.equal(canTransition("new", "shipped"), false);
  assert.match(transitionError("new", "shipped", ok), /cannot go from New to Shipped/);
});

test("setting a status to itself is never an error", () => {
  for (const s of ORDER_STATUSES) {
    assert.equal(transitionError(s, s, noTracking), null, s);
  }
});

test("only new and in_production count as open work", () => {
  assert.deepEqual([...OPEN_STATUSES], ["new", "in_production"]);
  assert.ok(isOpen("new"));
  assert.ok(isOpen("in_production"));
  for (const s of ["shipped", "delivered", "cancelled"]) {
    assert.equal(isOpen(s), false, s);
  }
});

test("every status has a label, help text and colour", () => {
  for (const s of ORDER_STATUSES) {
    assert.ok(STATUS_LABELS[s], `${s} has no label`);
    assert.ok(STATUS_HELP[s], `${s} has no help text`);
    assert.ok(STATUS_COLORS[s], `${s} has no colour`);
  }
});

test("unknown statuses are rejected rather than coerced", () => {
  // The old pickup vocabulary must not sneak back in through a stale request.
  for (const old of ["pending", "ready", "completed", "", "DELIVERED"]) {
    assert.equal(isOrderStatus(old), false, old);
  }
});

test("a tracking link is only built when the carrier is known", () => {
  assert.equal(
    trackingUrl("usps", "9400111899223197428490"),
    "https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223197428490"
  );
  assert.ok(trackingUrl("ups", "1Z999")?.includes("ups.com"));
  assert.ok(trackingUrl("fedex", "7712")?.includes("fedex.com"));
  // Never guessed from the number's shape — a wrong link sends the customer
  // to a page saying their parcel does not exist.
  assert.equal(trackingUrl(null, "9400111899223197428490"), null);
  assert.equal(trackingUrl("royalmail", "AB123"), null);
  assert.equal(trackingUrl("usps", ""), null);
  assert.equal(trackingUrl("usps", "   "), null);
});

test("tracking numbers are URL-encoded", () => {
  assert.ok(trackingUrl("usps", "A B&C")?.includes("A%20B%26C"));
});
