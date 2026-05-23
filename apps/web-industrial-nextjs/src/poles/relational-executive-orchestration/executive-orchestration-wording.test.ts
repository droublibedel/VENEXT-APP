import { describe, expect, it } from "vitest";

import { RELATIONAL_EXECUTIVE_ORCHESTRATION_AI_CONTEXT } from "./ai-context";

const FORBIDDEN = RELATIONAL_EXECUTIVE_ORCHESTRATION_AI_CONTEXT.forbidden.join(" ").toLowerCase();

describe("Instruction 20.34 — executive orchestration wording guard", () => {
  it("does not advertise forbidden autopilot / wallet / execution vocabulary", () => {
    expect(FORBIDDEN).toContain("autopilot");
    expect(FORBIDDEN).toContain("wallet");
    expect(FORBIDDEN).toContain("payment");
    expect(FORBIDDEN).toContain("order execution");
    expect(FORBIDDEN).toContain("operational workflow trigger");
    expect(FORBIDDEN).toContain("public tracking");
  });
});
