import { describe, expect, it } from "vitest";

const FORBIDDEN = ["seller score", "buyer score", "customer rating", "recommended supplier", "étoiles", "AI assistant"];

describe("relational-predictive-risk wording guard", () => {
  it("panel copy avoids marketplace ranking vocabulary", () => {
    const copy = "Surveillance risque opérationnel déterministe — drift, fragilité corridor, collapse SLA";
    for (const w of FORBIDDEN) {
      expect(copy.toLowerCase()).not.toContain(w);
    }
  });
});
