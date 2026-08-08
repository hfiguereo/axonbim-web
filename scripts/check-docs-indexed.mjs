#!/usr/bin/env node
/**
 * Fails when permanent documentation is not reachable from the AGENTS.md index.
 *
 * Rule 10 §10 already requires it, but nothing checked: the master plan PDF and
 * its summary sat outside the index from the first commit, so no agent ever read
 * the document that defines the project (finding D1).
 *
 * Reachable means: named in AGENTS.md, or named by a document that AGENTS.md
 * names. One hop is allowed on purpose, so hubs like docs/decisions/README.md can
 * index the ADRs without AGENTS.md listing all sixteen.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join, normalize } from "node:path";

const ENTRY = "AGENTS.md";
const DOC_EXT = /\.(md|pdf)$/;

/** Docs that intentionally live outside the index, with the reason. */
const NOT_INDEXED = [
  /^CHANGELOG\.md$/, // chronological log, read by date and not by topic
  /^README\.md$/, // repo front page, entry point itself
  /^AGENTS\.md$/, // the index
  /^samples\/.*\/README\.md$/, // sample payload, described by its own directory
];

const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);

const docs = tracked.filter(
  (f) => DOC_EXT.test(f) && !NOT_INDEXED.some((re) => re.test(f)),
);

function read(file) {
  return existsSync(file) ? readFileSync(file, "utf8") : "";
}

/** A doc is "named" by text if the text mentions its path or its file name. */
function namedBy(text, doc) {
  return text.includes(doc) || text.includes(basename(doc));
}

/**
 * Paths AGENTS.md points at, so a hub document can vouch for its own children.
 * Resolved relative to the citing file, plus a bare repo-root reading.
 */
function citedFrom(file, text) {
  const hits = new Set();
  for (const doc of docs) {
    if (namedBy(text, doc)) hits.add(doc);
    const relative = normalize(join(dirname(file), basename(doc)));
    if (relative !== doc && namedBy(text, basename(doc))) hits.add(relative);
  }
  return hits;
}

const agents = read(ENTRY);
const direct = citedFrom(ENTRY, agents);

const reachable = new Set(direct);
for (const hub of direct) {
  for (const child of citedFrom(hub, read(hub))) reachable.add(child);
}

const missing = docs.filter((d) => !reachable.has(d));

if (missing.length > 0) {
  console.error(`Documentación fuera del índice de ${ENTRY} (${missing.length}):\n`);
  for (const m of missing) console.error(`  ${m}`);
  console.error(
    `\nAñádela al índice de ${ENTRY} (o cítala desde un doc ya indexado).` +
      "\nSi de verdad no debe indexarse, añádela a NOT_INDEXED con su motivo.",
  );
  process.exit(1);
}

console.log(`Documentación indexada: ${docs.length} archivos alcanzables desde ${ENTRY}.`);
