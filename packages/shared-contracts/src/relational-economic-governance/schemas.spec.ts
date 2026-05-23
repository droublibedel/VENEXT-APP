import { describe, expect, it } from "vitest";

import {
  isRelationalEconomicGovernanceRealtimeEventType,
  RelationalEconomicGovernanceRealtimeSchema,
} from "./schemas.js";

describe("relational-economic-governance schemas", () => {
  it("whitelists governance realtime types", () => {
    expect(isRelationalEconomicGovernanceRealtimeEventType("relational.governance.coordination_detected")).toBe(
      true,
    );
    expect(isRelationalEconomicGovernanceRealtimeEventType("relational.governance.unknown")).toBe(false);
    const rt = RelationalEconomicGovernanceRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      governanceNodeId: null,
      governanceNodeCode: null,
      intensity: 50,
      governanceDepth: 1,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(rt.success).toBe(true);
  });

  it("rejects forbidden extra fields on realtime", () => {
    const p = RelationalEconomicGovernanceRealtimeSchema.safeParse({
      relationshipId: null,
      governanceNodeId: null,
      governanceNodeCode: null,
      intensity: 10,
      governanceDepth: 0,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
      walletId: "x",
    });
    expect(p.success).toBe(false);
  });
});
