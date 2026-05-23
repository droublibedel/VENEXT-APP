import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const POLE_ROOT = join(__dirname);

const FORBIDDEN = [
  "GPS tracking",
  "live courier",
  "map delivery",
  "smart city AI",
  "neural map",
  "social location",
  "blockchain logistics",
  "delivery optimization AI",
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

describe("Instruction 20.22 — relational geo-economic wording guard", () => {
  it("rejects forbidden GPS / retail logistics hype vocabulary", () => {
    const files = collectPoleSources(POLE_ROOT);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      if (file.endsWith("geo-wording.test.ts")) continue;
      const blob = readFileSync(file, "utf8").toLowerCase();
      for (const phrase of FORBIDDEN) {
        expect(blob.includes(phrase.toLowerCase()), `${file} contains forbidden "${phrase}"`).toBe(false);
      }
    }
  });
});
