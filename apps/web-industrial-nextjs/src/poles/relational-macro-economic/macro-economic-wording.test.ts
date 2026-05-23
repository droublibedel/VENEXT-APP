import { describe, expect, it } from "vitest";

import { RELATIONAL_MACRO_ECONOMIC_AI_CONTEXT } from "./ai-context";

const FORBIDDEN = RELATIONAL_MACRO_ECONOMIC_AI_CONTEXT.forbidden.join(" ").toLowerCase();

describe("Instruction 20.25 — macro-economic wording guard", () => {
  it("does not advertise forbidden logistics / payment / generative vocabulary", () => {
    expect(FORBIDDEN).toContain("delivery tracking");
    expect(FORBIDDEN).toContain("gps");
    expect(FORBIDDEN).toContain("wallet");
    expect(FORBIDDEN).toContain("payment");
    expect(FORBIDDEN).toContain("generative ai");
  });
});
