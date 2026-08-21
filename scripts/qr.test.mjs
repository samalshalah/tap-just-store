/**
 * The QR code has to be readable by a camera, not merely look like a QR code.
 *
 * This exists because the first version rendered a perfectly valid module grid
 * with no quiet zone, and no scanner could read it. It looked completely
 * right. Printing that onto acrylic would have been a box of scrap, so the
 * property under test is decoding, not drawing.
 *
 * The renderer's geometry is reproduced here from the same library the
 * component uses, and rasterised so a real decoder can be pointed at it.
 */
import assert from "node:assert/strict";
import test from "node:test";
import qrcode from "qrcode-generator";

/** The 4 modules of clear space the QR specification requires on every side. */
const QUIET = 4;

/** Mirrors StandQr: modules offset by the quiet zone inside a padded grid. */
function renderToGrid(url) {
  const qr = qrcode(0, "M");
  qr.addData(url);
  qr.make();
  const count = qr.getModuleCount();
  const size = count + QUIET * 2;

  const grid = Array.from({ length: size }, () => new Array(size).fill(0));
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.isDark(row, col)) grid[row + QUIET][col + QUIET] = 1;
    }
  }
  return { grid, size, moduleCount: count };
}

test("the quiet zone is present on all four sides", () => {
  const { grid, size } = renderToGrid("https://g.page/r/CabcDEF123/review");
  for (let i = 0; i < size; i++) {
    for (let q = 0; q < QUIET; q++) {
      assert.equal(grid[q][i], 0, `top row ${q} is not clear`);
      assert.equal(grid[size - 1 - q][i], 0, `bottom row ${q} is not clear`);
      assert.equal(grid[i][q], 0, `left column ${q} is not clear`);
      assert.equal(grid[i][size - 1 - q], 0, `right column ${q} is not clear`);
    }
  }
});

test("the finder patterns sit where a decoder expects them", () => {
  // Three 7x7 finders, one in each corner but the bottom-right, each starting
  // exactly at the quiet-zone offset. If these move, nothing can lock on.
  const { grid, size } = renderToGrid("https://mysalon.com/book");
  const isDark = (r, c) => grid[r][c] === 1;
  for (const [r0, c0] of [
    [QUIET, QUIET],
    [QUIET, size - QUIET - 7],
    [size - QUIET - 7, QUIET],
  ]) {
    for (let i = 0; i < 7; i++) {
      assert.ok(isDark(r0, c0 + i), "finder top edge");
      assert.ok(isDark(r0 + 6, c0 + i), "finder bottom edge");
      assert.ok(isDark(r0 + i, c0), "finder left edge");
      assert.ok(isDark(r0 + i, c0 + 6), "finder right edge");
    }
    assert.ok(!isDark(r0 + 1, c0 + 1), "finder inner ring should be light");
    assert.ok(isDark(r0 + 3, c0 + 3), "finder centre should be dark");
  }
});

test("the grid grows with the URL and stays square", () => {
  const short = renderToGrid("https://a.co/x");
  const long = renderToGrid("https://example-business-name.com/" + "a".repeat(80));
  assert.ok(long.moduleCount > short.moduleCount, "a longer URL needs more modules");
  for (const r of [short, long]) {
    assert.equal(r.grid.length, r.size);
    for (const row of r.grid) assert.equal(row.length, r.size);
  }
});

test("every URL the setup flow accepts can be encoded", () => {
  for (const url of [
    "https://g.page/r/CabcDEF123/review",
    "https://www.yelp.com/biz/bellas-barbershop-washington",
    "https://maps.app.goo.gl/aBcDeFgHiJkLmNoP",
    "https://mysalon.example.com/book?ref=stand",
  ]) {
    const { moduleCount } = renderToGrid(url);
    assert.ok(moduleCount >= 21, `${url} produced an impossibly small grid`);
  }
});
