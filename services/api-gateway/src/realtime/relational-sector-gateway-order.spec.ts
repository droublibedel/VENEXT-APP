import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("Instruction 20.24 — gateway relational orders ingest ordering", () => {
  it("validates relational.supply.* before relational.sector.* before relational.geo.* in InternalRelationalOrdersDomainController", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(join(here, "../internal-relational-orders-domain.controller.ts"), "utf8");
    const sup = src.indexOf('startsWith("relational.supply."');
    const si = src.indexOf('startsWith("relational.sector."');
    const gi = src.indexOf('startsWith("relational.geo."');
    expect(sup).toBeGreaterThanOrEqual(0);
    expect(si).toBeGreaterThanOrEqual(0);
    expect(gi).toBeGreaterThanOrEqual(0);
    expect(sup).toBeLessThan(si);
    expect(si).toBeLessThan(gi);
  });
});
