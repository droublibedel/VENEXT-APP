import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const POLE_ROOT = join(__dirname);

/** Instruction 20.20 — forbid marketplace / ecommerce dashboard / generative cockpit language. */
const FORBIDDEN = [
  "ai command center",
  "autopilot control",
  "neural dashboard",
  "smart delivery tracking",
  "customer logistics",
  "marketplace monitoring",
  "seller ranking",
  "autopilot",
  "social graph",
  "wallet",
  "gps",
];

function collectPoleSources(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectPoleSources(path));
    else if (/\.(tsx?|md)$/.test(entry.name)) out.push(path);
  }
  return out;
}

describe("Instruction 20.20 — relational economic command center wording guard", () => {
  it("scans pole sources for forbidden phrasing", () => {
    const files = collectPoleSources(POLE_ROOT);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      if (file.endsWith("command-wording.test.ts")) continue;
      const blob = readFileSync(file, "utf8").toLowerCase();
      for (const phrase of FORBIDDEN) {
        expect(blob.includes(phrase), `${file} contains forbidden "${phrase}"`).toBe(false);
      }
    }
  });
});
