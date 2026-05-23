import { describe, expect, it } from "vitest";
import {
  SectorRealtimeSchema,
  isRelationalSectorRealtimeEventType,
  safeParseRelationalSectorRealtimeBody,
} from "@venext/shared-contracts";

describe("Instruction 20.23 / 20.24 — relational.sector.* gateway contracts", () => {
  it("whitelist recognizes sector realtime types", () => {
    expect(isRelationalSectorRealtimeEventType("relational.sector.pressure_detected")).toBe(true);
    expect(isRelationalSectorRealtimeEventType("relational.sector.snapshot.updated")).toBe(true);
    expect(isRelationalSectorRealtimeEventType("relational.sector.unknown")).toBe(false);
  });

  it("structured snapshot payload rejects geo-only keys", () => {
    const parsed = safeParseRelationalSectorRealtimeBody("relational.sector.snapshot.updated", {
      eventId: "00000000-0000-4000-8000-000000000099",
      fingerprint: "c".repeat(32),
      streamRevision: 1,
      relationshipId: "00000000-0000-4000-8000-000000000001",
      kind: "snapshot",
      nodeCount: 1,
      sectorSlugs: ["A"],
      aggregateOperationalRisk: 10,
      marketStructureType: "BALANCED",
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
      zoneCode: "GEO:XX",
    });
    expect(parsed.ok).toBe(false);
  });

  it("rejects payloads with forbidden extra keys (strict)", () => {
    const parsed = SectorRealtimeSchema.safeParse({
      relationshipId: null,
      sectorNodeId: null,
      sectorCode: null,
      intensity: 10,
      propagationDepth: 2,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
      customerSegment: "VIP",
    });
    expect(parsed.success).toBe(false);
  });
});
