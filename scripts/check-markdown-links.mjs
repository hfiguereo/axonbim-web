#!/usr/bin/env node
/**
 * Fails when a tracked Markdown file contains a broken *relative* link.
 *
 * Distinct from `check:docs` (AGENTS.md reachability by name). This resolves
 * paths like `../roadmap/pending-work.md` from the citing file (DOC-06 / F9-E6).
 *
 * Skips: http(s), mailto, absolute site URLs, pure fragment `#anchor`.
 * Anchors (`file.md#section`) only require the file to exist.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, normalize, sep } from "node:path";

const LINK_RE = /!\[[^\]]*]\(([^)]+)\)|\[[^\]]*]\(([^)]+)\)/g;

const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);

const markdown = tracked.filter((f) => f.endsWith(".md"));

function isExternal(href) {
  return (
    /^(https?:|mailto:|data:)/i.test(href) ||
    href.startsWith("//") ||
    href.startsWith("/")
  );
}

function stripAngleUrl(raw) {
  const t = raw.trim();
  if (t.startsWith("<") && t.endsWith(">")) return t.slice(1, -1).trim();
  // title after URL: path "title" or path 'title'
  const m = /^([^"' \t]+)(?:\s+["'].*)?$/.exec(t);
  return (m?.[1] ?? t).trim();
}

/** @type {{ file: string; line: number; href: string; reason: string }[]} */
const broken = [];

for (const file of markdown) {
  const text = readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === undefined) continue;
    LINK_RE.lastIndex = 0;
    let m;
    while ((m = LINK_RE.exec(line)) !== null) {
      const raw = m[1] ?? m[2];
      if (!raw) continue;
      const href = stripAngleUrl(raw);
      if (!href || href.startsWith("#") || isExternal(href)) continue;

      const hash = href.indexOf("#");
      const pathPart = hash >= 0 ? href.slice(0, hash) : href;
      if (!pathPart) continue; // #only already skipped; empty path with hash

      const resolved = normalize(join(dirname(file), pathPart));
      // Stay inside the repo (no .. escape to parent of cwd meaningfully for us)
      if (resolved.split(sep).includes("..")) {
        // normalize already collapsed; if still outside, existsSync will fail
      }

      if (!existsSync(resolved)) {
        broken.push({
          file,
          line: i + 1,
          href,
          reason: `missing target "${resolved}"`,
        });
        continue;
      }
      try {
        if (!statSync(resolved).isFile() && !statSync(resolved).isDirectory()) {
          broken.push({
            file,
            line: i + 1,
            href,
            reason: `not a file/dir "${resolved}"`,
          });
        }
      } catch {
        broken.push({
          file,
          line: i + 1,
          href,
          reason: `unreadable "${resolved}"`,
        });
      }
    }
  }
}

if (broken.length > 0) {
  console.error(`Enlaces relativos rotos (${broken.length}):\n`);
  for (const b of broken) {
    console.error(`  ${b.file}:${b.line}  ${b.href}  → ${b.reason}`);
  }
  console.error("\nCorrige el enlace o el destino. Guardia: pnpm check:links (F9-E6).");
  process.exit(1);
}

console.log(`Enlaces relativos OK: ${markdown.length} archivos Markdown revisados.`);
