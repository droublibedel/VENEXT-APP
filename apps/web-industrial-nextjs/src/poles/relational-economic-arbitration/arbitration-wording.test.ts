import { describe, expect, it } from "vitest";

import { RELATIONAL_ECONOMIC_ARBITRATION_AI_CONTEXT } from "./ai-context";

const FORBIDDEN = RELATIONAL_ECONOMIC_ARBITRATION_AI_CONTEXT.forbidden.join(" ").toLowerCase();

describe("Instruction 20.31 — arbitration wording guard", () => {
  it("does not advertise forbidden autopilot / wallet / execution vocabulary", () => {
    expect(FORBIDDEN).toContain("autopilot");
    expect(FORBIDDEN).toContain("wallet");
    expect(FORBIDDEN).toContain("payment");
    expect(FORBIDDEN).toContain("pricing");
    expect(FORBIDDEN).toContain("delivery execution");
    expect(FORBIDDEN).toContain("public tracking");
  });
});
