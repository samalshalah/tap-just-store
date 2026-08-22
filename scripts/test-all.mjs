/**
 * test-all.mjs — run every unit suite and report an honest total.
 *
 * The suites used to be chained with `&&` in package.json. That has a failure
 * mode that bit for real: when the first file *crashed* rather than failing an
 * assertion, the chain stopped, no "# fail" line was ever printed, and a grep
 * for failures found nothing — which reads exactly like success. A deleted
 * module took a whole suite out and the run still looked green.
 *
 * So this runner does three things the chain could not:
 *   - runs every suite even when an earlier one fails, so one broken file does
 *     not hide the state of the other eleven
 *   - treats a crash (no TAP output) as a failure rather than as silence
 *   - prints a total, so "98 tests" is a number that came from somewhere
 */

import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const suites = readdirSync(here)
  .filter((f) => f.endsWith(".test.mjs"))
  .sort();

if (suites.length === 0) {
  console.error("No test suites found.");
  process.exit(1);
}

let totalTests = 0;
let totalPass = 0;
let totalFail = 0;
const broken = [];

for (const file of suites) {
  const run = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "--no-warnings", path.join(here, file)],
    { encoding: "utf8", cwd: path.resolve(here, "..") }
  );

  const out = `${run.stdout}${run.stderr}`;
  const num = (label) => {
    const m = out.match(new RegExp(`^# ${label} (\\d+)$`, "m"));
    return m ? Number(m[1]) : null;
  };

  const tests = num("tests");
  const pass = num("pass");
  const fail = num("fail");

  // No TAP summary means the file threw before the runner could report.
  // That is a failure, not a quiet zero.
  if (tests === null || pass === null || fail === null) {
    broken.push(file);
    const firstError =
      out.split("\n").find((l) => /Error|error:/.test(l))?.trim() ?? "no output";
    console.log(`✗ ${file.padEnd(30)} crashed — ${firstError.slice(0, 100)}`);
    continue;
  }

  totalTests += tests;
  totalPass += pass;
  totalFail += fail;

  const mark = fail === 0 ? "✓" : "✗";
  console.log(`${mark} ${file.padEnd(30)} ${pass}/${tests}`);

  if (fail > 0) {
    for (const line of out.split("\n").filter((l) => l.startsWith("not ok"))) {
      console.log(`    ${line}`);
    }
  }
}

const ok = totalFail === 0 && broken.length === 0;
console.log(
  `\n${ok ? "✓" : "✗"} ${totalPass}/${totalTests} tests across ${suites.length} suites` +
    (broken.length ? `, ${broken.length} crashed: ${broken.join(", ")}` : "")
);
process.exit(ok ? 0 : 1);
