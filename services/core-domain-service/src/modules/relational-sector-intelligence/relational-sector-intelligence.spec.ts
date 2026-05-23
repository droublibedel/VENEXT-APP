/**
 * Instruction 20.23 — deterministic sector intelligence engines (bounded, explainable).
 */
import { CommercialCorridorState } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { RelationalSectorExpansionService } from "./relational-sector-expansion.service";
import { RelationalSectorMarketStructureService } from "./relational-sector-market-structure.service";
import { RelationalSectorPolicyService } from "./relational-sector-policy.service";
import { RelationalSectorPropagationService } from "./relational-sector-propagation.service";

describe("RelationalSectorPolicyService", () => {
  const policy = new RelationalSectorPolicyService();

  it("canMutateSectorState forbids TERMINATED but keeps degraded / blocked readable paths", () => {
    expect(policy.canMutateSectorState(CommercialCorridorState.TERMINATED)).toBe(false);
    expect(policy.canMutateSectorState(CommercialCorridorState.DEGRADED)).toBe(true);
    expect(policy.canMutateSectorState(CommercialCorridorState.BLOCKED)).toBe(true);
    expect(policy.canMutateSectorState(CommercialCorridorState.ACTIVE)).toBe(true);
  });

  it("VENEXT_SECTOR_PROPAGATION_MAX_DEPTH clamps propagation depth", () => {
    const prev = process.env.VENEXT_SECTOR_PROPAGATION_MAX_DEPTH;
    process.env.VENEXT_SECTOR_PROPAGATION_MAX_DEPTH = "3";
    expect(new RelationalSectorPolicyService().maxPropagationDepth()).toBe(3);
    process.env.VENEXT_SECTOR_PROPAGATION_MAX_DEPTH = "999";
    expect(new RelationalSectorPolicyService().maxPropagationDepth()).toBe(32);
    if (prev === undefined) delete process.env.VENEXT_SECTOR_PROPAGATION_MAX_DEPTH;
    else process.env.VENEXT_SECTOR_PROPAGATION_MAX_DEPTH = prev;
  });
});

describe("RelationalSectorMarketStructureService", () => {
  it("computeMarketStructureVector keeps components within 0..100", () => {
    const policy = new RelationalSectorPolicyService();
    const svc = new RelationalSectorMarketStructureService(policy);
    const v = svc.computeMarketStructureVector({
      pressureScore: 999,
      fragilityScore: 999,
      dependencyDensity: 999,
      peerCount: 80,
      geoZoneAvgPressure: 999,
      fulfillmentStress: 999,
      sectorPairCount: 0,
    });
    for (const [k, val] of Object.entries(v)) {
      if (k === "explainers") continue;
      expect(typeof val).toBe("number");
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(100);
    }
  });
});

describe("RelationalSectorPropagationService", () => {
  it("BFS respects VENEXT_SECTOR_PROPAGATION_MAX_DEPTH", async () => {
    const prev = process.env.VENEXT_SECTOR_PROPAGATION_MAX_DEPTH;
    process.env.VENEXT_SECTOR_PROPAGATION_MAX_DEPTH = "1";
    const policy = new RelationalSectorPolicyService();
    const a = "00000000-0000-4000-8000-000000000001";
    const b = "00000000-0000-4000-8000-000000000002";
    const c = "00000000-0000-4000-8000-000000000003";
    const prisma = {
      relationalSectorNode: {
        findMany: vi.fn().mockResolvedValue([{ id: a }, { id: b }, { id: c }]),
      },
      relationalSectorDependency: {
        findMany: vi
          .fn()
          .mockResolvedValue([
            { sourceSectorId: a, targetSectorId: b },
            { sourceSectorId: b, targetSectorId: c },
          ]),
      },
    } as any;
    const svc = new RelationalSectorPropagationService(prisma, policy);
    const r = await svc.projectInterSectorPropagation("00000000-0000-4000-8000-00000000abcd");
    if (prev === undefined) delete process.env.VENEXT_SECTOR_PROPAGATION_MAX_DEPTH;
    else process.env.VENEXT_SECTOR_PROPAGATION_MAX_DEPTH = prev;
    expect(r.maxDepthObserved).toBeLessThanOrEqual(1);
    expect(r.cascadePaths.length).toBeGreaterThan(0);
  });
});

describe("RelationalSectorExpansionService", () => {
  it("buildOpportunities returns bounded scores", () => {
    const policy = new RelationalSectorPolicyService();
    const svc = new RelationalSectorExpansionService(policy);
    const rows = svc.buildOpportunities([
      { sectorSlug: "REQ", expansionPotentialScore: 400, concentration: 400 },
      { sectorSlug: "RCV", expansionPotentialScore: -40, concentration: 900 },
    ]);
    for (const row of rows) {
      expect(row.score).toBeGreaterThanOrEqual(0);
      expect(row.score).toBeLessThanOrEqual(100);
    }
  });
});
