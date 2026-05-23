import { describe, expect, it } from "vitest";
import { RelationalOrderDiagnosticsSchema } from "@venext/shared-contracts";

import { makeTestRelationalOrderDiagnostics } from "./relational-order-diagnostics.fixture";

describe("Instruction 20.0 — diagnostics honesty literals", () => {
  it("requires corridor / non-marketplace / non-payment honesty flags", () => {
    const base = makeTestRelationalOrderDiagnostics();
    expect(RelationalOrderDiagnosticsSchema.safeParse(base).success).toBe(true);
    expect(RelationalOrderDiagnosticsSchema.safeParse({ ...base, paymentNotIntegrated: false }).success).toBe(false);
  });
});
