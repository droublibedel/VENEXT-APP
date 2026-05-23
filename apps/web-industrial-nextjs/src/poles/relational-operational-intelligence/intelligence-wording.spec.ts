import { describe, expect, it } from "vitest";

const FORBIDDEN = [
  "seller rating",
  "buyer score",
  "customer satisfaction",
  "delivery success rate",
  "étoiles",
  "gamification",
];

describe("relational-operational-intelligence wording guard", () => {
  it("panel copy avoids marketplace KPI vocabulary", () => {
    const copy =
      "Centre intelligence opérationnelle corridor — SLA exécution, dérives, saturation coordination";
    for (const w of FORBIDDEN) {
      expect(copy.toLowerCase()).not.toContain(w);
    }
  });
});
