import { describe, expect, it } from "vitest";
import { GeoEconomicRealtimeSchema, isRelationalGeoEconomicRealtimeEventType } from "@venext/shared-contracts";

describe("Instruction 20.22 — relational.geo.* gateway contracts", () => {
  it("whitelist recognizes geo-economic realtime types", () => {
    expect(isRelationalGeoEconomicRealtimeEventType("relational.geo.zone_pressure_detected")).toBe(true);
    expect(isRelationalGeoEconomicRealtimeEventType("relational.geo.unknown")).toBe(false);
  });

  it("rejects payloads with forbidden extra keys (strict)", () => {
    const parsed = GeoEconomicRealtimeSchema.safeParse({
      relationshipId: null,
      zoneCode: null,
      territorialIntensity: 10,
      propagationDepth: 2,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
      latitude: 1,
    });
    expect(parsed.success).toBe(false);
  });
});
