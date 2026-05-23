import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { RelationalSectorMarketStructureType, RelationalSectorPressureLevel } from "@prisma/client";

import { RelationalSectorPolicyService } from "./relational-sector-policy.service";
import { RelationalSectorRealtimeService } from "./relational-sector-realtime.service";
import { RelationalSectorStreamingService } from "./relational-sector-streaming.service";

describe("RelationalSectorStreamingService", () => {
  it("emits structured snapshot when no prior stream fingerprint exists", async () => {
    const rid = randomUUID();
    const nid = randomUUID();
    const buyer = randomUUID();
    const seller = randomUUID();
    const prisma = {
      relationalSectorNode: {
        findUnique: vi.fn().mockResolvedValue({ metadata: {} }),
        update: vi.fn().mockResolvedValue({}),
      },
    } as any;
    const publish = vi.fn().mockResolvedValue(undefined);
    const realtime = { publishStructuredCorridor: publish } as unknown as RelationalSectorRealtimeService;
    const svc = new RelationalSectorStreamingService(prisma, new RelationalSectorPolicyService(), realtime);
    const vector = {
      sectorConcentration: 10,
      corridorSaturation: 10,
      sectorDominance: 10,
      criticalDependency: 10,
      oligopolyRisk: 10,
      marketFragility: 10,
      operationalDensity: 10,
      cumulativePressure: 10,
      expansionCapacity: 50,
      diversificationGap: 20,
      explainers: [],
    };
    const r = await svc.publishAfterIngestion({
      relationshipId: rid,
      buyerOrganizationId: buyer,
      sellerOrganizationId: seller,
      nodes: [{ id: nid, sectorSlug: "A" }],
      vector,
      marketStructureType: RelationalSectorMarketStructureType.BALANCED,
      operationalRisk: 40,
      pressureLevel: RelationalSectorPressureLevel.MEDIUM,
      cascadePaths: [],
      maxDepthObserved: 0,
      edgeCount: 0,
      systemicExposureScore: 0,
    });
    expect(r.fingerprintChanged).toBe(true);
    expect(publish).toHaveBeenCalled();
  });
});
