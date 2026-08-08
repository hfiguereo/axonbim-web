#!/usr/bin/env node
/**
 * Fails when a push to main is not a fast-forward (force-push or history rewrite).
 *
 * Complements GitHub branch protection (A1): if protection is ever disabled, CI still
 * goes red. On pull_request or the initial repo push, github.event.before is all zeros
 * and we skip.
 */
import { execFileSync } from "node:child_process";

const before = process.env.GITHUB_EVENT_BEFORE?.trim();
const after = process.env.GITHUB_EVENT_AFTER?.trim();
const ref = process.env.GITHUB_REF?.trim();

if (!ref?.endsWith("/main")) {
  console.log("No es push a main; omitido.");
  process.exit(0);
}

if (!before || !after || /^0+$/.test(before)) {
  console.log("Primer push o before vacío; omitido.");
  process.exit(0);
}

if (before === after) {
  console.log("Sin cambio de SHA; omitido.");
  process.exit(0);
}

try {
  execFileSync("git", ["cat-file", "-e", `${before}^{commit}`], { stdio: "ignore" });
} catch {
  console.error(
    `El commit anterior (${before.slice(0, 7)}) no está en el checkout; no se puede verificar.`,
  );
  process.exit(1);
}

try {
  execFileSync("git", ["merge-base", "--is-ancestor", before, after], { stdio: "ignore" });
} catch {
  console.error(
    "Push a main que NO es fast-forward (posible force-push o reescritura de historial).",
  );
  console.error(`  before: ${before}`);
  console.error(`  after:  ${after}`);
  process.exit(1);
}

console.log(`Historial lineal en main: ${before.slice(0, 7)} → ${after.slice(0, 7)}`);
