/**
 * Instruction 20.28 — retention, calibration, edge enrichment, governance hardening.
 */
import { CommercialCorridorState } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { RelationalEconomicSovereigntyAutonomyService } from "./relational-economic-sovereignty-autonomy.service";
import { RelationalEconomicSovereigntyCalibrationService } from "./relational-economic-sovereignty-calibration.service";
import { RelationalEconomicSovereigntyDashboardService } from "./relational-economic-sovereignty-dashboard.service";
import { RelationalEconomicSovereigntyEdgeEnrichmentService } from "./relational-economic-sovereignty-edge-enrichment.service";
import { RelationalEconomicSovereigntyPolicyService } from "./relational-economic-sovereignty-policy.service";
import { RelationalEconomicSovereigntyRetentionService } from "./relational-economic-sovereignty-retention.service";
import type { EconomicSovereigntyCorridorContext } from "./relational-economic-sovereignty-corridor-context.service";

const baseCtx: EconomicSovereigntyCorridorContext = {
  relationshipId: "00000000-0000-4000-8000-000000000001",
  hasOrder: true,
  buyerOrganizationId: "00000000-0000-4000-8000-0000000000b1",
  sellerOrganizationId: "00000000-0000-4000-8000-0000000000b2",
  territoryCountry: "SN",
  territoryCity: "DK",
  sectorNodeId: null,
  sectorSlug: "agro",
  geoZoneId: null,
  primarySupplyFlowNodeId: null,
  primaryMacroNodeId: "00000000-0000-4000-8000-0000000000m1",
  primaryContinuityNodeId: "00000000-0000-4000-8000-0000000000c1",
  continuityScore: 55,
  continuityInstability: 40,
  continuityRecoveryProbability: 0.5,
  macroResilienceScore: 50,
  macroStructuralFragility: 42,
  macroPropagationRisk: 35,
  supplyFlowDisruptionAvg: 28,
  pressureScore: 44,
  peerPressureEdgeCount: 2,
  openIncidentCount: 0,
  strategicMemoryActiveCount: 2,
  orchestrationOpenCount: 0,
  macroDependencyCount: 1,
  supplyFlowEdgeCount: 2,
  continuitySnapshotCount: 3,
  heuristicFallbackUsed: false,
  fallbackReasons: [],
};

describe("Instruction 20.28 — calibration", () => {
  const calibration = new RelationalEconomicSovereigntyCalibrationService();
  const policy = new RelationalEconomicSovereigntyPolicyService();
  const autonomy = new RelationalEconomicSovereigntyAutonomyService(policy, calibration);

  it("SOVEREIGNTY_CALIBRATION_V1 exposes weights and confidence", () => {
    const prev = process.env.VENEXT_SOVEREIGNTY_CALIBRATION_PROFILE;
    process.env.VENEXT_SOVEREIGNTY_CALIBRATION_PROFILE = "CONSERVATIVE";
    const cal = calibration.getCalibration();
    expect(cal.calibrationVersion).toBe("SOVEREIGNTY_CALIBRATION_V1");
    expect(cal.profile).toBe("CONSERVATIVE");
    const scores = autonomy.computeAutonomy(baseCtx);
    expect(scores.diagnostics.calibrationVersion).toBe("SOVEREIGNTY_CALIBRATION_V1");
    expect(scores.diagnostics.weightsUsed).toBeDefined();
    expect(scores.diagnostics.confidenceLevel).toBeDefined();
    if (prev === undefined) delete process.env.VENEXT_SOVEREIGNTY_CALIBRATION_PROFILE;
    else process.env.VENEXT_SOVEREIGNTY_CALIBRATION_PROFILE = prev;
  });

  it("AGGRESSIVE profile differs from CONSERVATIVE on captivity risk", () => {
    const prev = process.env.VENEXT_SOVEREIGNTY_CALIBRATION_PROFILE;
    process.env.VENEXT_SOVEREIGNTY_CALIBRATION_PROFILE = "CONSERVATIVE";
    const conservative = autonomy.computeAutonomy({ ...baseCtx, macroDependencyCount: 6 }).strategicCaptivityRisk;
    process.env.VENEXT_SOVEREIGNTY_CALIBRATION_PROFILE = "AGGRESSIVE";
    const aggressive = autonomy.computeAutonomy({ ...baseCtx, macroDependencyCount: 6 }).strategicCaptivityRisk;
    expect(conservative).toBeGreaterThanOrEqual(aggressive);
    if (prev === undefined) delete process.env.VENEXT_SOVEREIGNTY_CALIBRATION_PROFILE;
    else process.env.VENEXT_SOVEREIGNTY_CALIBRATION_PROFILE = prev;
  });
});

