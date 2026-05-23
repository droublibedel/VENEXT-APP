import { describe, expect, it } from "vitest";

import {
  isRelationalEconomicGovernanceRealtimeEventType,
  RelationalEconomicGovernanceRealtimeSchema,
} from "@venext/shared-contracts";

describe("relational-economic-governance realtime", () => {
  it("whitelists governance realtime types", () => {
    expect(isRelationalEconomicGovernanceRealtimeEventType("relational.governance.coordination_detected")).toBe(
      true,
    );
    expect(isRelationalEconomicGovernanceRealtimeEventType("relational.governance.balance_updated")).toBe(true);
    expect(isRelationalEconomicGovernanceRealtimeEventType("relational.governance.unknown")).toBe(false);
  });

  it("parses strict minimal payload", () => {
    const p = RelationalEconomicGovernanceRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      governanceNodeId: null,
      governanceNodeCode: null,
      intensity: 50,
      governanceDepth: 2,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(true);
  });
});
