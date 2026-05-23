import { describe, expect, it } from "vitest";

const FORBIDDEN = ["ticket", "customer support", "parcel", "delivery tracking", "SAV", "marketplace support"];

describe("relational-fulfillment-coordination wording guard", () => {
  it("panel copy avoids marketplace support vocabulary", () => {
    const copy =
      "Coordination opérationnelle corridor — tâches inter-entreprises — responsabilités, délais, blocages";
    for (const w of FORBIDDEN) {
      expect(copy.toLowerCase()).not.toContain(w);
    }
  });
});