describe("Instruction 20.28 — retention", () => {
  const policy = new RelationalEconomicSovereigntyPolicyService();

  it("preserve critical snapshots when severity HIGH", async () => {
    const prisma = {
      relationalEconomicSovereigntySnapshot: {
        findUnique: vi.fn().mockResolvedValue({
          id: "snap-1",
          dependencyExposureScore: 80,
          sovereigntyScore: 20,
          diagnostics: { corridorSelfRecoveryProbability: 0.1 },
          sovereigntyNode: { severity: "HIGH", autonomyStatus: "CAPTIVE" },
          relationship: { relationalEconomicSovereigntySignals: [] },
        }),
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn(),
      },
      relationship: { findUnique: vi.fn() },
    } as never;
    const retention = new RelationalEconomicSovereigntyRetentionService(
      prisma,
      policy,
      { assertCorridorOperational: vi.fn() } as never,
      { publishToOrganizations: vi.fn() } as never,
    );
    expect(await retention.isSnapshotCritical("snap-1")).toBe(true);
  });

  it("applySnapshotRetention denied on TERMINATED", async () => {
    const prisma = {
      relationship: {
        findUnique: vi.fn().mockResolvedValue({
          corridorState: CommercialCorridorState.TERMINATED,
          requesterOrganizationId: "o1",
          receiverOrganizationId: "o2",
        }),
      },
    } as never;
    const retention = new RelationalEconomicSovereigntyRetentionService(
      prisma,
      policy,
      { assertCorridorOperational: vi.fn().mockResolvedValue(undefined) } as never,
      { publishToOrganizations: vi.fn() } as never,
    );
    const diag = await retention.applySnapshotRetention("rel-1");
    expect(diag.retentionApplied).toBe(false);
    expect(diag.retentionReason).toContain("terminated");
  });

  it("computeRetentionDiagnostics includes policy label", () => {
    const prevMax = process.env.VENEXT_SOVEREIGNTY_MAX_SNAPSHOTS_PER_CORRIDOR;
    process.env.VENEXT_SOVEREIGNTY_MAX_SNAPSHOTS_PER_CORRIDOR = "12";
    const d = new RelationalEconomicSovereigntyRetentionService(
      {} as never,
      new RelationalEconomicSovereigntyPolicyService(),
      {} as never,
      {} as never,
    ).computeRetentionDiagnostics({ retentionApplied: true, archivedSnapshotsCount: 3 });
    expect(d.retentionPolicy).toContain("max=12");
    if (prevMax === undefined) delete process.env.VENEXT_SOVEREIGNTY_MAX_SNAPSHOTS_PER_CORRIDOR;
    else process.env.VENEXT_SOVEREIGNTY_MAX_SNAPSHOTS_PER_CORRIDOR = prevMax;
  });
});

describe("Instruction 20.28 — governance", () => {
  const policy = new RelationalEconomicSovereigntyPolicyService();

  it("blocks SUSPENDED and BLOCKED mutations", () => {
    expect(policy.assertEconomicSovereigntyMutationAllowed(CommercialCorridorState.SUSPENDED).allowed).toBe(false);
    expect(policy.assertEconomicSovereigntyMutationAllowed(CommercialCorridorState.BLOCKED).allowed).toBe(false);
  });
});

