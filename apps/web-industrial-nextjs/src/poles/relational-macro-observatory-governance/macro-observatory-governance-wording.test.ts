import { describe, expect, it } from "vitest";

import { RELATIONAL_MACRO_OBSERVATORY_GOVERNANCE_AI_CONTEXT } from "./ai-context";

const FORBIDDEN = RELATIONAL_MACRO_OBSERVATORY_GOVERNANCE_AI_CONTEXT.forbidden.join(" ").toLowerCase();

describe("Instruction 20.43 — macro observatory governance wording guard", () => {
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
