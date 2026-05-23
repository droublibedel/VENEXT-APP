import { describe, expect, it } from "vitest";
import { RelationalOrdersResponseSchema } from "@venext/shared-contracts";

import { makeTestRelationalOrderDiagnostics } from "./relational-order-diagnostics.fixture";

describe("Instruction 20.0A — diagnostics contract", () => {
  it("includes wholesaler catalog vs order scope clarification", () => {
    const d = makeTestRelationalOrderDiagnostics();
    expect(d.orderScopeMode).toBe("INCIDENT_RELATION_ORDERS");
    expect(d.catalogScopeContrast).toContain("CATALOG_READ_IS_UPSTREAM_FOR_WHOLESALER");
    expect(d.scopeExplanation.length).toBeGreaterThan(20);
  });

  it("marks EXPIRED as unsupported readiness and can flag requestedStatusUnsupported", () => {
    const d = makeTestRelationalOrderDiagnostics({
      requestedStatusUnsupported: true,
    });
    expect(d.statusReadiness.EXPIRED).toBe("NOT_CONNECTED_YET_NO_EXPIRY_SOURCE");
    expect(d.requestedStatusUnsupported).toBe(true);
  });

  it("parses ACTIVE response with full 20.0A diagnostics", () => {
    const oid = "71111111-1111-1111-1111-111111111101";
    const parsed = RelationalOrdersResponseSchema.safeParse({
      policy: "ACTIVE",
      snapshot: {
        version: "1",
        generatedAt: new Date().toISOString(),
        organizationId: oid,
        viewerRole: "WHOLESALER",
        orders: [],
        diagnostics: makeTestRelationalOrderDiagnostics({ viewerScopeMode: "WHOLESALER_UPSTREAM_ONLY" }),
      },
    });
    expect(parsed.success).toBe(true);
  });
});
