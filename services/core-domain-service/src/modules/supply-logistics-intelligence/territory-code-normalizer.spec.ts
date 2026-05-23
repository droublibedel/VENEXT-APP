import { describe, expect, it } from "vitest";

import { normalizeTerritoryLabel } from "./territory-code-normalizer";

describe("TerritoryCodeNormalizer (Instruction 15A)", () => {
  it("maps SN-Dakar, SN/Dakar, sn_dakar to the same normalizedCode", () => {
    const a = normalizeTerritoryLabel("SN-Dakar");
    const b = normalizeTerritoryLabel("SN/Dakar");
    const c = normalizeTerritoryLabel("sn_dakar");
    expect(a.normalizedCode).toBe(b.normalizedCode);
    expect(b.normalizedCode).toBe(c.normalizedCode);
    expect(a.country).toBe("SN");
    expect(a.city).toBe("DAKAR");
  });

  it("maps CI/Abidjan to CI_ABIDJAN", () => {
    const x = normalizeTerritoryLabel("CI/Abidjan");
    expect(x.country).toBe("CI");
    expect(x.city).toBe("ABIDJAN");
    expect(x.normalizedCode).toBe("CI_ABIDJAN");
  });
});
