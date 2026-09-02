#!/usr/bin/env node
/**
 * Fails the build while any __PLACEHOLDER__ token remains in the source.
 *
 * This exists because the real risk with a reusable landing template is not
 * that you forget to restyle it — it is that placeholder or borrowed content
 * ships at 3am because nobody re-read the page. An instruction cannot prevent
 * that. A build that refuses to compile can.
 *
 * Run directly:  npm run check:placeholders
 * Runs automatically as part of:  npm run build
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "out", "build", "scripts"]);
const EXTS = [".ts", ".tsx", ".js", ".jsx", ".css", ".md", ".json", ".html"];

/** Files exempt from the check — they legitimately describe the tokens. */
const SKIP_FILES = new Set(["TEMPLATE.md", "package-lock.json"]);

const PATTERN = /__[A-Z0-9_]+__/g;

function walk(dir, found = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (!SKIP_DIRS.has(entry)) walk(full, found);
      continue;
    }
    if (SKIP_FILES.has(entry)) continue;
    if (!EXTS.some((e) => entry.endsWith(e))) continue;

    const text = readFileSync(full, "utf8");
    const lines = text.split(/\r?\n/);
    lines.forEach((line, i) => {
      const hits = line.match(PATTERN);
      if (hits) {
        found.push({
          file: relative(ROOT, full).split(sep).join("/"),
          line: i + 1,
          tokens: [...new Set(hits)],
          text: line.trim().slice(0, 100),
        });
      }
    });
  }
  return found;
}

const found = walk(ROOT);

if (found.length === 0) {
  console.log("✓ No placeholders remaining.");
  process.exit(0);
}

const tokenCount = new Set(found.flatMap((f) => f.tokens)).size;

console.error(
  `\n✗ ${found.length} line(s) still contain placeholders (${tokenCount} distinct token(s)).\n` +
    `  Fill these in — most live in app/content.ts.\n`
);

for (const f of found) {
  console.error(`  ${f.file}:${f.line}`);
  console.error(`    ${f.text}`);
}

console.error(
  `\n  Shipping placeholder or borrowed copy is worse than shipping a smaller page.\n` +
    `  If a section has nothing true to say, delete the section.\n`
);

process.exit(1);
