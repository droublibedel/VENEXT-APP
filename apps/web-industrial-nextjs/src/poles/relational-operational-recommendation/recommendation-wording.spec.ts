import { describe, expect, it } from "vitest";

const FORBIDDEN = ["seller score", "buyer score", "customer rating", "chatbot", "étoiles", "recommended supplier"];

describe("relational-operational-recommendation wording guard", () => {
  it("panel copy avoids marketplace and LLM vocabulary", () => {
    const copy = "Recommandations opérationnelles déterministes — SLA, incidents, gouvernance corridor";
    for (const w of FORBIDDEN) {
      expect(copy.toLowerCase()).not.toContain(w);
    }
  });
});
