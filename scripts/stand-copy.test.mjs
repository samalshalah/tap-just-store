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

const { standCopy, standSeoTitle, standSeoDescription } = loadTs("src/lib/stand-copy.ts");

const stand = (slug, extra = {}) => ({
  slug, name: "X Stand", badge: "", destinationLabel: "", seoTitle: null, seoDescription: null, ...extra,
});

test("each stand speaks about its own destination", () => {
  assert.match(standCopy(stand("yelp-review-stand")).urlHelp, /Yelp/);
  assert.match(standCopy(stand("book-appointment-stand")).urlHelp, /Vagaro|booking/i);
  assert.match(standCopy(stand("view-menu-stand")).urlHelp, /menu/i);
  assert.match(standCopy(stand("follow-us-stand")).urlHelp, /Instagram|profile/i);
});

test("no stand other than Google mentions Google", () => {
  for (const slug of [
    "yelp-review-stand", "facebook-review-stand", "tripadvisor-review-stand",
    "view-menu-stand", "book-appointment-stand", "follow-us-stand",
    "rate-your-experience-stand", "visit-website-stand",
  ]) {
    const c = standCopy(stand(slug));
    const blob = [c.badge, c.destination, c.destinationPhrase, c.urlLabel, c.urlHelp].join(" ");
    assert.doesNotMatch(blob, /google/i, `${slug} leaked Google copy`);
  }
});

test("unknown stands fall back to a direct link, never to Google", () => {
  const c = standCopy(stand("some-new-stand"));
  assert.equal(c.badge, "DIRECT LINK");
  assert.equal(c.destination, "destination link");
  assert.doesNotMatch(c.urlHelp, /google/i);
});

test("values stored on the row override the preset", () => {
  const c = standCopy(stand("google-review-stand", { badge: "CUSTOM BADGE", destinationLabel: "custom dest" }));
  assert.equal(c.badge, "CUSTOM BADGE");
  assert.equal(c.destination, "custom dest");
});

test("SEO title and description follow the agreed pattern", () => {
  const s = stand("google-review-stand", { name: "Google Review Stand" });
  assert.equal(standSeoTitle(s, "Review Stands", 3900), "Google Review Stand | NFC Review Stand from $39");
  assert.match(standSeoDescription(s, 3900), /Google review page/);
  assert.match(standSeoDescription(s, 3900), /\$39/);
});

test("admin overrides win over generated SEO", () => {
  const s = stand("google-review-stand", { seoTitle: "Mine", seoDescription: "Also mine" });
  assert.equal(standSeoTitle(s, "Review Stands", 3900), "Mine");
  assert.equal(standSeoDescription(s, 3900), "Also mine");
});