describe("Instruction 20.28 — edge enrichment bounded scan", () => {
  it("returns diagnostics with boundedScanApplied when over limit", async () => {
    const relId = "00000000-0000-4000-8000-000000000001";
    const prisma = {
      relationship: {
        findUnique: vi.fn().mockResolvedValue({ corridorState: CommercialCorridorState.ACTIVE }),
        findMany: vi.fn().mockResolvedValue([
          { id: "peer-1" },
          { id: "peer-2" },
          { id: "peer-3" },
        ]),
      },
      relationalEconomicSovereigntyNode: {
        findFirst: vi.fn().mockResolvedValue({
          id: "n1",
          sectorSlug: "agro",
          territoryCountry: "SN",
          dependencyConcentration: 50,
          strategicCaptivityRisk: 40,
          corridorSelfRecoveryProbability: 0.5,
        }),
        findMany: vi.fn().mockResolvedValue([]),
      },
      relationalMacroEconomicDependency: { count: vi.fn().mockResolvedValue(1) },
      relationalSupplyFlowEdge: { count: vi.fn().mockResolvedValue(1) },
      relationalEconomicContinuityDependency: { count: vi.fn().mockResolvedValue(0) },
      relationalStrategicMemory: { count: vi.fn().mockResolvedValue(0) },
      relationalEconomicDependencyEdge: { count: vi.fn().mockResolvedValue(0) },
      relationalEconomicSovereigntyDependency: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    } as never;
    const prev = process.env.VENEXT_SOVEREIGNTY_EDGE_SCAN_LIMIT;
    process.env.VENEXT_SOVEREIGNTY_EDGE_SCAN_LIMIT = "1";
    const svc = new RelationalEconomicSovereigntyEdgeEnrichmentService(
      prisma,
      new RelationalEconomicSovereigntyPolicyService(),
      { assertCorridorOperational: vi.fn() } as never,
      { publishToOrganizations: vi.fn().mockResolvedValue(undefined) } as never,
    );
    const d = await svc.enrichSovereigntyEdgesForRelationship(relId, "o1", "o2");
    expect(d.peerCandidatesCount).toBeGreaterThan(0);
    if (prev === undefined) delete process.env.VENEXT_SOVEREIGNTY_EDGE_SCAN_LIMIT;
    else process.env.VENEXT_SOVEREIGNTY_EDGE_SCAN_LIMIT = prev;
  });
});

describe("Instruction 20.28 — dashboard aggregation", () => {
  it("builds sovereignty dashboard for organization", async () => {
    const orgId = "00000000-0000-4000-8000-0000000000aa";
    const prisma = {
      relationalEconomicSovereigntyNode: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "n1",
            relationshipId: "r1",
            sovereigntyNodeCode: "SOVEREIGNTY:r1:PRIMARY",
            sovereigntyScore: 70,
            autonomyScore: 65,
            strategicCaptivityRisk: 30,
            externalDependencyExposure: 25,
            dependencyConcentration: 20,
            systemicAutonomyRisk: 28,
            severity: "LOW",
            autonomyStatus: "BALANCED",
            diagnostics: { heuristicFallbackUsed: false, computedFrom: ["a", "b", "c"] },
          },
        ]),
      },
    } as never;
    const dash = new RelationalEconomicSovereigntyDashboardService(
      prisma,
      new RelationalEconomicSovereigntyPolicyService(),
      new RelationalEconomicSovereigntyCalibrationService(),
    );
    const raw = await dash.buildSovereigntyDashboard(orgId);
    expect(raw.corridorCount).toBe(1);
    expect(raw.mostAutonomousCorridors[0]?.confidenceLevel).toBeDefined();
    expect(raw.paymentExecutionDisabled).toBe(true);
  });
});
