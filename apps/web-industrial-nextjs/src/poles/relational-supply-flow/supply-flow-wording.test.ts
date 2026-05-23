import { describe, expect, it } from "vitest";

import { RELATIONAL_SUPPLY_FLOW_AI_CONTEXT } from "./ai-context";

const FORBIDDEN = RELATIONAL_SUPPLY_FLOW_AI_CONTEXT.forbidden.join(" ").toLowerCase();

describe("Instruction 20.24 — supply flow wording guard", () => {
  it("does not advertise forbidden logistics / payment vocabulary in AI context", () => {
    expect(FORBIDDEN).toContain("delivery tracking");
    expect(FORBIDDEN).toContain("truck tracking");
    expect(FORBIDDEN).toContain("gps");
    expect(FORBIDDEN).toContain("parcel tracking");
    expect(FORBIDDEN).toContain("wallet");
    expect(FORBIDDEN).toContain("payment");
  });
});
