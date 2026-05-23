import { describe, expect, it } from "vitest";

import { RELATIONAL_ECONOMIC_CONTINUITY_AI_CONTEXT } from "./ai-context";

const FORBIDDEN = RELATIONAL_ECONOMIC_CONTINUITY_AI_CONTEXT.forbidden.join(" ").toLowerCase();

describe("Instruction 20.26 — economic continuity wording guard", () => {
  it("does not advertise forbidden ERP / autopilot / generative vocabulary", () => {
    expect(FORBIDDEN).toContain("gps");
    expect(FORBIDDEN).toContain("wallet");
    expect(FORBIDDEN).toContain("payment");
    expect(FORBIDDEN).toContain("generative ai");
    expect(FORBIDDEN).toContain("autonomous autopilot");
    expect(FORBIDDEN).toContain("erp automation");
  });
});
