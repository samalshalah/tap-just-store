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

const { validateDestination, urlFitsOnChip, MAX_DIRECT_URL_BYTES } =
  loadTs("src/lib/destination.ts");

test("a bare domain is assumed to be https", () => {
  const r = validateDestination("g.page/r/CabcDEF/review");
  assert.equal(r.ok, true);
  assert.equal(r.url, "https://g.page/r/CabcDEF/review");
});

test("http is upgraded, because the link is printed and has to age well", () => {
  const r = validateDestination("http://mysalon.com/book");
  assert.equal(r.ok, true);
  assert.equal(r.url, "https://mysalon.com/book");
});

test("empty input is rejected with a shop-owner message", () => {
  const r = validateDestination("   ");
  assert.equal(r.ok, false);
  assert.match(r.error, /Add the link/);
});

test("a non-URL is rejected", () => {
  for (const bad of ["hello world", "@@@", "::::"]) {
    assert.equal(validateDestination(bad).ok, false, `${bad} should be rejected`);
  }
});

test("a host with no dot is rejected", () => {
  const r = validateDestination("mysalon");
  assert.equal(r.ok, false);
  assert.match(r.error, /missing a domain/);
});

test("addresses that only work on the owner's network are rejected", () => {
  for (const bad of [
    "http://localhost:3000/review",
    "http://127.0.0.1/x",
    "http://192.168.1.50/menu",
    "http://10.0.0.4/menu",
    "http://172.16.4.4/menu",
    "http://printer.local/x",
    "https://example.com/review",
  ]) {
    const r = validateDestination(bad);
    assert.equal(r.ok, false, `${bad} should be rejected`);
    assert.match(r.error, /only works on your own network|does not look like|missing a domain/);
  }
});

test("a non-http scheme is rejected", () => {
  const r = validateDestination("ftp://files.example.net/thing");
  assert.equal(r.ok, false);
});

test("tracking parameters are stripped so the QR stays sparse", () => {
  const r = validateDestination(
    "https://mysalon.com/book?utm_source=card&utm_medium=nfc&fbclid=xyz&ref=keep"
  );
  assert.equal(r.ok, true);
  assert.equal(r.url, "https://mysalon.com/book?ref=keep");
});

test("a Google stand pointed at Google passes with no warning", () => {
  for (const good of [
    "https://g.page/r/CabcDEF/review",
    "https://maps.app.goo.gl/abc123",
    "https://www.google.com/maps/place/x",
  ]) {
    const r = validateDestination(good, "Google review");
    assert.equal(r.ok, true, good);
    assert.equal(r.warning, undefined, `${good} should not warn`);
  }
});

test("a Google stand pointed elsewhere warns but is still allowed", () => {
  // Allowed on purpose: a business may legitimately use a shortener or a
  // redirect, and blocking that would be refusing a sale over a guess.
  const r = validateDestination("https://bit.ly/my-reviews", "Google review");
  assert.equal(r.ok, true);
  assert.match(r.warning, /not a Google review link/);
});

test("a stand with no expected platform never warns", () => {
  const r = validateDestination("https://anything.example.net/x", "menu");
  assert.equal(r.ok, true);
  assert.equal(r.warning, undefined);
});

test("the chip capacity check matches NTAG213's usable memory", () => {
  assert.equal(MAX_DIRECT_URL_BYTES, 132);
  assert.equal(urlFitsOnChip("https://g.page/r/CabcDEF/review"), true);
  assert.equal(urlFitsOnChip("https://x.com/" + "a".repeat(200)), false);
  // Multi-byte characters count as bytes, not characters.
  assert.equal(urlFitsOnChip("https://x.com/" + "é".repeat(70)), false);
});
