/**
 * Instruction 20.24A — ingestion governance + dependency persistence (mocked Prisma).
 */
import { CommercialCorridorState, RelationalSupplyFlowRiskLevel, RelationalSupplyFlowType } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { RelationalSupplyFlowBottleneckService } from "./relational-supply-flow-bottleneck.service";
import { RelationalSupplyFlowCorridorContextService } from "./relational-supply-flow-corridor-context.service";
import { RelationalSupplyFlowDependencyService } from "./relational-supply-flow-dependency.service";
import { RelationalSupplyFlowIngestionService } from "./relational-supply-flow-ingestion.service";
import { RelationalSupplyFlowNodeService } from "./relational-supply-flow-node.service";
import { RelationalSupplyFlowPolicyService } from "./relational-supply-flow-policy.service";
import { RelationalSupplyFlowPropagationService } from "./relational-supply-flow-propagation.service";
import { RelationalSupplyFlowRealtimeService } from "./relational-supply-flow-realtime.service";

const rid = "00000000-0000-4000-8000-0000000000a1";
const orgA = "00000000-0000-4000-8000-0000000000b1";
const orgB = "00000000-0000-4000-8000-0000000000b2";

const happyCorridorLoad = {
  relationshipId: rid,
  hasOrder: true,
  orderId: "00000000-0000-4000-8000-0000000000c1",
  buyerOrganizationId: orgA,
  sellerOrganizationId: orgB,
  territoryCountry: "SN",
  territoryCity: "DK",
  sectorNodeId: null,
  geoZoneId: null,
  productFlowCategories: [{ category: "CAT_A", relationalVolume: 12 }],
  dominantProductCategory: "CAT_A",
  volumeConfidenceLevel: "MEDIUM" as const,
  heuristicFallbackUsed: false,
  fallbackReasons: [] as string[],
  openIncidentCount: 0,
  coordinationOpenCount: 0,
  blockingFulfillmentTaskCount: 0,
  pressureScore: 44,
  fragilityScore: 33,
  geoFragilityScore: 20,
  sectorMaxOperationalRisk: 40,
  predictiveUnresolvedCount: 1,
  predictiveUnresolvedAvgScore: 50,
  strategicMemoryActiveCount: 1,
  strategicMemoryAvgConfidence: 60,
  operationalMetricStress: 12,
  operationalMetricsUsed: 3,
  peerCorridorEdgeCount: 2,
};

function buildIngestion(
  prisma: Record<string, unknown>,
  corridorLoad?: ReturnType<typeof vi.fn>,
): RelationalSupplyFlowIngestionService {
  const flags = { isEnabled: vi.fn().mockResolvedValue(true) } as unknown as CanonicalFeatureFlagEvaluator;
  const governance = { assertCorridorOperational: vi.fn().mockResolvedValue(undefined) };
  const policy = new RelationalSupplyFlowPolicyService();
  const corridorContext = {
    load: corridorLoad ?? vi.fn().mockResolvedValue(happyCorridorLoad),
  } as unknown as RelationalSupplyFlowCorridorContextService;
  const nodes = new RelationalSupplyFlowNodeService(prisma as never, policy);
  const bottleneck = new RelationalSupplyFlowBottleneckService(policy);
  const dependency = new RelationalSupplyFlowDependencyService(prisma as never, policy);
  const propagation = new RelationalSupplyFlowPropagationService(prisma as never, policy);
  const realtime = { publishToOrganizations: vi.fn().mockResolvedValue(undefined) } as unknown as RelationalSupplyFlowRealtimeService;
  const macroIngestion = {
    syncMacroEconomicState: vi.fn().mockResolvedValue(undefined),
  };
  return new RelationalSupplyFlowIngestionService(
    prisma as never,
    flags,
    governance as never,
    policy,
    corridorContext,
    nodes,
    bottleneck,
    dependency,
    propagation,
    realtime,
    macroIngestion as never,
  );
}

