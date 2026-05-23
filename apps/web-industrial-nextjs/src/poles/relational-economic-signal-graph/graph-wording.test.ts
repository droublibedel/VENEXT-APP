import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const POLE_ROOT = join(__dirname);

const FORBIDDEN = [
  "ai graph",
  "neural commerce",
  "neural graph",
  "social graph",
  "social commerce graph",
  "autopilot",
  "auto-pilot",
  "marketplace graph",
  "seller ranking",
  "buyer ranking",
  "delivery tracking",
  "parcel tracking",
  "customer tracking",
  "public score",
  "public rating",
  "wallet",
  "payment",
  "gps",
  "geolocation",
  "consumer delivery",
];

const ALLOWED_VOCABULARY = [
  "economic signal graph",
  "corridor graph",
  "dependency graph",
  "propagation analysis",
  "operational cluster",
  "systemic risk",
  "economic signal",
  "corridor dependency",
  "graph intelligence",
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

describe("Instruction 20.19A — economic signal graph wording guard", () => {
  it("documents allowed vocabulary", () => {
    expect(ALLOWED_VOCABULARY.length).toBeGreaterThan(5);
  });

  it("scans pole ts/tsx/md files for forbidden marketplace/social/AI phrasing", () => {
    const files = collectPoleSources(POLE_ROOT);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      if (file.endsWith("graph-wording.test.ts")) continue;
      const blob = readFileSync(file, "utf8").toLowerCase();
      for (const phrase of FORBIDDEN) {
        expect(blob.includes(phrase), `${file} contains forbidden "${phrase}"`).toBe(false);
      }
    }
  });
});
