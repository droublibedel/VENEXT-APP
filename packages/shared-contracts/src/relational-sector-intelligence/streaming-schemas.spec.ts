import { describe, expect, it } from "vitest";
import {
  RELATIONAL_SECTOR_STRUCTURED_REALTIME_TYPES,
  SectorSnapshotUpdatedPayloadSchema,
  safeParseRelationalSectorRealtimeBody,
} from "./schemas.js";

describe("Instruction 20.24 — sector streaming contracts", () => {
  it("structured event types are distinct from geo prefix", () => {
    for (const t of RELATIONAL_SECTOR_STRUCTURED_REALTIME_TYPES) {
      expect(t.startsWith("relational.sector.")).toBe(true);
      expect(t.startsWith("relational.geo.")).toBe(false);
    }
  });

  it("safeParse accepts snapshot.updated strict payloads", () => {
    const body = {
      eventId: "00000000-0000-4000-8000-000000000099",
      fingerprint: "a".repeat(32),
      streamRevision: 3,
      relationshipId: "00000000-0000-4000-8000-000000000001",
      kind: "snapshot" as const,
      nodeCount: 2,
      sectorSlugs: ["REQ_X", "RCV_Y"],
      aggregateOperationalRisk: 44,
      marketStructureType: "BALANCED",
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    };
    expect(SectorSnapshotUpdatedPayloadSchema.safeParse(body).success).toBe(true);
    const p = safeParseRelationalSectorRealtimeBody("relational.sector.snapshot.updated", body);
    expect(p.ok).toBe(true);
  });

  it("safeParse rejects unknown extra keys on structured payloads", () => {
    const body = {
      eventId: "00000000-0000-4000-8000-000000000099",
      fingerprint: "b".repeat(32),
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
      customerSegment: "x",
    };
    const p = safeParseRelationalSectorRealtimeBody("relational.sector.snapshot.updated", body);
    expect(p.ok).toBe(false);
  });
});
