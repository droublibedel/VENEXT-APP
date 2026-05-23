import { describe, expect, it } from "vitest";

import { RELATIONAL_ECONOMIC_RECOVERY_AI_CONTEXT } from "./ai-context";

const FORBIDDEN = RELATIONAL_ECONOMIC_RECOVERY_AI_CONTEXT.forbidden.join(" ").toLowerCase();

describe("Instruction 20.29 — recovery wording guard", () => {
  it("does not advertise forbidden autopilot / wallet vocabulary", () => {
    expect(FORBIDDEN).toContain("autopilot");
    expect(FORBIDDEN).toContain("wallet");
    expect(FORBIDDEN).toContain("payment");
    expect(FORBIDDEN).toContain("order mutation");
  });
});
