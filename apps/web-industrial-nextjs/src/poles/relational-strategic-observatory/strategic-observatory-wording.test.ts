import { describe, expect, it } from "vitest";

import { RELATIONAL_STRATEGIC_OBSERVATORY_AI_CONTEXT } from "./ai-context";

const FORBIDDEN = RELATIONAL_STRATEGIC_OBSERVATORY_AI_CONTEXT.forbidden.join(" ").toLowerCase();

describe("Instruction 20.41 — global executive supervision wording guard", () => {
  it("does not advertise forbidden chatbot / LLM / wallet vocabulary", () => {
    expect(FORBIDDEN).toContain("chatbot");
    expect(FORBIDDEN).toContain("llm");
    expect(FORBIDDEN).toContain("generative summary");
    expect(FORBIDDEN).toContain("wallet");
    expect(FORBIDDEN).toContain("payment");
    expect(FORBIDDEN).toContain("public tracking");
    expect(FORBIDDEN).toContain("erp");
  });
});
