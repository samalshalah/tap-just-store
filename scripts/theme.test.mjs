/**
 * Tests for theme resolution.
 *
 * Run: node --experimental-strip-types --no-warnings scripts/theme.test.mjs
 *
 * These exist because the Mode control was inert: the admin saved
 * mode: "light" and the site kept rendering the preset's dark surfaces, so
 * switching to Light appeared to do nothing at all. Anything that makes Mode
 * stop deciding the surfaces should fail here.
 */
import test from "node:test";
import assert from "node:assert/strict";

const {
  PALETTES,
  DEFAULT_THEME_CONFIG,
  getThemeCssVars,
  resolveMode,
  resolveSurfaces,
  hexToHsl,
  contrastFg,
} = await import("../src/lib/theme.ts");

const byId = (id) => PALETTES.find((p) => p.id === id);

/** Lightness percentage out of an "H S% L%" string. */
function lightness(hsl) {
  return Number(hsl.trim().split(/\s+/)[2].replace("%", ""));
}

test("the default theme is the light Tap Rater palette", () => {
  assert.equal(DEFAULT_THEME_CONFIG.mode, "light");
  assert.equal(DEFAULT_THEME_CONFIG.preset, "tap-rater");
  assert.equal(byId("tap-rater").mode, "light");
});

test("a light mode always renders a light background and dark text", () => {
  for (const palette of PALETTES) {
    const vars = getThemeCssVars({ preset: palette.id, mode: "light" });
    assert.ok(
      lightness(vars["--background"]) > 85,
      `${palette.id} in light mode has a background at ${vars["--background"]}`
    );
    assert.ok(
      lightness(vars["--foreground"]) < 30,
      `${palette.id} in light mode has foreground at ${vars["--foreground"]}`
    );
  }
});

test("a dark mode always renders a dark background and light text", () => {
  for (const palette of PALETTES) {
    const vars = getThemeCssVars({ preset: palette.id, mode: "dark" });
    assert.ok(
      lightness(vars["--background"]) < 20,
      `${palette.id} in dark mode has a background at ${vars["--background"]}`
    );
    assert.ok(
      lightness(vars["--foreground"]) > 80,
      `${palette.id} in dark mode has foreground at ${vars["--foreground"]}`
    );
  }
});

test("switching mode changes the surfaces — the control is not inert", () => {
  const light = getThemeCssVars({ preset: "royal-blue", mode: "light" });
  const dark = getThemeCssVars({ preset: "royal-blue", mode: "dark" });
  assert.notEqual(light["--background"], dark["--background"]);
  assert.notEqual(light["--foreground"], dark["--foreground"]);
  assert.notEqual(light["--card"], dark["--card"]);
  assert.notEqual(light["--border"], dark["--border"]);
});

test("a palette used in its own mode keeps its exact hand-tuned colours", () => {
  const p = byId("tap-rater");
  const vars = getThemeCssVars({ preset: "tap-rater", mode: "light" });
  assert.equal(vars["--background"], hexToHsl(p.background));
  assert.equal(vars["--card"], hexToHsl(p.card));
  assert.equal(vars["--muted-foreground"], hexToHsl(p.mutedFg));
});

test("accent survives a mode flip — only the surfaces change", () => {
  const light = getThemeCssVars({ preset: "royal-blue", mode: "light" });
  const dark = getThemeCssVars({ preset: "royal-blue", mode: "dark" });
  assert.equal(light["--accent"], dark["--accent"]);
  assert.equal(light["--primary"], dark["--primary"]);
});

test("an explicit accent override beats the palette", () => {
  const vars = getThemeCssVars({ preset: "tap-rater", mode: "light", accent: "#FF0000" });
  assert.equal(vars["--accent"], hexToHsl("#FF0000"));
  assert.equal(vars["--accent-foreground"], hexToHsl(contrastFg("#FF0000")));
});

test("an unknown preset falls back rather than throwing", () => {
  const vars = getThemeCssVars({ preset: "does-not-exist", mode: "light" });
  assert.ok(lightness(vars["--background"]) > 85);
});

test("no config at all still resolves to the light default", () => {
  assert.equal(resolveMode(null), "light");
  assert.equal(resolveMode(undefined), "light");
  const vars = getThemeCssVars(null);
  assert.equal(vars["--background"], hexToHsl(byId("tap-rater").background));
});

test("resolveSurfaces returns the five surface colours and nothing else", () => {
  const out = resolveSurfaces(byId("royal-blue"), "light");
  assert.deepEqual(
    Object.keys(out).sort(),
    ["background", "border", "card", "foreground", "mutedFg"]
  );
});

test("body text meets a readable contrast ratio in both modes", () => {
  // Relative luminance per WCAG, then the standard contrast formula.
  const lum = (hex) => {
    const h = hex.replace(/^#/, "");
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
    const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  };
  const ratio = (a, b) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  for (const mode of ["light", "dark"]) {
    const s = resolveSurfaces(byId("royal-blue"), mode);
    assert.ok(
      ratio(s.foreground, s.background) >= 7,
      `${mode}: body text contrast is ${ratio(s.foreground, s.background).toFixed(2)}`
    );
    assert.ok(
      ratio(s.mutedFg, s.background) >= 4.5,
      `${mode}: muted text contrast is ${ratio(s.mutedFg, s.background).toFixed(2)}`
    );
  }

  const tap = byId("tap-rater");
  assert.ok(ratio(tap.foreground, tap.background) >= 7);
  assert.ok(ratio(tap.mutedFg, tap.background) >= 4.5);
});
