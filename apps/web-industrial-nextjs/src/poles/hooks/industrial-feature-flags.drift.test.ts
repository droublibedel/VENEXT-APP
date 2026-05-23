import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { getIndustrialFeatureFlagDefaultKeys } from "./useIndustrialFeatureFlags";

function parseSeedGlobalFlagKeys(): string[] {
  const here = dirname(fileURLToPath(import.meta.url));
  const seedPath = resolve(here, "../../../../../prisma/seed.ts");
  const src = readFileSync(seedPath, "utf8");
  const m = src.match(/const flags:\s*\{[^}]*\}\[\]\s*=\s*\[([\s\S]*?)\];\s*\r?\n\s*for \(const f of flags\)/);
  if (!m?.[1]) throw new Error("Could not parse global flags array in prisma/seed.ts");
  return [...m[1].matchAll(/\bkey:\s*"([^"]+)"/g)].map((x) => x[1]!);
}

describe("Instruction 16A — industrial feature flag seed vs frontend defaults", () => {
  it("every prisma-seeded pole flag from strategic..finance exists on the client default map", () => {
    const keys = parseSeedGlobalFlagKeys();
    const start = keys.indexOf("strategic_intelligence_enabled");
    const end = keys.indexOf("corridor_intelligence_realtime_enabled");
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThanOrEqual(start);
    const slice = keys.slice(start, end + 1);
    const front = new Set(getIndustrialFeatureFlagDefaultKeys());
    const missing = slice.filter((k) => !front.has(k));
    expect(missing, `Add to PRODUCTION_DEFAULTS in useIndustrialFeatureFlags: ${missing.join(", ")}`).toEqual([]);
  });
});
