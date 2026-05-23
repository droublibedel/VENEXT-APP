import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const dir = join(__dirname, ".");

describe("Instruction 20.6 — relational catalog direct cart wording", () => {
  it("surfaces and client post helper avoid buy-now / checkout / pay vocabulary", () => {
    const names = ["surfaces/RelationalCatalogProductsSurface.tsx", "post-relational-cart-from-catalog.ts"];
    const src = names.map((n) => readFileSync(join(dir, n), "utf8")).join("\n").toLowerCase();
    expect(src).not.toContain("buy now");
    expect(src).not.toContain("acheter maintenant");
    expect(src).not.toContain("checkout");
    expect(src).not.toContain("payer");
    expect(src).not.toContain("caisse publique");
  });
});
