import { describe, expect, it } from "vitest";

import { RELATIONAL_ECONOMIC_SOVEREIGNTY_AI_CONTEXT } from "./ai-context";

const FORBIDDEN = RELATIONAL_ECONOMIC_SOVEREIGNTY_AI_CONTEXT.forbidden.join(" ").toLowerCase();

describe("Instruction 20.27 — sovereignty wording guard", () => {
  it("does not advertise forbidden ERP / banking / generative vocabulary", () => {
    expect(FORBIDDEN).toContain("erp");
    expect(FORBIDDEN).toContain("wallet");
    expect(FORBIDDEN).toContain("generative ai");
    expect(FORBIDDEN).toContain("banking");
  });
});
