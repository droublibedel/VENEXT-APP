import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const poleDir = join(__dirname, ".");

function readAllTsx(): string {
  const names = [
    "RelationalCartWorkspace.tsx",
    "RelationalCartOverviewSurface.tsx",
    "RelationalCartItemsSurface.tsx",
    "RelationalCartGovernanceSurface.tsx",
    "RelationalCartConversionSurface.tsx",
    "RelationalCartReviewSurface.tsx",
    "PoleWorkspace.tsx",
  ];
  return names.map((n) => readFileSync(join(poleDir, n), "utf8")).join("\n");
}

describe("Instruction 20.5 — relational cart pole wording", () => {
  it("does not use marketplace / checkout / buy-now vocabulary", () => {
    const src = readAllTsx().toLowerCase();
    expect(src).not.toContain("buy now");
    expect(src).not.toContain("checkout");
    expect(src).not.toContain("marketplace cart");
    expect(src).not.toContain("add to cart public");
    expect(src).not.toContain("pay now");
    expect(src).not.toContain("deal ranking");
  });
});
