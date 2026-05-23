import { describe, expect, it } from "vitest";

const FORBIDDEN = ["autopilot", "auto-healing", "chatbot", "ai assistant", "smart ai operator", "auto-trading"];

describe("relational-operational-orchestration wording guard", () => {
  it("copy avoids autopilot and LLM vocabulary", () => {
    const copy = "Centre de pilotage orchestration — plans séquencés, validation humaine";
    for (const w of FORBIDDEN) {
      expect(copy.toLowerCase()).not.toContain(w);
    }
  });
});