describe("RelationalSupplyFlowIngestionService.syncSupplyFlowState", () => {
  it("TERMINATED corridor performs no Prisma mutations", async () => {
    const upsert = vi.fn();
    const update = vi.fn();
    const create = vi.fn();
    const del = vi.fn();
    const prisma = {
      relationship: {
        findUnique: vi.fn().mockResolvedValue({
          corridorState: CommercialCorridorState.TERMINATED,
          requesterOrganizationId: orgA,
          receiverOrganizationId: orgB,
        }),
      },
      relationalSupplyFlowNode: { upsert, findMany: vi.fn(), update },
      relationalSupplyFlowEdge: { deleteMany: del, create: vi.fn() },
      relationalSupplyFlowEvent: { count: vi.fn(), create },
      relationalSupplyFlowSignal: { deleteMany: del, create: vi.fn() },
      relationalFulfillmentRecord: { count: vi.fn() },
    };
    const corridorSpy = vi.fn();
    await buildIngestion(prisma, corridorSpy).syncSupplyFlowState(rid);
    expect(corridorSpy).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
    expect(del).not.toHaveBeenCalled();
  });

  it("ACTIVE but no order skips materialization (corridor context only)", async () => {
    const upsert = vi.fn();
    const prisma = {
      relationship: {
        findUnique: vi.fn().mockResolvedValue({
          corridorState: CommercialCorridorState.ACTIVE,
          requesterOrganizationId: orgA,
          receiverOrganizationId: orgB,
        }),
      },
      relationalSupplyFlowNode: { upsert, findMany: vi.fn(), update: vi.fn() },
      relationalSupplyFlowEdge: { deleteMany: vi.fn(), create: vi.fn() },
      relationalSupplyFlowEvent: { count: vi.fn(), create: vi.fn() },
      relationalSupplyFlowSignal: { deleteMany: vi.fn(), create: vi.fn() },
      relationalFulfillmentRecord: { count: vi.fn() },
    };
    const corridorLoad = vi.fn().mockResolvedValue({
      ...happyCorridorLoad,
      hasOrder: false,
      orderId: null,
      buyerOrganizationId: null,
      sellerOrganizationId: null,
      heuristicFallbackUsed: true,
      fallbackReasons: ["no_order_for_corridor"],
    });
    await buildIngestion(prisma, corridorLoad).syncSupplyFlowState(rid);
    expect(corridorLoad).toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("ACTIVE with order persists dependency edge and touches nodes", async () => {
    const edgeCreate = vi.fn().mockResolvedValue({ id: "e1" });
    const upsert = vi
      .fn()
      .mockResolvedValueOnce({
        id: "p1",
        flowCode: `FLOW:${rid}:PRIMARY_DIRECT`,
        flowType: RelationalSupplyFlowType.CORRIDOR_PRODUCT,
        riskLevel: RelationalSupplyFlowRiskLevel.LOW,
      })
      .mockResolvedValueOnce({
        id: "s1",
        flowCode: `FLOW:${rid}:SECONDARY_CAPACITY`,
        flowType: RelationalSupplyFlowType.FULFILLMENT_COUPLING,
        riskLevel: RelationalSupplyFlowRiskLevel.LOW,
      });
    const prisma = {
      relationship: {
        findUnique: vi.fn().mockResolvedValue({
          corridorState: CommercialCorridorState.ACTIVE,
          requesterOrganizationId: orgA,
          receiverOrganizationId: orgB,
        }),
      },
      relationalSupplyFlowNode: {
        upsert,
        findMany: vi.fn((args: { where?: { id?: { in?: string[] }; active?: boolean } }) => {
          if (args?.where?.id?.in) {
            return Promise.resolve([
              {
                id: "p1",
                flowCode: `FLOW:${rid}:PRIMARY_DIRECT`,
                flowType: RelationalSupplyFlowType.CORRIDOR_PRODUCT,
                diagnostics: {},
                fulfillmentReliabilityScore: 80,
                flowStabilityScore: 80,
                bottleneckScore: 12,
                riskLevel: RelationalSupplyFlowRiskLevel.LOW,
              },
              {
                id: "s1",
                flowCode: `FLOW:${rid}:SECONDARY_CAPACITY`,
                flowType: RelationalSupplyFlowType.FULFILLMENT_COUPLING,
                diagnostics: {},
                fulfillmentReliabilityScore: 80,
                flowStabilityScore: 80,
                bottleneckScore: 12,
                riskLevel: RelationalSupplyFlowRiskLevel.LOW,
              },
            ]);
          }
          return Promise.resolve([
            {
              id: "p1",
              flowCode: `FLOW:${rid}:PRIMARY_DIRECT`,
              flowType: RelationalSupplyFlowType.CORRIDOR_PRODUCT,
              bottleneckScore: 12,
              riskLevel: RelationalSupplyFlowRiskLevel.LOW,
            },
          ]);
        }),
        update: vi.fn(),
      },
      relationalSupplyFlowEdge: {
        findMany: vi.fn().mockResolvedValue([]),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        create: edgeCreate,
      },
      relationalSupplyFlowEvent: { count: vi.fn().mockResolvedValue(1), create: vi.fn() },
      relationalSupplyFlowSignal: { deleteMany: vi.fn(), create: vi.fn() },
      relationalFulfillmentRecord: { count: vi.fn().mockResolvedValue(0) },
    };
    await buildIngestion(prisma).syncSupplyFlowState(rid);
    expect(upsert).toHaveBeenCalled();
    expect(edgeCreate).toHaveBeenCalled();
  });
});
