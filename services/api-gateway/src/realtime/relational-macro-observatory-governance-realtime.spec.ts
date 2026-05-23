import { describe, expect, it } from "vitest";

import {
  isRelationalMacroObservatoryGovernanceRealtimeEventType,
  RelationalMacroObservatoryGovernanceRealtimeSchema,
} from "@venext/shared-contracts";

describe("relational-macro-observatory-governance realtime", () => {
  it("whitelists macro observatory governance realtime types", () => {
    expect(
      isRelationalMacroObservatoryGovernanceRealtimeEventType(
        "relational.macro_observatory_governance.matrix_generated",
      ),
    ).toBe(true);
    expect(
      isRelationalMacroObservatoryGovernanceRealtimeEventType(
        "relational.macro_observatory_governance.executive_coordination_detected",
      ),
    ).toBe(true);
    expect(
      isRelationalMacroObservatoryGovernanceRealtimeEventType("relational.strategic_observatory.grid_generated"),
    ).toBe(false);
  });

  it("parses strict minimal payload", () => {
    const p = RelationalMacroObservatoryGovernanceRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      macroObservatoryGovernanceNodeId: null,
      nodeCode: null,
      intensity: 50,
      governanceDepth: 2,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(true);
  });

  it("rejects forbidden paymentExecutionDisabled", () => {
    const p = RelationalMacroObservatoryGovernanceRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      macroObservatoryGovernanceNodeId: null,
      nodeCode: null,
      intensity: 50,
      governanceDepth: 2,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: false,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(false);
  });
});
