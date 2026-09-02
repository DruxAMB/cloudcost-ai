#!/usr/bin/env node
/**
 * Warns when the accent scale in app/globals.css still holds the template's
 * default hex values. Unlike check:placeholders, this does NOT fail the
 * build — some projects have no sponsor palette to match and the defaults
 * are fine. It exists to make sure the agent made a conscious choice.
 *
 * Run directly:  npm run check:retheme
 * Runs automatically as part of:  npm run build
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const CSS = join(process.cwd(), "src", "app", "globals.css");

// The default accent tokens from the "Acid neon accents" block.
// If all of these are still present, the page ships with the LD palette.
const DEFAULTS = [
  { token: "--yellow", hex: "#ebff38" },
  { token: "--blue", hex: "#405bff" },
  { token: "--pink", hex: "#ff35a2" },
  { token: "--purple", hex: "#a34fde" },
  { token: "--green", hex: "#a9ff5e" },
  { token: "--lime", hex: "#ddff46" },
  { token: "--orange", hex: "#ff9d29" },
];

let text;
try {
  text = readFileSync(CSS, "utf8");
} catch {
  console.error("✗ Could not read app/globals.css — does it exist?");
  process.exit(1);
}

const unchanged = DEFAULTS.filter((d) => {
  // Match the token declaration, e.g. `  --purple: #a34fde;`
  // # is not a regex metacharacter, so the hex string is safe as-is.
  const re = new RegExp(`${d.token}\\s*:\\s*${d.hex}`, "i");
  return re.test(text);
});

if (unchanged.length === 0) {
  console.log("✓ Accent scale has been rethemed.");
  process.exit(0);
}

console.warn(
  `\n⚠  ${unchanged.length} of ${DEFAULTS.length} accent tokens still hold the template defaults.\n` +
    `  This is allowed, but for a prize-track project, matching the sponsor's\n` +
    `  brand palette is a scoring signal — a judge from that company scans for\n` +
    `  their colours first.\n`
);

for (const d of unchanged) {
  console.warn(`  ${d.token}: ${d.hex}  (default)`);
}

console.warn(
  `\n  To retheme: swap the values in app/globals.css under "Acid neon accents",\n` +
    `  then update the hex literals in heroWidgets in app/content.ts using the\n` +
    `  colour mapping documented in that comment block.\n` +
    `  Re-check contrast after any swap: 4.5:1 for text, 3:1 for UI/borders.\n`
);

// Exit 0 — this is a warning, not a failure.
process.exit(0);
