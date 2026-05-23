import { describe, expect, it } from "vitest";

const FORBIDDEN = ["ai simulator", "chatbot", "autopilot", "auto-healing", "auto-trading", "marketplace simulation"];

describe("relational-operational-simulation wording guard", () => {
  it("copy avoids AI autopilot vocabulary", () => {
    const copy = "Centre analytique simulation — stress tests corridor, projections explicables";
    for (const w of FORBIDDEN) {
      expect(copy.toLowerCase()).not.toContain(w);
    }
  });
});
