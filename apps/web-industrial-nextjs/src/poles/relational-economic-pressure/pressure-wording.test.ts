import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const POLE_ROOT = join(__dirname);

const FORBIDDEN = [
  "social graph",
  "ai network",
  "neural economy",
  "package tracking",
  "delivery app",
  "live courier",
  "blockchain",
  "wallet intelligence",
  "autonomous ai",
  "smart commerce ai",
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

describe("Instruction 20.21 — economic pressure pole wording guard", () => {
  it("rejects forbidden ecommerce / hype vocabulary", () => {
    const files = collectPoleSources(POLE_ROOT);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      if (file.endsWith("pressure-wording.test.ts")) continue;
      const blob = readFileSync(file, "utf8").toLowerCase();
      for (const phrase of FORBIDDEN) {
        expect(blob.includes(phrase), `${file} contains forbidden "${phrase}"`).toBe(false);
      }
    }
  });
});
